const AdivahaFlightService = require('../integrations/adivaha/adivaha.service');
const prisma = require('../config/prisma');
const emailService = require('../services/email.service');
const pdfService = require('../services/pdf.service');
const { getInvoiceHTML } = require('../utils/invoiceTemplate');

/**
 * Revalidate flight (Fare Quote)
 */
exports.revalidateBooking = async (req, res, next) => {
    try {
        const { traceId, resultIndex, EndUserIp } = req.body;
        
        if (!traceId || !resultIndex) {
            return res.status(400).json({ success: false, message: 'traceId and resultIndex are required' });
        }

        const adivahaRes = await AdivahaFlightService.getFlightFareQuote({
            TraceId: traceId,
            ResultIndex: resultIndex,
            EndUserIp: EndUserIp || '127.0.0.1' // Provide default IP if none passed
        });

        res.status(200).json({ success: true, data: adivahaRes });
    } catch (error) {
        console.error('Revalidate Booking Error:', error);
        res.status(500).json({ success: false, message: 'Failed to revalidate booking', error: error.message });
    }
};

/**
 * Confirm flight booking & save to Database
 */
exports.confirmBooking = async (req, res, next) => {
    try {
        const { 
            isLCC, 
            traceId, 
            resultIndex, 
            passengers, 
            contactDetails, 
            paymentData, 
            flightSnapshot,
            ssrSelections,
            userId // optional
        } = req.body;

        // 1. Call Adivaha API to book the ticket
        const adivahaRes = await AdivahaFlightService.bookFlight({
            isLCC,
            TraceId: traceId,
            ResultIndex: resultIndex,
            Passengers: passengers,
            ContactDetails: contactDetails
        });

        // Extract PNR and Booking ID from Adivaha Response
        // Since Adivaha response format can vary, we try common paths
        const responseData = adivahaRes?.responseData?.Response || adivahaRes?.Response || adivahaRes;
        
        // If the booking fails from Adivaha side
        if (responseData?.Error?.ErrorCode !== 0 && responseData?.Error?.ErrorCode !== undefined) {
            return res.status(400).json({ 
                success: false, 
                message: 'Adivaha Booking Failed', 
                error: responseData.Error 
            });
        }

        const pnr = responseData?.PNR || responseData?.BookingId || 'PENDING_PNR';
        const providerBookingId = responseData?.BookingId || 0;
        const ticketStatus = responseData?.TicketStatus || (isLCC ? 'TICKETED' : 'BOOKED');

        // 2. Find or Create User if not logged in
        let actualUserId = userId || null;
        
        if (!actualUserId && contactDetails?.Email) {
            let user = await prisma.users.findUnique({
                where: { email: contactDetails.Email }
            });
            
            if (!user) {
                user = await prisma.users.create({
                    data: {
                        email: contactDetails.Email,
                        phone: contactDetails.ContactNo || null,
                        first_name: passengers?.[0]?.FirstName || 'Guest',
                        last_name: passengers?.[0]?.LastName || 'User',
                        user_type: 'GUEST'
                    }
                });
            }
            actualUserId = user.id;
        }

        // 3. Save the Booking to Prisma Database inside a Transaction
        const savedBooking = await prisma.$transaction(async (tx) => {
            // A. Create the master Booking record
            const booking = await tx.bookings.create({
                data: {
                    booking_id: `BKG-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Generate unique booking ID
                    user_id: actualUserId,
                    booking_type: 'FLIGHT',
                    status: 'CONFIRMED',
                    total_amount: flightSnapshot?.price ? parseFloat(flightSnapshot.price.replace(/,/g, '')) : 0,
                    currency: 'INR',
                }
            });

            // B. Create the Flight Booking details record
            const flightBooking = await tx.flight_bookings.create({
                data: {
                    booking_id: booking.booking_id,
                    user_id: actualUserId,
                    provider_booking_id: parseInt(providerBookingId) || 0,
                    provider_order_id: paymentData?.razorpay_order_id || 'UNKNOWN',
                    trace_id: traceId,
                    pnr: pnr,
                    validating_airline: flightSnapshot?.airlineCode || 'XX',
                    origin_airport: flightSnapshot?.from || 'XXX',
                    destination_airport: flightSnapshot?.to || 'XXX',
                    // Optional chaining to safely parse dates if they exist
                    departure_date: flightSnapshot?.raw?.Segments?.[0]?.[0]?.Origin?.DepTime 
                                    ? new Date(flightSnapshot.raw.Segments[0][0].Origin.DepTime) 
                                    : new Date(),
                    total_fare: flightSnapshot?.price ? parseFloat(flightSnapshot.price.replace(/,/g, '')) : 0,
                    offered_fare: flightSnapshot?.price ? parseFloat(flightSnapshot.price.replace(/,/g, '')) : 0,
                    currency: 'INR',
                    ticket_status: ticketStatus,
                    booking_status: 'CONFIRMED',
                    is_lcc: isLCC || false,
                    total_passengers: passengers?.length || 1,
                    distance_km: 0,
                    raw_response: adivahaRes // Save raw provider response for debugging
                }
            });

            // C. Save co_travellers if actualUserId is provided
            if (actualUserId && passengers && passengers.length > 0) {
                for (const pax of passengers) {
                    await tx.co_travellers.create({
                        data: {
                            user_id: actualUserId,
                            title: pax.Title,
                            first_name: pax.FirstName,
                            last_name: pax.LastName,
                            gender: pax.Gender === 1 ? 'Male' : 'Female',
                            date_of_birth: pax.DateOfBirth ? new Date(pax.DateOfBirth) : null,
                            passport_number: pax.PassportNo || null,
                            passport_expiry_date: pax.PassportExpiry ? new Date(pax.PassportExpiry) : null,
                        }
                    });
                }
            }

            return { booking, flightBooking };
        });

        res.status(200).json({ 
            success: true, 
            message: 'Booking confirmed and saved successfully', 
            data: savedBooking,
            adivahaData: adivahaRes
        });

        // 4. Asynchronously Generate PDF Invoice and Send Email
        if (contactDetails?.Email) {
            // Do not await this to avoid blocking the API response
            (async () => {
                try {
                    console.log(`Starting invoice generation for PNR: ${pnr}...`);
                    
                    // Format data for the invoice template
                    const invoiceData = {
                        pnr: pnr,
                        bookingId: savedBooking.booking.booking_id,
                        bookingDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                        passengers: passengers.map((p, idx) => ({
                            firstName: p.FirstName,
                            lastName: p.LastName,
                            gender: p.Gender === 1 ? 'Male' : 'Female',
                            dob: p.DateOfBirth || 'N/A',
                            passportNo: p.PassportNo || 'N/A',
                            passportExpiry: p.PassportExpiry || 'N/A',
                            meal: ssrSelections?.meals?.find(m => m.paxIdx === idx)?.name || p.meal || p.MealDynamic?.[0]?.Code || p.Meal?.Code || 'Not Selected',
                            baggage: ssrSelections?.baggage?.find(b => b.paxIdx === idx)?.weight || p.baggage || p.Baggage?.[0]?.Weight || p.Baggage?.Weight || 'Standard',
                            ticketStatus: ticketStatus
                        })),
                        origin: flightSnapshot?.from || 'Origin',
                        destination: flightSnapshot?.to || 'Destination',
                        departureDate: flightSnapshot?.raw?.Segments?.[0]?.[0]?.Origin?.DepTime 
                            ? new Date(flightSnapshot.raw.Segments[0][0].Origin.DepTime).toLocaleString() 
                            : 'Date not available',
                        airline: flightSnapshot?.airlineCode || 'Airline',
                        totalFare: savedBooking.booking.total_amount,
                        baseFare: flightSnapshot?.raw?.Fare?.BaseFare || Math.round(savedBooking.booking.total_amount * 0.7), // Fallback approximation
                        taxes: flightSnapshot?.raw?.Fare?.Tax || Math.round(savedBooking.booking.total_amount * 0.3), // Fallback approximation
                        status: 'CONFIRMED',
                        contactEmail: contactDetails.Email,
                        contactPhone: contactDetails.ContactNo,
                        gstNumber: contactDetails.GSTNumber || contactDetails.GstNumber || 'N/A',
                        state: contactDetails.State || 'N/A'
                    };

                    const html = getInvoiceHTML(invoiceData);
                    const pdfBuffer = await pdfService.generatePDF(html);
                    await emailService.sendInvoiceEmail(contactDetails.Email, invoiceData, pdfBuffer);
                    
                } catch (emailError) {
                    console.error('Error generating/sending invoice email background task:', emailError);
                }
            })();
        }

    } catch (error) {
        console.error('Confirm Booking Error:', error);
        res.status(500).json({ success: false, message: 'Failed to confirm booking', error: error.message });
    }
};

/**
 * Get Booking Details
 */
exports.getBookingDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const booking = await prisma.bookings.findUnique({
            where: { booking_id: id },
            include: {
                flight_bookings: true,
                users: {
                    select: { first_name: true, last_name: true, email: true, phone: true }
                }
            }
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        res.status(200).json({ success: true, data: booking });
    } catch (error) {
        console.error('Get Booking Details Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch booking details', error: error.message });
    }
};

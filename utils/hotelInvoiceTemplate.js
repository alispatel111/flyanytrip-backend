const getHotelInvoiceDocDefinition = (bookingData) => {
    const {
        bookingId = 'N/A',
        bookingDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        bookingReference = 'PENDING',
        orderId = 'N/A',
        hotelName = 'N/A',
        hotelAddress = 'N/A',
        checkIn = 'N/A',
        checkOut = 'N/A',
        nightCount = 1,
        rooms = 1,
        adults = 1,
        children = 0,
        roomType = 'Standard Room',
        boardPlan = 'Room Only',
        totalFare = 0,
        status = 'CONFIRMED',
        contactEmail = 'N/A',
        contactPhone = 'N/A',
        guestName = 'Traveler'
    } = bookingData;

    const formatCurrency = (val) => `Rs. ${parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    return {
        pageSize: 'A4',
        pageMargins: [40, 40, 40, 40],
        defaultStyle: {
            columnGap: 20
        },
        content: [
            // HEADER
            {
                columns: [
                    {
                        text: [
                            { text: 'FLY', color: '#1A202C' },
                            { text: 'ANY', color: '#E53E3E' },
                            { text: 'TRIP', color: '#1A202C' }
                        ],
                        fontSize: 24,
                        bold: true,
                        width: '*'
                    },
                    {
                        text: [
                            { text: 'HOTEL BOOKING INVOICE\n', fontSize: 18, bold: true, color: '#1A202C' },
                            { text: 'Thank you for booking with us.', fontSize: 10, color: '#A0AEC0' }
                        ],
                        alignment: 'right',
                        width: '*'
                    }
                ],
                margin: [0, 0, 0, 20]
            },
            {
                canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: '#E53E3E' }],
                margin: [0, 0, 0, 20]
            },
            
            // BOOKING INFO STRIP
            {
                table: {
                    widths: ['*', '*', '*', '*'],
                    body: [
                        [
                            { text: 'BOOKING REFERENCE', style: 'infoLabel' },
                            { text: 'ORDER ID', style: 'infoLabel' },
                            { text: 'BOOKING DATE', style: 'infoLabel' },
                            { text: 'STATUS', style: 'infoLabel' }
                        ],
                        [
                            { text: bookingReference, style: 'infoValuePnr' },
                            { text: orderId, style: 'infoValue' },
                            { text: bookingDate, style: 'infoValue' },
                            { text: status, style: 'infoValueSuccess' }
                        ]
                    ]
                },
                layout: 'noBorders',
                margin: [0, 0, 0, 20]
            },

            // HOTEL DETAILS
            { text: 'HOTEL DETAILS', style: 'sectionHeader' },
            {
                style: 'itineraryCard',
                table: {
                    widths: ['*'],
                    body: [
                        [
                            {
                                columns: [
                                    { text: `🏨 ${hotelName}`, bold: true, color: '#4A5568' },
                                    { text: `📍 ${hotelAddress}`, alignment: 'right', color: '#718096', fontSize: 10 }
                                ],
                                fillColor: '#F7FAFC',
                                padding: [10, 10, 10, 10]
                            }
                        ],
                        [
                            {
                                columns: [
                                    {
                                        width: '40%',
                                        text: [
                                            { text: 'CHECK IN\n', style: 'cityName' },
                                            { text: `${checkIn}`, style: 'flightTime' }
                                        ]
                                    },
                                    {
                                        width: '20%',
                                        alignment: 'center',
                                        text: `\n🌙\n${nightCount} Night(s)`,
                                        color: '#718096',
                                        fontSize: 10
                                    },
                                    {
                                        width: '40%',
                                        alignment: 'right',
                                        text: [
                                            { text: 'CHECK OUT\n', style: 'cityName' },
                                            { text: `${checkOut}`, style: 'flightTime' }
                                        ]
                                    }
                                ],
                                margin: [10, 15, 10, 15]
                            }
                        ],
                        [
                            {
                                text: [
                                    { text: 'Room Type: ', bold: true, color: '#4A5568' }, `${roomType}   |   `,
                                    { text: 'Meal Plan: ', bold: true, color: '#4A5568' }, `${boardPlan}\n`,
                                    { text: 'Guests: ', bold: true, color: '#4A5568' }, `${adults} Adult(s) ${children > 0 ? `, ${children} Child(ren)` : ''}   |   `,
                                    { text: 'Rooms: ', bold: true, color: '#4A5568' }, `${rooms}`
                                ],
                                fontSize: 11,
                                color: '#2D3748',
                                fillColor: '#F7FAFC',
                                padding: [10, 10, 10, 10]
                            }
                        ]
                    ]
                },
                layout: {
                    hLineWidth: (i, node) => 1,
                    vLineWidth: (i, node) => 1,
                    hLineColor: (i, node) => '#E2E8F0',
                    vLineColor: (i, node) => '#E2E8F0'
                },
                margin: [0, 0, 0, 20]
            },

            // GUEST DETAILS
            { text: 'GUEST DETAILS', style: 'sectionHeader', margin: [0, 10, 0, 10] },
            {
                table: {
                    headerRows: 1,
                    widths: ['auto', '*', 'auto', 'auto'],
                    body: [
                        [
                            { text: '#',            style: 'tableHeader' },
                            { text: 'LEAD GUEST NAME', style: 'tableHeader' },
                            { text: 'EMAIL',       style: 'tableHeader' },
                            { text: 'PHONE',       style: 'tableHeader' }
                        ],
                        [
                            { text: '1', style: 'tableBody' },
                            { text: guestName, style: 'tableBody', bold: true },
                            { text: contactEmail, style: 'tableBody' },
                            { text: contactPhone, style: 'tableBody' }
                        ]
                    ]
                },
                layout: {
                    hLineWidth: (i, node) => 1,
                    vLineWidth: (i, node) => 0,
                    hLineColor: (i, node) => '#E2E8F0',
                    paddingTop:    (i, node) => 10,
                    paddingBottom: (i, node) => 10,
                },
                margin: [0, 0, 0, 20]
            },

            // CUSTOMER & PAYMENT SUMMARY
            {
                columns: [
                    {
                        width: '50%',
                        stack: [
                            { text: 'CUSTOMER & BILLING DETAILS', style: 'sectionHeader' },
                            {
                                text: [
                                    { text: 'Email: ', bold: true }, `${contactEmail}\n`,
                                    { text: 'Phone: ', bold: true }, `${contactPhone}\n`
                                ],
                                fontSize: 12,
                                lineHeight: 1.6,
                                color: '#4A5568'
                            }
                        ]
                    },
                    {
                        width: '50%',
                        stack: [
                            { text: 'PAYMENT SUMMARY', style: 'sectionHeader' },
                            {
                                table: {
                                    widths: ['*', 'auto'],
                                    body: [
                                        ['Room Rate & Taxes', { text: formatCurrency(totalFare), alignment: 'right' }],
                                        [
                                            { text: 'Grand Total', bold: true, fillColor: '#2D3748', color: '#FFFFFF' },
                                            { text: formatCurrency(totalFare), bold: true, fillColor: '#2D3748', color: '#FFFFFF', alignment: 'right' }
                                        ]
                                    ]
                                },
                                layout: {
                                    hLineWidth: (i, node) => 1,
                                    vLineWidth: (i, node) => 1,
                                    hLineColor: (i, node) => '#E2E8F0',
                                    vLineColor: (i, node) => '#E2E8F0',
                                    paddingTop:    (i, node) => 10,
                                    paddingBottom: (i, node) => 10,
                                    paddingLeft:   (i, node) => 12,
                                    paddingRight:  (i, node) => 12,
                                }
                            }
                        ]
                    }
                ],
                columnGap: 30,
                margin: [0, 20, 0, 40]
            },

            // TERMS AND CONDITIONS
            {
                text: 'HOTEL TERMS & CONDITIONS / CANCELLATION POLICY',
                style: 'sectionHeader',
                margin: [0, 20, 0, 15]
            },
            {
                columns: [
                    {
                        width: '50%',
                        text: [
                            { text: '1. Check-In / Check-Out\n', bold: true, fontSize: 11, color: '#2D3748' },
                            { text: '• Standard check-in time is usually 2:00 PM and check-out is 12:00 PM.\n', fontSize: 10, color: '#718096', lineHeight: 1.4 },
                            { text: '• Early check-in or late check-out is subject to availability and hotel policies.\n', fontSize: 10, color: '#718096', lineHeight: 1.4 },
                            { text: '• All guests must present valid government-issued ID upon check-in.\n\n', fontSize: 10, color: '#718096', lineHeight: 1.4 },
                        ]
                    },
                    {
                        width: '50%',
                        text: [
                            { text: '2. Cancellation & Modification\n', bold: true, fontSize: 11, color: '#2D3748' },
                            { text: '• Cancellation policies are strictly enforced by the respective hotels.\n', fontSize: 10, color: '#718096', lineHeight: 1.4 },
                            { text: '• Non-refundable bookings will not receive any refund upon cancellation.\n', fontSize: 10, color: '#718096', lineHeight: 1.4 },
                            { text: '• Any modification requires prior approval and may incur extra charges.\n', fontSize: 10, color: '#718096', lineHeight: 1.4 }
                        ]
                    }
                ],
                columnGap: 30,
                margin: [0, 0, 0, 30]
            },
            
            // FOOTER
            {
                text: 'FlyAnyTrip Travel Solutions Pvt. Ltd. | Support: support@flyanytrip.com | Helpdesk: +91-800-123-4567\nThis is an electronically generated invoice and does not require a physical signature.',
                alignment: 'center',
                fontSize: 10,
                color: '#A0AEC0',
                margin: [0, 30, 0, 0]
            }
        ],
        styles: {
            infoLabel: { fontSize: 11, color: '#718096', bold: true },
            infoValue: { fontSize: 13, color: '#1A202C', bold: true, margin: [0, 5, 0, 0] },
            infoValuePnr: { fontSize: 16, color: '#3182CE', bold: true, margin: [0, 5, 0, 0] },
            infoValueSuccess: { fontSize: 13, color: '#48BB78', bold: true, margin: [0, 5, 0, 0] },
            sectionHeader: { fontSize: 14, bold: true, color: '#2D3748', margin: [0, 0, 0, 15] },
            cityName: { fontSize: 11, color: '#718096' },
            flightTime: { fontSize: 13, bold: true, color: '#2D3748' },
            tableHeader: { fontSize: 10, bold: true, color: '#4A5568', fillColor: '#F7FAFC' },
            tableBody: { fontSize: 11, color: '#2D3748', margin: [0, 4, 0, 4] }
        }
    };
};

module.exports = { getHotelInvoiceDocDefinition };

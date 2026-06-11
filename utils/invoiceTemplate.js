const getInvoiceDocDefinition = (bookingData) => {
    const {
        pnr = 'PENDING',
        bookingId = 'N/A',
        bookingDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        passengers = [],
        origin = 'XXX',
        destination = 'XXX',
        departureDate = 'N/A',
        arrivalDate = 'N/A',
        airline = 'XX',
        flightNumber = 'XX-000',
        cabinClass = 'Economy',
        totalFare = 0,
        baseFare = 0,
        taxes = 0,
        status = 'CONFIRMED',
        contactEmail = 'N/A',
        contactPhone = 'N/A',
        gstNumber = 'N/A',
        state = 'N/A',
        segments = []
    } = bookingData;

    const passengerRows = passengers.map((pax, index) => {
        let nameText = `${pax.firstName} ${pax.lastName}`;
        if (pax.passportNo !== 'N/A') {
            nameText += `\nPassport: ${pax.passportNo} | Exp: ${pax.passportExpiry}`;
        }
        return [
            { text: (index + 1).toString(), style: 'tableBody' },
            { text: nameText, style: 'tableBody', bold: true },
            { text: pax.gender || 'N/A', style: 'tableBody' },
            { text: pax.dob !== 'N/A' ? pax.dob : '-', style: 'tableBody' },
            { text: pax.ticketStatus || status, style: 'tableBody', color: '#4caf50', bold: true }
        ];
    });

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
                            { text: 'E-TICKET / INVOICE\n', fontSize: 18, bold: true, color: '#1A202C' },
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
                            { text: 'AIRLINE PNR', style: 'infoLabel' },
                            { text: 'BOOKING ID', style: 'infoLabel' },
                            { text: 'BOOKING DATE', style: 'infoLabel' },
                            { text: 'STATUS', style: 'infoLabel' }
                        ],
                        [
                            { text: pnr, style: 'infoValuePnr' },
                            { text: bookingId, style: 'infoValue' },
                            { text: bookingDate, style: 'infoValue' },
                            { text: status, style: 'infoValueSuccess' }
                        ]
                    ]
                },
                layout: 'noBorders',
                margin: [0, 0, 0, 20]
            },

            // FLIGHT ITINERARY
            { text: 'FLIGHT ITINERARY', style: 'sectionHeader' },
            {
                style: 'itineraryCard',
                table: {
                    widths: ['*'],
                    body: segments && segments.length > 0 ? 
                        segments.flatMap((seg, idx) => {
                            const rows = [];
                            
                            // Layover
                            if (idx > 0) {
                                const prevArr = new Date(segments[idx - 1].Destination.ArrTime).getTime();
                                const currDep = new Date(seg.Origin.DepTime).getTime();
                                const layoverMs = currDep - prevArr;
                                if (layoverMs > 0) {
                                    const h = Math.floor(layoverMs / 3600000);
                                    const m = Math.floor((layoverMs % 3600000) / 60000);
                                    rows.push([
                                        {
                                            text: `Layover in ${seg.Origin.Airport.CityCode || seg.Origin.Airport.AirportCode}: ${h}h ${m}m`,
                                            alignment: 'center',
                                            fontSize: 10,
                                            color: '#E53E3E',
                                            margin: [0, 5, 0, 5],
                                            fillColor: '#FFF5F5'
                                        }
                                    ]);
                                }
                            }

                            const depDate = new Date(seg.Origin.DepTime).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
                            const arrDate = new Date(seg.Destination.ArrTime).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });

                            // Header
                            rows.push([
                                {
                                    columns: [
                                        { text: `✈ ${seg.Airline?.AirlineName || airline} | ${seg.Airline?.AirlineCode || airline.substring(0, 2)}-${seg.Airline?.FlightNumber || flightNumber}`, bold: true, color: '#4A5568' },
                                        { text: `Class: ${cabinClass}`, alignment: 'right', bold: true, color: '#4A5568' }
                                    ],
                                    fillColor: '#F7FAFC',
                                    padding: [10, 8, 10, 8]
                                }
                            ]);

                            // Body
                            rows.push([
                                {
                                    columns: [
                                        {
                                            width: '35%',
                                            text: [
                                                { text: `${seg.Origin.Airport.AirportCode}\n`, style: 'cityCode' },
                                                { text: `${seg.Origin.Airport.AirportName || 'Departure'}\n`, style: 'cityName' },
                                                { text: `${depDate}`, style: 'flightTime' }
                                            ]
                                        },
                                        {
                                            width: '30%',
                                            alignment: 'center',
                                            text: `\n✈\n${seg.Duration ? `${Math.floor(seg.Duration/60)}h ${seg.Duration%60}m` : ''}`,
                                            color: '#718096',
                                            fontSize: 10
                                        },
                                        {
                                            width: '35%',
                                            alignment: 'right',
                                            text: [
                                                { text: `${seg.Destination.Airport.AirportCode}\n`, style: 'cityCode' },
                                                { text: `${seg.Destination.Airport.AirportName || 'Arrival'}\n`, style: 'cityName' },
                                                { text: `${arrDate}`, style: 'flightTime' }
                                            ]
                                        }
                                    ],
                                    margin: [10, 15, 10, 15]
                                }
                            ]);

                            // Baggage at end
                            if (idx === segments.length - 1) {
                                rows.push([
                                    {
                                        text: 'Baggage: Cabin 7 Kg | Check-in 15 Kg\n*Baggage allowance may vary as per airline policies.',
                                        fontSize: 10,
                                        color: '#718096',
                                        fillColor: '#F7FAFC',
                                        padding: [10, 5, 10, 5]
                                    }
                                ]);
                            }

                            return rows;
                        })
                    : [
                        [
                            {
                                columns: [
                                    { text: `✈ ${airline} | ${flightNumber}`, bold: true, color: '#4A5568' },
                                    { text: `Class: ${cabinClass}`, alignment: 'right', bold: true, color: '#4A5568' }
                                ],
                                fillColor: '#F7FAFC',
                                padding: [10, 10, 10, 10]
                            }
                        ],
                        [
                            {
                                columns: [
                                    {
                                        width: '35%',
                                        text: [
                                            { text: `${origin}\n`, style: 'cityCode' },
                                            { text: 'Departure Airport\n', style: 'cityName' },
                                            { text: `${departureDate}`, style: 'flightTime' }
                                        ]
                                    },
                                    {
                                        width: '30%',
                                        alignment: 'center',
                                        text: '\n✈\nNon-Stop',
                                        color: '#718096',
                                        fontSize: 10
                                    },
                                    {
                                        width: '35%',
                                        alignment: 'right',
                                        text: [
                                            { text: `${destination}\n`, style: 'cityCode' },
                                            { text: 'Arrival Airport\n', style: 'cityName' },
                                            { text: `${arrivalDate !== 'N/A' ? arrivalDate : departureDate}`, style: 'flightTime' }
                                        ]
                                    }
                                ],
                                margin: [10, 15, 10, 15]
                            }
                        ],
                        [
                            {
                                text: 'Baggage: Cabin 7 Kg | Check-in 15 Kg\n*Baggage allowance may vary as per airline policies.',
                                fontSize: 10,
                                color: '#718096',
                                fillColor: '#F7FAFC',
                                padding: [10, 5, 10, 5]
                            }
                        ]
                    ]
                },
                layout: {
                    hLineWidth: function (i, node) { return 1; },
                    vLineWidth: function (i, node) { return 1; },
                    hLineColor: function (i, node) { return '#E2E8F0'; },
                    vLineColor: function (i, node) { return '#E2E8F0'; }
                },
                margin: [0, 0, 0, 20]
            },

            // PASSENGER DETAILS
            { text: 'PASSENGER DETAILS', style: 'sectionHeader', margin: [0, 20, 0, 10] },
            {
                table: {
                    headerRows: 1,
                    widths: ['auto', '*', 'auto', 'auto', 'auto'],
                    body: [
                        [
                            { text: '#', style: 'tableHeader' },
                            { text: 'NAME & PASSPORT', style: 'tableHeader' },
                            { text: 'GENDER', style: 'tableHeader' },
                            { text: 'DOB', style: 'tableHeader' },
                            { text: 'STATUS', style: 'tableHeader' }
                        ],
                        ...passengerRows
                    ]
                },
                layout: {
                    hLineWidth: function (i, node) { return 1; },
                    vLineWidth: function (i, node) { return 0; },
                    hLineColor: function (i, node) { return '#E2E8F0'; },
                    paddingTop: function(i, node) { return 10; },
                    paddingBottom: function(i, node) { return 10; }
                },
                margin: [0, 0, 0, 20]
            },

            // CUSTOMER & PAYMENT SUMMARY (Side by side or stacked)
            // Added pageBreak here to move billing and terms to the second page
            {
                pageBreak: 'before',
                columns: [
                    {
                        width: '50%',
                        stack: [
                            { text: 'CUSTOMER & BILLING DETAILS', style: 'sectionHeader' },
                            {
                                text: [
                                    { text: 'Email: ', bold: true }, `${contactEmail}\n`,
                                    { text: 'Phone: ', bold: true }, `${contactPhone}\n`,
                                    ...(gstNumber !== 'N/A' ? [{ text: 'GST No: ', bold: true }, `${gstNumber}\n`] : []),
                                    ...(state !== 'N/A' ? [{ text: 'State: ', bold: true }, `${state}\n`] : [])
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
                                        ['Base Fare', formatCurrency(baseFare)],
                                        ['Taxes & Airline Fees', formatCurrency(taxes)],
                                        ['Convenience Fee', formatCurrency(0)],
                                        [{ text: 'Discounts', color: '#48BB78' }, { text: '- ' + formatCurrency(0), color: '#48BB78' }],
                                        [
                                            { text: 'Grand Total', bold: true, fillColor: '#2D3748', color: '#FFFFFF' },
                                            { text: formatCurrency(totalFare), bold: true, fillColor: '#2D3748', color: '#FFFFFF' }
                                        ]
                                    ]
                                },
                                layout: {
                                    hLineWidth: function (i, node) { return 1; },
                                    vLineWidth: function (i, node) { return 1; },
                                    hLineColor: function (i, node) { return '#E2E8F0'; },
                                    vLineColor: function (i, node) { return '#E2E8F0'; },
                                    paddingTop: function(i, node) { return 10; },
                                    paddingBottom: function(i, node) { return 10; },
                                    paddingLeft: function(i, node) { return 12; },
                                    paddingRight: function(i, node) { return 12; }
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
                text: 'TERMS & CONDITIONS / CANCELLATION POLICY',
                style: 'sectionHeader',
                margin: [0, 20, 0, 15]
            },
            {
                columns: [
                    {
                        width: '50%',
                        text: [
                            { text: '1. Mandatory Guidelines\n', bold: true, fontSize: 11, color: '#2D3748' },
                            { text: '• Passengers must carry a valid photo ID for airport entry.\n', fontSize: 10, color: '#718096', lineHeight: 1.4 },
                            { text: '• Reach the airport at least 2 hours prior to domestic departure.\n', fontSize: 10, color: '#718096', lineHeight: 1.4 },
                            { text: '• Boarding gates close 45 minutes prior to departure.\n\n', fontSize: 10, color: '#718096', lineHeight: 1.4 },
                            
                            { text: '2. Cancellation & Refunds\n', bold: true, fontSize: 11, color: '#2D3748' },
                            { text: '• Cancellations must be made at least 4 hours before departure.\n', fontSize: 10, color: '#718096', lineHeight: 1.4 },
                            { text: '• Airline cancellation charges apply as per the fare rules.\n', fontSize: 10, color: '#718096', lineHeight: 1.4 },
                            { text: '• FlyAnyTrip charges ₹300 per passenger per sector.\n', fontSize: 10, color: '#718096', lineHeight: 1.4 }
                        ]
                    },
                    {
                        width: '50%',
                        text: [
                            { text: '3. Rescheduling Details\n', bold: true, fontSize: 11, color: '#2D3748' },
                            { text: '• Date change requests are subject to airline date change fees + fare difference.\n', fontSize: 10, color: '#718096', lineHeight: 1.4 },
                            { text: '• FlyAnyTrip rescheduling service fee of ₹250 per passenger applies.\n\n', fontSize: 10, color: '#718096', lineHeight: 1.4 },
                            
                            { text: '4. Baggage & Web Check-in\n', bold: true, fontSize: 11, color: '#2D3748' },
                            { text: '• Web check-in is mandatory for most domestic flights.\n', fontSize: 10, color: '#718096', lineHeight: 1.4 },
                            { text: '• Excess baggage can be pre-purchased online at discounted rates.\n', fontSize: 10, color: '#718096', lineHeight: 1.4 }
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
            cityCode: { fontSize: 28, bold: true, color: '#1A202C' },
            cityName: { fontSize: 11, color: '#718096' },
            flightTime: { fontSize: 13, bold: true, color: '#2D3748' },
            tableHeader: { fontSize: 10, bold: true, color: '#4A5568', fillColor: '#F7FAFC' },
            tableBody: { fontSize: 11, color: '#2D3748', margin: [0, 4, 0, 4] }
        }
    };
};

module.exports = { getInvoiceDocDefinition };

import { NextRequest, NextResponse } from 'next/server';
import {
    searchFlights,
    priceFlightOffer,
    createFlightOrder,
    resolveCityCode,
    lookupIATACode,
} from '@/lib/api/amadeus';
import type { FlightPassenger } from '@/lib/api/amadeus';

// POST /api/booking/flights — search, price, or book flights via Amadeus
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action } = body;

        // ── SEARCH ────────────────────────────────────────────────────
        if (action === 'search') {
            const { from, to, date, returnDate, adults = 1, travelClass } = body;

            // Resolve city names to IATA codes
            let originCode = resolveCityCode(from);
            let destCode = resolveCityCode(to);

            // Fallback to Amadeus lookup if not in our map
            if (!originCode) originCode = await lookupIATACode(from);
            if (!destCode) destCode = await lookupIATACode(to);

            if (!originCode || !destCode) {
                return NextResponse.json({
                    success: false,
                    error: `Could not resolve city codes for "${!originCode ? from : to}"`,
                }, { status: 400 });
            }

            const offers = await searchFlights({
                originCode,
                destinationCode: destCode,
                departureDate: date,
                returnDate,
                adults,
                travelClass,
                maxResults: 15,
            });

            return NextResponse.json({
                success: true,
                results: offers.map(offer => ({
                    id: offer.id,
                    airline: offer.validatingAirlineCodes?.[0] || 'Unknown',
                    price: offer.price.grandTotal || offer.price.total,
                    currency: offer.price.currency,
                    itineraries: offer.itineraries.map(itin => ({
                        duration: itin.duration,
                        segments: itin.segments.map(seg => ({
                            from: seg.departure.iataCode,
                            to: seg.arrival.iataCode,
                            departureTime: seg.departure.at,
                            arrivalTime: seg.arrival.at,
                            carrier: seg.carrierCode,
                            flightNumber: `${seg.carrierCode}${seg.number}`,
                            duration: seg.duration,
                            stops: seg.numberOfStops,
                        })),
                    })),
                    seats: offer.numberOfBookableSeats,
                    bookable: true,
                    bookingMethod: 'amadeus',
                    rawOffer: offer, // needed for pricing/booking
                })),
                source: 'amadeus',
                count: offers.length,
            });
        }

        // ── PRICE (confirm before booking) ────────────────────────────
        if (action === 'price') {
            const { offer } = body;
            if (!offer) {
                return NextResponse.json({ success: false, error: 'Missing offer' }, { status: 400 });
            }

            const { pricedOffer, dictionaries } = await priceFlightOffer(offer);
            return NextResponse.json({
                success: true,
                pricedOffer,
                dictionaries,
            });
        }

        // ── BOOK (actual booking!) ────────────────────────────────────
        if (action === 'book') {
            const { pricedOffer, passengers, contactEmail, contactPhone } = body;

            if (!pricedOffer || !passengers?.length || !contactEmail || !contactPhone) {
                return NextResponse.json(
                    { success: false, error: 'Missing required booking details (offer, passengers, email, phone)' },
                    { status: 400 }
                );
            }

            // Format passengers for Amadeus
            const safePhone = typeof contactPhone === 'string' ? contactPhone.replace(/\D/g, '').slice(-10) : '0000000000';
            const travelers: FlightPassenger[] = passengers.map((p: any, i: number) => ({
                id: (i + 1).toString(),
                dateOfBirth: p.dateOfBirth || '1990-01-01',
                name: { firstName: p.firstName.toUpperCase(), lastName: p.lastName.toUpperCase() },
                gender: p.gender?.toUpperCase() || 'MALE',
                contact: {
                    emailAddress: contactEmail,
                    phones: [{
                        deviceType: 'MOBILE' as const,
                        countryCallingCode: '91',
                        number: safePhone || '0000000000',
                    }],
                },
            }));

            const booking = await createFlightOrder(pricedOffer, travelers, 'NaviiGo Booking');

            // Extract PNR
            const pnr = booking.associatedRecords?.[0]?.reference || null;

            return NextResponse.json({
                success: true,
                bookingId: booking.id,
                pnr,
                status: 'confirmed',
                travelers: booking.travelers,
                flightDetails: booking.flightOffers?.[0],
            });
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('[Booking/Flights] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Flight booking service error',
        }, { status: 500 });
    }
}

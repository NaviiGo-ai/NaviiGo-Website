import { NextRequest, NextResponse } from 'next/server';
import { searchHotels, bookHotel, resolveCityCode, lookupIATACode } from '@/lib/api/amadeus';
import type { HotelGuest } from '@/lib/api/amadeus';

// POST /api/booking/hotels — search or book hotels via Amadeus
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action } = body;

        // ── SEARCH ────────────────────────────────────────────────────
        if (action === 'search') {
            const { city, checkIn, checkOut, adults = 1, rooms = 1, ratings } = body;

            let cityCode = resolveCityCode(city);
            if (!cityCode) cityCode = await lookupIATACode(city);

            if (!cityCode) {
                return NextResponse.json({
                    success: false,
                    error: `Could not resolve city code for "${city}"`,
                }, { status: 400 });
            }

            const offers = await searchHotels({
                cityCode,
                checkInDate: checkIn,
                checkOutDate: checkOut,
                adults,
                roomQuantity: rooms,
                currency: 'INR',
                ratings,
            });

            return NextResponse.json({
                success: true,
                results: offers.map(hotelOffer => ({
                    hotelId: hotelOffer.hotel.hotelId,
                    name: hotelOffer.hotel.name,
                    cityCode: hotelOffer.hotel.cityCode,
                    lat: hotelOffer.hotel.latitude,
                    lng: hotelOffer.hotel.longitude,
                    rating: hotelOffer.hotel.rating,
                    address: hotelOffer.hotel.address?.lines?.join(', ') || '',
                    amenities: hotelOffer.hotel.amenities || [],
                    image: hotelOffer.hotel.media?.[0]?.uri || null,
                    offers: hotelOffer.offers.map(offer => ({
                        id: offer.id,
                        checkIn: offer.checkInDate,
                        checkOut: offer.checkOutDate,
                        roomType: offer.room.typeEstimated?.category || offer.room.type,
                        description: offer.room.description?.text || '',
                        price: offer.price.total,
                        currency: offer.price.currency,
                        cancellation: offer.policies?.cancellation?.description?.text || null,
                        paymentType: offer.policies?.paymentType || 'GUARANTEE',
                    })),
                    bookable: true,
                    bookingMethod: 'amadeus',
                })),
                source: 'amadeus',
                count: offers.length,
            });
        }

        // ── BOOK ──────────────────────────────────────────────────────
        if (action === 'book') {
            const { offerId, guests, payment } = body;

            if (!offerId || !guests?.length) {
                return NextResponse.json(
                    { success: false, error: 'Missing offerId or guests' },
                    { status: 400 }
                );
            }

            const formattedGuests: HotelGuest[] = guests.map((g: any) => ({
                name: {
                    title: g.title || 'MR',
                    firstName: g.firstName,
                    lastName: g.lastName,
                },
                contact: {
                    phone: g.phone,
                    email: g.email,
                },
            }));

            const booking = await bookHotel(offerId, formattedGuests, payment);

            return NextResponse.json({
                success: true,
                bookingId: booking.id || booking.confirmationNumber,
                status: 'confirmed',
                hotelName: booking.hotel?.name,
                confirmation: booking,
            });
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('[Booking/Hotels] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Hotel booking service error',
        }, { status: 500 });
    }
}

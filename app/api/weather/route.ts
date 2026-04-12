import { NextRequest, NextResponse } from 'next/server';

/**
 * Weather API route using Open-Meteo (100% free, no key required).
 * Falls back to mock data if the API is unreachable.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat') ?? '20.5937';
    const lng = searchParams.get('lng') ?? '78.9629';

    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=Asia%2FKolkata&forecast_days=7`;

        const res = await fetch(url, { next: { revalidate: 1800 } }); // cache 30 min
        if (!res.ok) throw new Error('Open-Meteo unavailable');

        const data = await res.json();

        const WMO_CODES: Record<number, { label: string; emoji: string }> = {
            0: { label: 'Clear Sky', emoji: '☀️' },
            1: { label: 'Mainly Clear', emoji: '🌤️' },
            2: { label: 'Partly Cloudy', emoji: '⛅' },
            3: { label: 'Overcast', emoji: '☁️' },
            45: { label: 'Foggy', emoji: '🌫️' },
            48: { label: 'Icy Fog', emoji: '🌫️' },
            51: { label: 'Light Drizzle', emoji: '🌦️' },
            61: { label: 'Light Rain', emoji: '🌧️' },
            63: { label: 'Moderate Rain', emoji: '🌧️' },
            65: { label: 'Heavy Rain', emoji: '⛈️' },
            71: { label: 'Light Snow', emoji: '🌨️' },
            73: { label: 'Moderate Snow', emoji: '❄️' },
            80: { label: 'Rain Showers', emoji: '🌦️' },
            95: { label: 'Thunderstorm', emoji: '⛈️' },
        };

        const curr = data.current;
        const code = curr.weather_code ?? 0;
        const weather = WMO_CODES[code] ?? { label: 'Fair', emoji: '🌤️' };

        return NextResponse.json({
            current: {
                temp: Math.round(curr.temperature_2m),
                feelsLike: Math.round(curr.apparent_temperature),
                humidity: curr.relative_humidity_2m,
                rainChance: curr.precipitation_probability,
                windSpeed: Math.round(curr.wind_speed_10m),
                condition: weather.label,
                emoji: weather.emoji,
            },
            daily: data.daily.time.map((date: string, i: number) => ({
                date,
                maxTemp: Math.round(data.daily.temperature_2m_max[i]),
                minTemp: Math.round(data.daily.temperature_2m_min[i]),
                rainChance: data.daily.precipitation_probability_max[i],
                condition: (WMO_CODES[data.daily.weather_code[i]] ?? { label: 'Fair', emoji: '🌤️' }).label,
                emoji: (WMO_CODES[data.daily.weather_code[i]] ?? { label: 'Fair', emoji: '🌤️' }).emoji,
            })),
        });
    } catch (err) {
        // Mock fallback
        return NextResponse.json({
            current: {
                temp: 28, feelsLike: 31, humidity: 72, rainChance: 20,
                windSpeed: 12, condition: 'Partly Cloudy', emoji: '⛅',
            },
            daily: [],
            _mock: true,
        });
    }
}

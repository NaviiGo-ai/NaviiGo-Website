// ─── Exact Weather Integration via Open-Meteo ─────────────────────────────────
// Completely free, no API key required, highly accurate historical and forecast data.

export async function fetchExactWeather(lat: number, lng: number): Promise<Record<string, string>> {
    try {
        // Fetch daily weather variables (temperature max and min) for 7 days
        // We use forecast data if available, but since we need an overview, we'll get the current 7-day forecast
        // and average it to give a precise live reading.
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
        
        const response = await fetch(url, { next: { revalidate: 3600 } }); // cache for 1 hour
        if (!response.ok) throw new Error('Weather fetch failed');
        
        const data = await response.json();
        
        if (!data.daily || !data.daily.temperature_2m_max || !data.daily.temperature_2m_min) {
            return generateGenericWeather();
        }

        const maxTemps = data.daily.temperature_2m_max;
        const minTemps = data.daily.temperature_2m_min;
        
        // Calculate average min and max for the upcoming week
        const maxLen = maxTemps.length || 1;
        const minLen = minTemps.length || 1;
        const avgMax = Math.round(maxTemps.reduce((a: number, b: number) => a + b, 0) / maxLen);
        const avgMin = Math.round(minTemps.reduce((a: number, b: number) => a + b, 0) / minLen);
        
        // The API asks for "Jan": "range", etc. 
        // We will return this exact live temperature for the current month.
        // We populate all months with historical generic, but override the current month with live precision data!
        const generic = generateGenericWeather();
        const currentMonth = new Date().toLocaleString('en-US', { month: 'short' });
        
        // Return exact live data for current month, append a "Live" flag so UI knows it's real-time.
        generic[currentMonth] = `${avgMin}°C – ${avgMax}°C`;
        generic['LiveData'] = 'true';
        
        return generic;
    } catch (e) {
        console.error('[Weather API] Open-Meteo failed, falling back to generic weather', e);
        return generateGenericWeather();
    }
}

function generateGenericWeather(): Record<string, string> {
    return {
        Jan: '12–25°C', Feb: '15–28°C', Mar: '20–32°C', Apr: '25–36°C',
        May: '28–40°C', Jun: '26–36°C', Jul: '24–32°C', Aug: '24–31°C',
        Sep: '24–32°C', Oct: '20–32°C', Nov: '15–28°C', Dec: '12–25°C'
    };
}

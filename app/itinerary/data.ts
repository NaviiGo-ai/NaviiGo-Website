// ─── TYPES ─────────────────────────────────────────────────────────────────────
export type WalkLevel = 'Easy' | 'Medium' | 'High';
export type ValueLevel = 'Low' | 'Medium' | 'High';
export type CrowdLevel = 'Low' | 'Medium' | 'High';
export type TimeOfDay = 'Morning' | 'Afternoon' | 'Evening';

export interface Attraction {
    name: string; img: string; desc: string;
    bestMonths: string; duration: string;
    walking: WalkLevel; value: ValueLevel; tags: string[];
    lat?: number; lng?: number;
}

export interface Restaurant {
    id: string; name: string; img: string; desc: string;
    cuisine: string; priceRange: string; rating: number;
    mustTry: string; timing: string;
    lat: number; lng: number; tags: string[];
}

export interface Hotel {
    id: string; name: string; img: string; desc: string;
    type: 'Hotel' | 'Homestay' | 'Resort' | 'Hostel';
    priceRange: string; rating: number;
    amenities: string[]; checkIn: string;
    lat: number; lng: number;
}

export interface DayActivity {
    time: string; slot: TimeOfDay; name: string; desc: string;
    crowd: CrowdLevel; crowdTip: string;
    travelFromPrev?: string;
    lat: number; lng: number;
    type?: 'attraction' | 'restaurant' | 'hotel';
    priceBase?: number;
    durationMins?: number;
}

export interface DayPlan {
    day: number;
    title: string;
    weather: { temp: string; condition: string; emoji: string; rain: number; tip: string };
    activities: DayActivity[];
}

export interface DestInfo {
    logistics?: { flights: string; trains: string };
    description: string; avgCost: string;
    weather: Record<string, string>;
    crowdLevel: CrowdLevel; crowdNote: string;
    highlights: Attraction[];
    restaurants: Restaurant[];
    hotels: Hotel[];
    dayPlans: DayPlan[];
    mapCenter: { lat: number; lng: number };
}

// ─── PURPOSES ────────────────────────────────────────────────────────────────
export const PURPOSES = [
    { id: 'spiritual', emoji: '🙏', label: 'Spiritual Pilgrimage', desc: 'Ancient temples, sacred ghats and divine rituals across India' },
    { id: 'leisure', emoji: '🌴', label: 'Leisure & Relaxation', desc: 'Beaches, backwaters, spas and slow rejuvenating travel' },
    { id: 'adventure', emoji: '🏔️', label: 'Adventure & Trekking', desc: 'Mountains, trails, rafting and wild stays' },
    { id: 'cultural', emoji: '🏛️', label: 'Cultural Exploration', desc: 'Forts, museums, local cuisine and vibrant traditions' },
    { id: 'honeymoon', emoji: '💑', label: 'Honeymoon / Romance', desc: 'Intimate escapes with stunning scenery and luxury' },
    { id: 'celebrate', emoji: '🎉', label: 'Group Celebration', desc: "Friends, family and moments you'll never forget" },
];

export const DESTINATIONS = [
    { id: 'kerala', name: 'Kerala', sub: "God's Own Country", state: 'Kerala', img: '1593693397690-362cb9666fc2' },
    { id: 'jaipur', name: 'Jaipur', sub: 'The Pink City', state: 'Rajasthan', img: '1599661502283-a44ea24dfc74' },
    { id: 'varanasi', name: 'Varanasi', sub: 'City of Light', state: 'Uttar Pradesh', img: '1582283925565-d053709d3bdf' },
    { id: 'goa', name: 'Goa', sub: 'Sun, Sand & Soul', state: 'Goa', img: '1512343779784-a1d53b98b8ef' },
    { id: 'manali', name: 'Manali', sub: 'Gateway to Himalayas', state: 'Himachal Pradesh', img: '1626621341517-bbf3d9990a23' },
    { id: 'udaipur', name: 'Udaipur', sub: 'City of Lakes', state: 'Rajasthan', img: '1524492412937-b28074a5d7da' },
    { id: 'agra', name: 'Agra', sub: 'Land of the Taj', state: 'Uttar Pradesh', img: '1564507592333-c60657eea523' },
    { id: 'rishikesh', name: 'Rishikesh', sub: 'Yoga Capital of World', state: 'Uttarakhand', img: '1547471080-7fad851863b3' },
];

export const GROUP_SIZES = [
    { id: 'solo', emoji: '🧍', label: 'Solo', note: 'Just me' },
    { id: 'couple', emoji: '💑', label: 'Couple', note: '2 people' },
    { id: 'family', emoji: '👨‍👩‍👧', label: 'Family', note: '3–6 people' },
    { id: 'friends', emoji: '👫', label: 'Friends', note: '4–10 people' },
    { id: 'large', emoji: '👥', label: 'Large Group', note: '10+ people' },
];

// ─── LOADING STEPS ──────────────────────────────────────────────────────────
export const GEN_STEPS = [
    { label: 'Curating activities', sub: ['Analyzing destination insights', 'Gathering travel information', 'Exploring local attractions'], duration: 2800 },
    { label: 'Finding restaurants', sub: ['Searching top-rated eateries', 'Matching dietary preferences', 'Adding local cuisine picks'], duration: 2200 },
    { label: 'Selecting stays', sub: ['Comparing hotels & homestays', 'Checking availability & reviews'], duration: 1800 },
    { label: 'Building itinerary', sub: ['Creating day-by-day schedule', 'Optimizing route for efficiency'], duration: 2500 },
    { label: 'Finalizing your trip', sub: ['Applying personal preferences', 'Almost done…'], duration: 1500 },
];

// ─── BADGE COLORS ─────────────────────────────────────────────────────────────
export const WALK_COLOR: Record<WalkLevel, string> = { Easy: 'bg-emerald-100 text-emerald-700', Medium: 'bg-amber-100 text-amber-700', High: 'bg-red-100 text-red-600' };
export const VALUE_COLOR: Record<ValueLevel, string> = { Low: 'bg-zinc-100 text-zinc-600', Medium: 'bg-blue-100 text-blue-700', High: 'bg-purple-100 text-purple-700' };
export const CROWD_COLOR: Record<CrowdLevel, string> = { Low: 'bg-emerald-100 text-emerald-700', Medium: 'bg-amber-100 text-amber-700', High: 'bg-red-100 text-red-600' };
export const CROWD_DOT: Record<CrowdLevel, string> = { Low: 'bg-emerald-500', Medium: 'bg-amber-500', High: 'bg-red-500' };

// ─── DESTINATION DATA ──────────────────────────────────────────────────────────
export const DEST_DATA: Record<string, DestInfo> = {
    kerala: {
        logistics: { flights: 'Nearest Airport: Kochi (COK) — ~₹5,000 avg', trains: 'Major Stations: Ernakulam (ERS)' },
        description: 'Kerala is a lush tropical paradise nestled between the Western Ghats and the Arabian Sea, famed for its tranquil backwaters, tea estates, and pristine beaches.',
        avgCost: '₹2,500 – ₹8,000',
        weather: { Jan: '22–32°C', Feb: '23–33°C', Mar: '24–34°C', Apr: '26–35°C', May: '25–32°C', Jun: '22–28°C', Jul: '20–27°C', Aug: '20–28°C', Sep: '21–29°C', Oct: '23–30°C', Nov: '23–31°C', Dec: '22–31°C' },
        crowdLevel: 'Medium', crowdNote: 'Oct–Mar peak season; monsoon peaceful and lush',
        mapCenter: { lat: 9.9312, lng: 76.2673 },
        highlights: [
            { name: 'Alleppey Backwaters', img: '1593693397690-362cb9666fc2', desc: 'Cruise through palm-lined canals on a traditional Kerala houseboat.', bestMonths: 'Oct – Mar', duration: '4–8 hrs', walking: 'Easy', value: 'High', tags: ['Houseboat', 'Nature'], lat: 9.4981, lng: 76.3388 },
            { name: 'Munnar Tea Gardens', img: '1626621341517-bbf3d9990a23', desc: 'Walk through endless rolling hills of manicured tea estates.', bestMonths: 'Sep – May', duration: '3–5 hrs', walking: 'Medium', value: 'High', tags: ['Nature', 'Hills'], lat: 10.0889, lng: 77.0595 },
            { name: 'Fort Kochi Heritage', img: '1524492412937-b28074a5d7da', desc: 'Explore Portuguese-era architecture and Chinese fishing nets.', bestMonths: 'Nov – Feb', duration: '2–4 hrs', walking: 'Medium', value: 'High', tags: ['History', 'Culture'], lat: 9.9658, lng: 76.2421 },
            { name: 'Varkala Cliff Beach', img: '1512343779784-a1d53b98b8ef', desc: 'Stunning cliff-top beach with red laterite cliffs and mineral springs.', bestMonths: 'Oct – Mar', duration: '2–6 hrs', walking: 'Easy', value: 'High', tags: ['Beach', 'Sunset'], lat: 8.7379, lng: 76.7163 },
            { name: 'Periyar Tiger Reserve', img: '1549366021-d6d0bdb29a8b', desc: 'Boat safari spotting elephants and bison in the Cardamom Hills.', bestMonths: 'Oct – May', duration: '3–6 hrs', walking: 'Medium', value: 'Medium', tags: ['Wildlife', 'Safari'], lat: 9.4667, lng: 77.2333 },
            { name: 'Athirappilly Falls', img: '1593693397690-362cb9666fc2', desc: "Kerala's largest waterfall crashing through dense tropical forest.", bestMonths: 'Jun – Jan', duration: '2–4 hrs', walking: 'High', value: 'High', tags: ['Waterfall', 'Trekking'], lat: 10.2856, lng: 76.5697 },
        ],
        restaurants: [
            { id: 'kr1', name: 'Dhe Puttu', img: '1567521464027-f127ff144326', desc: 'Celebrity chef Suresh Pillai\'s famous puttu and kadala curry variations. Modern twist on Kerala\'s beloved breakfast staple.', cuisine: 'Kerala Traditional', priceRange: '₹200–₹600', rating: 4.6, mustTry: 'Cheese Puttu & Kadala Curry', timing: '7:30 AM – 10:30 PM', lat: 10.0005, lng: 76.3077, tags: ['Breakfast', 'Local'] },
            { id: 'kr2', name: 'Kayees Rahmathulla', img: '1631515243349-e0cb75fb8d4a', desc: 'Legendary biryani house since 1948. The Kayees Biryani is a Kochi institution — fragrant, spiced, unforgettable.', cuisine: 'Malabar', priceRange: '₹150–₹400', rating: 4.7, mustTry: 'Kayees Biryani', timing: '11:30 AM – 10:00 PM', lat: 9.9716, lng: 76.2893, tags: ['Biryani', 'Iconic'] },
            { id: 'kr3', name: 'Paragon Restaurant', img: '1555396273-367ea4eb4db5', desc: 'Multi-generational Calicut restaurant famous for its Malabar-style seafood. Must-visit for fish lovers.', cuisine: 'Malabar Seafood', priceRange: '₹300–₹800', rating: 4.5, mustTry: 'Fish Biryani & Prawn Masala', timing: '12:00 PM – 11:00 PM', lat: 11.2488, lng: 75.7804, tags: ['Seafood', 'Famous'] },
            { id: 'kr4', name: 'Thalassery Restaurant', img: '1517248135467-4c7edcad34c4', desc: 'Authentic North Kerala cuisine with rich Moplah flavors. Known for their Thalassery Dum Biryani.', cuisine: 'North Kerala', priceRange: '₹250–₹600', rating: 4.4, mustTry: 'Thalassery Biryani & Pathiri', timing: '11:00 AM – 10:30 PM', lat: 9.9312, lng: 76.2673, tags: ['Biryani', 'Traditional'] },
        ],
        hotels: [
            { id: 'kh1', name: 'Kumarakom Lake Resort', img: '1571896349842-33c89424de2d', desc: 'Award-winning luxury lakeside resort with private villas, infinity pool, and Ayurvedic spa on Vembanad Lake.', type: 'Resort', priceRange: '₹12,000–₹35,000/night', rating: 4.8, amenities: ['Pool', 'Spa', 'Lake View', 'Ayurveda'], checkIn: '2:00 PM', lat: 9.5916, lng: 76.4314 },
            { id: 'kh2', name: 'Zostel Alleppey', img: '1564501049412-61c2a3083791', desc: 'Backpacker-friendly hostel right on the Alleppey waterfront. Dorms and private rooms with great common areas.', type: 'Hostel', priceRange: '₹500–₹2,500/night', rating: 4.3, amenities: ['WiFi', 'Common Kitchen', 'Bikes'], checkIn: '1:00 PM', lat: 9.4981, lng: 76.3388 },
            { id: 'kh3', name: 'Windermere Estate', img: '1582719508461-905c673c825d', desc: 'Heritage plantation bungalow amid cardamom and coffee gardens in Munnar with panoramic valley views.', type: 'Homestay', priceRange: '₹4,000–₹8,000/night', rating: 4.6, amenities: ['Garden', 'Trekking', 'Home Cooked Meals'], checkIn: '12:00 PM', lat: 10.0800, lng: 77.0580 },
            { id: 'kh4', name: 'Fragrant Nature Kochi', img: '1566073771259-6a6300d73351', desc: 'Premium waterfront hotel in Fort Kochi with harbor views, rooftop restaurant, and modern amenities.', type: 'Hotel', priceRange: '₹5,000–₹15,000/night', rating: 4.5, amenities: ['Pool', 'Restaurant', 'Harbor View', 'Spa'], checkIn: '2:00 PM', lat: 9.9658, lng: 76.2421 },
        ],
        dayPlans: [
            {
                day: 1, title: 'Kochi – Heritage & Harbour',
                weather: { temp: '24–31°C', condition: 'Partly Cloudy', emoji: '⛅', rain: 15, tip: 'Light & breezy — carry sunglasses' },
                activities: [
                    { time: '06:30 AM', slot: 'Morning', name: 'Chinese Fishing Nets at Sunrise', desc: 'Watch the iconic cantilevered nets operate at dawn along Fort Kochi waterfront.', crowd: 'Low', crowdTip: 'Early morning means very few tourists', lat: 9.9658, lng: 76.2421 },
                    { time: '09:00 AM', slot: 'Morning', name: 'St. Francis Church & Basilica', desc: "Visit India's oldest European church (1503) and the nearby Santa Cruz Basilica.", crowd: 'Medium', crowdTip: 'Weekday mornings are quieter', travelFromPrev: '5 min walk', lat: 9.9640, lng: 76.2430 },
                    { time: '12:30 PM', slot: 'Afternoon', name: 'Lunch at Kayees Rahmathulla', desc: 'Legendary Kochi biryani house since 1948 — fragrant rice with tender meat.', crowd: 'Medium', crowdTip: 'Reserve a table to skip the wait', travelFromPrev: '8 min walk', lat: 9.9716, lng: 76.2893, type: 'restaurant' },
                    { time: '02:00 PM', slot: 'Afternoon', name: 'Mattancherry Palace & Jew Town', desc: 'Dutch Palace with royal murals, then browse antique shops in the Spice Market.', crowd: 'High', crowdTip: 'Gets crowded after 3 PM — arrive early', travelFromPrev: '10 min auto', lat: 9.9577, lng: 76.2590 },
                    { time: '05:30 PM', slot: 'Evening', name: 'Kathakali Performance', desc: 'Traditional dance-drama at Kerala Kathakali Centre — witness elaborate costumes.', crowd: 'Medium', crowdTip: 'Book tickets online in advance', travelFromPrev: '12 min auto', lat: 9.9640, lng: 76.2440 },
                    { time: '08:00 PM', slot: 'Evening', name: 'Seafood Dinner at Fort Kochi', desc: 'Choose-your-catch dinner with beer at an open-air waterfront restaurant.', crowd: 'Low', crowdTip: 'Weeknight dining is relaxed', travelFromPrev: '10 min walk', lat: 9.9700, lng: 76.2400, type: 'restaurant' },
                ],
            },
            {
                day: 2, title: 'Munnar – Tea Hills & Valleys',
                weather: { temp: '15–24°C', condition: 'Misty Morning', emoji: '🌫️', rain: 30, tip: 'Carry a light jacket and umbrella' },
                activities: [
                    { time: '06:00 AM', slot: 'Morning', name: 'Drive to Munnar', desc: 'Scenic 4-hour drive through spice plantations, waterfalls and hairpin bends.', crowd: 'Low', crowdTip: 'Start early to avoid traffic', lat: 10.0889, lng: 77.0595 },
                    { time: '10:30 AM', slot: 'Morning', name: 'Tata Tea Museum', desc: 'Learn the full tea-making process and sample fresh varieties at the estate.', crowd: 'Medium', crowdTip: 'Arrive before 11 for smaller groups', travelFromPrev: '5 min drive', lat: 10.0726, lng: 77.0599 },
                    { time: '01:00 PM', slot: 'Afternoon', name: 'Lunch at Saravana Bhavan', desc: 'South Indian thali with Munnar-special mushroom curry and fresh lime soda.', crowd: 'Medium', crowdTip: 'Peak lunch hour — eat at 12:30 to avoid', travelFromPrev: '10 min drive', lat: 10.0889, lng: 77.0610, type: 'restaurant' },
                    { time: '02:30 PM', slot: 'Afternoon', name: 'Eravikulam National Park', desc: 'Spot the endangered Nilgiri Tahr on rolling grasslands at 7,000 ft altitude.', crowd: 'High', crowdTip: 'Book park entry online — slots fill fast', travelFromPrev: '25 min drive', lat: 10.1687, lng: 77.0642 },
                    { time: '05:00 PM', slot: 'Evening', name: 'Top Station Sunset Viewpoint', desc: 'Highest point in Munnar with panoramic views of Tamil Nadu plains at golden hour.', crowd: 'Low', crowdTip: 'Usually quiet at sunset — carry warm clothes', travelFromPrev: '40 min drive', lat: 10.1278, lng: 77.2410 },
                    { time: '07:30 PM', slot: 'Evening', name: 'Campfire Dinner at Resort', desc: 'Barbecue dinner with bonfire amidst the tea estate under stars.', crowd: 'Low', crowdTip: 'Private resort — peaceful experience', travelFromPrev: '30 min drive', lat: 10.0800, lng: 77.0580, type: 'restaurant' },
                ],
            },
            {
                day: 3, title: 'Alleppey – Houseboat & Backwaters',
                weather: { temp: '25–33°C', condition: 'Sunny', emoji: '☀️', rain: 5, tip: 'Stay hydrated and use sunscreen' },
                activities: [
                    { time: '07:00 AM', slot: 'Morning', name: 'Drive to Alleppey', desc: 'Descend from the hills to the backwater country (4-hour scenic drive).', crowd: 'Low', crowdTip: 'Highway traffic is light before 8 AM', lat: 9.4981, lng: 76.3388 },
                    { time: '11:30 AM', slot: 'Morning', name: 'Board Premium Houseboat', desc: 'Board a traditional kettuvallam with bedroom, kitchen and sundeck.', crowd: 'Low', crowdTip: 'Private houseboat — your own floating villa', travelFromPrev: '10 min auto', lat: 9.4900, lng: 76.3350 },
                    { time: '01:00 PM', slot: 'Afternoon', name: 'Lunch on the Houseboat', desc: 'Fresh karimeen (pearl spot fish) and Kerala rice served as the boat cruises past paddy fields.', crowd: 'Low', crowdTip: 'Meals included — prepare by the onboard chef', travelFromPrev: 'onboard', lat: 9.5050, lng: 76.3400, type: 'restaurant' },
                    { time: '03:30 PM', slot: 'Afternoon', name: 'Village Walk & Toddy Shop', desc: 'Anchor and walk through a backwater village — visit a coir-making workshop and sample palm toddy.', crowd: 'Low', crowdTip: 'Villagers are welcoming — carry small change', travelFromPrev: 'boat stop', lat: 9.5200, lng: 76.3500 },
                    { time: '05:30 PM', slot: 'Evening', name: 'Backwater Sunset Cruise', desc: 'The houseboat glides through narrow canals as the sky turns golden and pink.', crowd: 'Low', crowdTip: 'Peak beauty hour — have your camera ready', travelFromPrev: 'onboard', lat: 9.5100, lng: 76.3450 },
                    { time: '08:00 PM', slot: 'Evening', name: 'Overnight Stay on Houseboat', desc: 'Candle-lit dinner on the sundeck, then sleep gently rocking on the backwaters.', crowd: 'Low', crowdTip: 'Peaceful — stars visible on clear nights', travelFromPrev: 'onboard', lat: 9.5000, lng: 76.3380 },
                ],
            },
        ],
    },
    jaipur: {
        logistics: { flights: 'Nearest Airport: Jaipur (JAI) — ~₹3,500 avg', trains: 'Major Station: Jaipur Junction (JP)' },
        description: 'Jaipur, the Pink City of Rajasthan, is a regal canvas of rose-hued palaces, bustling bazaars, and majestic forts that bring Rajputana grandeur to vivid life.',
        avgCost: '₹2,000 – ₹7,000',
        weather: { Jan: '8–22°C', Feb: '11–25°C', Mar: '16–30°C', Apr: '22–36°C', May: '26–41°C', Jun: '27–39°C', Jul: '25–34°C', Aug: '24–33°C', Sep: '23–34°C', Oct: '17–33°C', Nov: '11–26°C', Dec: '8–22°C' },
        crowdLevel: 'High', crowdNote: 'Popular year-round; Oct–Feb best with Diwali and Teej festivals',
        mapCenter: { lat: 26.9124, lng: 75.7873 },
        highlights: [
            { name: 'Amber Fort', img: '1599661502283-a44ea24dfc74', desc: 'Magnificent hilltop fortress with intricate mirror mosaics.', bestMonths: 'Oct – Mar', duration: '3–5 hrs', walking: 'High', value: 'High', tags: ['Fort', 'History'], lat: 26.9855, lng: 75.8513 },
            { name: 'Hawa Mahal', img: '1524492412937-b28074a5d7da', desc: 'Iconic 5-storey Palace of Winds with 953 latticed windows.', bestMonths: 'Oct – Mar', duration: '1–2 hrs', walking: 'Easy', value: 'High', tags: ['Architecture', 'Iconic'], lat: 26.9239, lng: 75.8267 },
            { name: 'City Palace', img: '1599661502283-a44ea24dfc74', desc: 'Sprawling royal complex housing museums and courtyards.', bestMonths: 'Oct – Mar', duration: '2–4 hrs', walking: 'Medium', value: 'High', tags: ['Palace', 'Museum'], lat: 26.9258, lng: 75.8237 },
            { name: 'Nahargarh Fort', img: '1626621341517-bbf3d9990a23', desc: 'Tiger fort on the Aravalli hills with panoramic sunset views.', bestMonths: 'Oct – Mar', duration: '2–3 hrs', walking: 'High', value: 'High', tags: ['Fort', 'Sunset'], lat: 26.9388, lng: 75.8154 },
            { name: 'Johari Bazaar', img: '1582283925565-d053709d3bdf', desc: 'Famous market for gems, silver jewellery and vivid textiles.', bestMonths: 'Oct – Mar', duration: '2–4 hrs', walking: 'Medium', value: 'High', tags: ['Shopping', 'Culture'], lat: 26.9196, lng: 75.8250 },
            { name: 'Jantar Mantar', img: '1593693397690-362cb9666fc2', desc: 'UNESCO World Heritage astronomical observatory.', bestMonths: 'Oct – Mar', duration: '1–2 hrs', walking: 'Easy', value: 'High', tags: ['Heritage', 'UNESCO'], lat: 26.9248, lng: 75.8246 },
        ],
        restaurants: [
            { id: 'jr1', name: 'Laxmi Misthan Bhandar (LMB)', img: '1567521464027-f127ff144326', desc: 'Legendary since 1727 — the most iconic vegetarian restaurant in Jaipur. Famous for dal baati churma and ghevar.', cuisine: 'Rajasthani Veg', priceRange: '₹200–₹600', rating: 4.5, mustTry: 'Dal Baati Churma & Ghevar', timing: '8:00 AM – 11:00 PM', lat: 26.9220, lng: 75.8260, tags: ['Iconic', 'Vegetarian'] },
            { id: 'jr2', name: 'Rawat Mishtan Bhandar', img: '1631515243349-e0cb75fb8d4a', desc: 'The go-to spot for the best pyaaz kachori in all of Rajasthan. Crispy, spiced, heavenly.', cuisine: 'Street Food', priceRange: '₹50–₹250', rating: 4.6, mustTry: 'Pyaaz Kachori & Mirchi Bada', timing: '6:30 AM – 10:30 PM', lat: 26.9070, lng: 75.8030, tags: ['Street Food', 'Snacks'] },
            { id: 'jr3', name: 'Chokhi Dhani', img: '1555396273-367ea4eb4db5', desc: 'Immersive Rajasthani village resort — folk dances, camel rides, puppet shows, and unlimited thali dinner.', cuisine: 'Rajasthani Thali', priceRange: '₹800–₹1,500', rating: 4.4, mustTry: 'Unlimited Rajasthani Thali', timing: '5:00 PM – 11:00 PM', lat: 26.7800, lng: 75.8465, tags: ['Experience', 'Cultural'] },
        ],
        hotels: [
            { id: 'jh1', name: 'Rambagh Palace', img: '1571896349842-33c89424de2d', desc: 'Former residence of the Maharaja, now a Taj luxury hotel with opulent suites and royal gardens.', type: 'Hotel', priceRange: '₹25,000–₹80,000/night', rating: 4.9, amenities: ['Pool', 'Spa', 'Heritage', 'Fine Dining'], checkIn: '2:00 PM', lat: 26.8975, lng: 75.8029 },
            { id: 'jh2', name: 'Pearl Palace Heritage', img: '1564501049412-61c2a3083791', desc: 'Award-winning budget boutique hotel with rooftop restaurant and beautifully themed rooms.', type: 'Hotel', priceRange: '₹1,500–₹4,000/night', rating: 4.5, amenities: ['Rooftop', 'WiFi', 'Restaurant'], checkIn: '12:00 PM', lat: 26.9124, lng: 75.7873 },
            { id: 'jh3', name: 'Arya Niwas', img: '1582719508461-905c673c825d', desc: 'Well-known heritage guesthouse with sprawling gardens, home-cooked meals, and warm Rajasthani hospitality.', type: 'Homestay', priceRange: '₹2,000–₹5,000/night', rating: 4.4, amenities: ['Garden', 'Home Meals', 'Central Location'], checkIn: '12:00 PM', lat: 26.9160, lng: 75.8050 },
        ],
        dayPlans: [
            {
                day: 1, title: 'Royal Jaipur – Forts & Palaces',
                weather: { temp: '12–26°C', condition: 'Clear Skies', emoji: '☀️', rain: 0, tip: 'Great day for sightseeing — carry water' },
                activities: [
                    { time: '07:00 AM', slot: 'Morning', name: 'Amber Fort', desc: 'Explore the stunning hilltop fortress with Sheesh Mahal mirror palace.', crowd: 'Medium', crowdTip: 'First entry slot is least crowded', lat: 26.9855, lng: 75.8513 },
                    { time: '10:00 AM', slot: 'Morning', name: 'Jal Mahal Photo Stop', desc: 'Picture-perfect water palace in the middle of Man Sagar Lake.', crowd: 'Low', crowdTip: 'Quick stop — viewing from the road', travelFromPrev: '15 min drive', lat: 26.9530, lng: 75.8460 },
                    { time: '11:30 AM', slot: 'Afternoon', name: 'City Palace Museum', desc: 'Royal artefacts, textiles and the famous silver urns of Maharaja Sawai.', crowd: 'High', crowdTip: 'Skip-the-line tickets save 30 min', travelFromPrev: '20 min drive', lat: 26.9258, lng: 75.8237 },
                    { time: '01:30 PM', slot: 'Afternoon', name: 'Lunch at LMB', desc: 'Legendary Rajasthani thali — dal baati churma and ghevar since 1727.', crowd: 'High', crowdTip: 'Extremely popular — expect 20 min wait', travelFromPrev: '5 min walk', lat: 26.9220, lng: 75.8260, type: 'restaurant' },
                    { time: '03:30 PM', slot: 'Afternoon', name: 'Hawa Mahal & Jantar Mantar', desc: 'Palace of Winds then walk to the ancient astronomical observatory next door.', crowd: 'Medium', crowdTip: 'Afternoon light is best for Hawa Mahal photos', travelFromPrev: '5 min walk', lat: 26.9239, lng: 75.8267 },
                    { time: '05:30 PM', slot: 'Evening', name: 'Nahargarh Fort Sunset', desc: 'Drive up to the fort for a spectacular sunset over the entire Pink City.', crowd: 'Medium', crowdTip: 'Reach by 5 PM for best spots', travelFromPrev: '25 min drive', lat: 26.9388, lng: 75.8154 },
                ],
            },
            {
                day: 2, title: 'Bazaars, Temples & Hidden Gems',
                weather: { temp: '10–24°C', condition: 'Hazy Morning', emoji: '🌤️', rain: 5, tip: 'Cool morning — layer up for the early temple visit' },
                activities: [
                    { time: '06:00 AM', slot: 'Morning', name: 'Birla Mandir Sunrise', desc: 'Pristine white marble temple glowing at dawn — peaceful prayers and city views.', crowd: 'Low', crowdTip: 'Dawn aarti has under 20 visitors', lat: 26.8923, lng: 75.8150 },
                    { time: '09:00 AM', slot: 'Morning', name: 'Albert Hall Museum', desc: 'Indo-Saracenic architectural gem with an Egyptian mummy and Mughal art.', crowd: 'Low', crowdTip: 'Opens at 9 — be first in', travelFromPrev: '10 min drive', lat: 26.9116, lng: 75.8188 },
                    { time: '11:30 AM', slot: 'Morning', name: 'Johari & Bapu Bazaar', desc: 'Hunt for Rajasthani jewellery, block-printed fabrics and juttis.', crowd: 'High', crowdTip: 'Bargain hard — start at 40% of asking price', travelFromPrev: '10 min auto', lat: 26.9196, lng: 75.8250 },
                    { time: '01:00 PM', slot: 'Afternoon', name: 'Lunch – Rawat Mishtan', desc: 'Famous pyaaz kachori and lassi in the old walled city.', crowd: 'Medium', crowdTip: 'Grab a takeaway to avoid seating wait', travelFromPrev: '5 min walk', lat: 26.9070, lng: 75.8030, type: 'restaurant' },
                    { time: '03:00 PM', slot: 'Afternoon', name: 'Anokhi Museum of Hand Printing', desc: 'Restored haveli showing centuries-old block-printing techniques.', crowd: 'Low', crowdTip: 'Hidden gem — rarely crowded', travelFromPrev: '25 min drive', lat: 26.9855, lng: 75.8513 },
                    { time: '06:30 PM', slot: 'Evening', name: 'Chokhi Dhani Village Dinner', desc: 'Immersive Rajasthani village resort — folk dances, camel rides, unlimited thali.', crowd: 'Medium', crowdTip: 'Book in advance for weekends', travelFromPrev: '30 min drive', lat: 26.7800, lng: 75.8465, type: 'restaurant' },
                ],
            },
        ],
    },
    varanasi: {
        logistics: { flights: 'Nearest Airport: Lal Bahadur Shastri (VNS)', trains: 'Major Station: Varanasi Junction (BSB)' },
        description: "Varanasi, one of the world's oldest living cities, sits on the sacred Ganges and pulses with ancient rituals, timeless ghats, and an atmosphere unlike anywhere on Earth.",
        avgCost: '₹1,500 – ₹5,000',
        weather: { Jan: '6–20°C', Feb: '9–24°C', Mar: '14–30°C', Apr: '20–37°C', May: '25–41°C', Jun: '26–37°C', Jul: '24–31°C', Aug: '24–31°C', Sep: '23–32°C', Oct: '16–31°C', Nov: '9–26°C', Dec: '6–21°C' },
        crowdLevel: 'High', crowdNote: 'Busy year-round; Dev Deepawali draws massive crowds',
        mapCenter: { lat: 25.3176, lng: 83.0065 },
        highlights: [
            { name: 'Dashashwamedh Ghat', img: '1582283925565-d053709d3bdf', desc: 'Spectacular fire Ganga Aarti ceremony every evening.', bestMonths: 'Oct – Mar', duration: '1–3 hrs', walking: 'Easy', value: 'High', tags: ['Spiritual', 'Aarti'], lat: 25.3046, lng: 83.0105 },
            { name: 'Kashi Vishwanath', img: '1582283925565-d053709d3bdf', desc: 'One of the most sacred Jyotirlinga shrines of Lord Shiva.', bestMonths: 'All year', duration: '1–2 hrs', walking: 'Easy', value: 'High', tags: ['Temple', 'Spiritual'], lat: 25.3109, lng: 83.0107 },
            { name: 'Sunrise Boat Ride', img: '1593693397690-362cb9666fc2', desc: 'Row past 84 ghats at dawn as priests perform rituals.', bestMonths: 'Oct – Mar', duration: '1–2 hrs', walking: 'Easy', value: 'High', tags: ['Sunrise', 'Boat'], lat: 25.3000, lng: 83.0080 },
            { name: 'Sarnath', img: '1524492412937-b28074a5d7da', desc: 'Sacred Buddhist site where the Buddha gave his first sermon.', bestMonths: 'Oct – Mar', duration: '3–4 hrs', walking: 'Easy', value: 'High', tags: ['Buddhist', 'Heritage'], lat: 25.3814, lng: 83.0246 },
        ],
        restaurants: [
            { id: 'vr1', name: 'Kashi Chat Bhandar', img: '1567521464027-f127ff144326', desc: 'The most beloved chaat shop in Varanasi. Tamatar chaat and dahi puri are legendary.', cuisine: 'Street Food', priceRange: '₹30–₹150', rating: 4.7, mustTry: 'Tamatar Chaat & Banarasi Paan', timing: '10:00 AM – 10:00 PM', lat: 25.3080, lng: 83.0100, tags: ['Street Food', 'Iconic'] },
            { id: 'vr2', name: 'Blue Lassi Shop', img: '1631515243349-e0cb75fb8d4a', desc: 'Tiny hole-in-the-wall shop near Manikarnika Ghat. The thick, creamy lassi served in clay cups is a Varanasi ritual.', cuisine: 'Beverages', priceRange: '₹40–₹120', rating: 4.8, mustTry: 'Saffron Lassi & Fruit Lassi', timing: '7:00 AM – 9:00 PM', lat: 25.3100, lng: 83.0110, tags: ['Lassi', 'Must Visit'] },
        ],
        hotels: [
            { id: 'vh1', name: 'BrijRama Palace', img: '1571896349842-33c89424de2d', desc: '18th-century palace on the banks of the Ganges with heritage suites and river-facing balconies.', type: 'Hotel', priceRange: '₹12,000–₹30,000/night', rating: 4.8, amenities: ['Heritage', 'River View', 'Restaurant', 'Spa'], checkIn: '2:00 PM', lat: 25.3046, lng: 83.0105 },
            { id: 'vh2', name: 'Stops Hostel Varanasi', img: '1564501049412-61c2a3083791', desc: 'Vibrant backpacker hostel near Assi Ghat with rooftop views and social atmosphere.', type: 'Hostel', priceRange: '₹500–₹2,000/night', rating: 4.4, amenities: ['Rooftop', 'WiFi', 'Tours'], checkIn: '1:00 PM', lat: 25.2950, lng: 83.0060 },
        ],
        dayPlans: [
            {
                day: 1, title: 'Ghats, Ganges & Ganga Aarti',
                weather: { temp: '10–22°C', condition: 'Clear', emoji: '☀️', rain: 0, tip: 'Cool morning — light layers recommended' },
                activities: [
                    { time: '05:30 AM', slot: 'Morning', name: 'Sunrise Boat Ride on Ganges', desc: 'Row past 84 ancient ghats as the golden sun rises over the holy river.', crowd: 'Medium', crowdTip: 'Book private boat night before', lat: 25.3000, lng: 83.0080 },
                    { time: '08:00 AM', slot: 'Morning', name: 'Kashi Vishwanath Temple', desc: "Darshan at one of India's holiest temples through the new corridor.", crowd: 'High', crowdTip: 'Go early and use e-pass for VIP darshan', travelFromPrev: '10 min walk', lat: 25.3109, lng: 83.0107 },
                    { time: '10:30 AM', slot: 'Morning', name: 'Ghat Walking Tour', desc: 'Walk from Assi Ghat to Manikarnika — 84 ghats of stories and history.', crowd: 'Medium', crowdTip: 'Hire a local guide for stories', travelFromPrev: '5 min walk', lat: 25.2950, lng: 83.0060 },
                    { time: '01:00 PM', slot: 'Afternoon', name: 'Banarasi Lunch at Kashi Chat', desc: 'Legendary tamatar chaat, dahi puri and the best Banarasi lassi.', crowd: 'Medium', crowdTip: 'Tiny lanes — expect some crowding', travelFromPrev: '10 min walk', lat: 25.3080, lng: 83.0100, type: 'restaurant' },
                    { time: '03:00 PM', slot: 'Afternoon', name: 'Silk Weaving Workshop', desc: 'Watch master weavers create Banarasi silk saris on traditional looms.', crowd: 'Low', crowdTip: 'Hidden workshops — ask your guide', travelFromPrev: '15 min auto', lat: 25.3200, lng: 83.0150 },
                    { time: '06:30 PM', slot: 'Evening', name: 'Dashashwamedh Ghat Ganga Aarti', desc: 'The magnificent fire ceremony with thousands of lamps, chanting and smoke.', crowd: 'High', crowdTip: 'Arrive 1 hr early for front-row on the ghat', travelFromPrev: '10 min auto', lat: 25.3046, lng: 83.0105 },
                ],
            },
        ],
    },
    goa: {
        logistics: { flights: 'Nearest Airports: Dabolim (GOI), Mopa (GOX)', trains: 'Major Stations: Madgaon (MAO), Thivim (THVM)' },
        description: "Goa is India's coastal jewel — a heady mix of Portuguese heritage, pristine beaches, fresh seafood, and a carefree spirit.",
        avgCost: '₹2,000 – ₹9,000',
        weather: { Jan: '20–31°C', Feb: '21–32°C', Mar: '23–33°C', Apr: '25–34°C', May: '26–34°C', Jun: '24–29°C', Jul: '23–28°C', Aug: '23–28°C', Sep: '23–30°C', Oct: '24–31°C', Nov: '22–31°C', Dec: '20–30°C' },
        crowdLevel: 'High', crowdNote: 'Peak season Nov–Feb; monsoon quieter with lush greenery',
        mapCenter: { lat: 15.2993, lng: 74.1240 },
        highlights: [
            { name: 'Palolem Beach', img: '1512343779784-a1d53b98b8ef', desc: 'Gorgeous crescent beach with gentle waves and sunset huts.', bestMonths: 'Nov – Mar', duration: '2–8 hrs', walking: 'Easy', value: 'High', tags: ['Beach', 'Sunset'], lat: 15.0100, lng: 74.0230 },
            { name: 'Basilica of Bom Jesus', img: '1524492412937-b28074a5d7da', desc: 'UNESCO baroque church holding remains of St. Francis Xavier.', bestMonths: 'Nov – Mar', duration: '1–2 hrs', walking: 'Easy', value: 'High', tags: ['Heritage', 'Church'], lat: 15.5009, lng: 73.9116 },
            { name: 'Dudhsagar Falls', img: '1593693397690-362cb9666fc2', desc: "One of India's tallest waterfalls at 310m through dense forest.", bestMonths: 'Jun – Jan', duration: '4–6 hrs', walking: 'High', value: 'High', tags: ['Waterfall', 'Trekking'], lat: 15.3144, lng: 74.3143 },
            { name: 'Anjuna Flea Market', img: '1512343779784-a1d53b98b8ef', desc: 'The original hippie market with handicrafts and souvenirs.', bestMonths: 'Nov – Apr', duration: '2–4 hrs', walking: 'Medium', value: 'High', tags: ['Market', 'Shopping'], lat: 15.5740, lng: 73.7411 },
        ],
        restaurants: [
            { id: 'gr1', name: 'Thalassa', img: '1555396273-367ea4eb4db5', desc: 'Cliff-top Greek restaurant with stunning sunset views, fairy lights, and live music over the Arabian Sea.', cuisine: 'Greek-Goan', priceRange: '₹800–₹2,000', rating: 4.6, mustTry: 'Grilled Seafood Platter & Greek Salad', timing: '5:00 PM – 11:30 PM', lat: 15.5950, lng: 73.7430, tags: ['Sunset', 'Fine Dining'] },
            { id: 'gr2', name: 'Vinayak Family Restaurant', img: '1567521464027-f127ff144326', desc: 'No-frills local eatery known for the best fish thali in Goa. Authentic Goan home-style cooking.', cuisine: 'Goan', priceRange: '₹150–₹400', rating: 4.5, mustTry: 'Fish Thali & Prawn Rawa Fry', timing: '11:30 AM – 3:30 PM', lat: 15.4588, lng: 73.8158, tags: ['Local', 'Seafood'] },
        ],
        hotels: [
            { id: 'gh1', name: 'Elsewhere', img: '1582719508461-905c673c825d', desc: 'Charming beach huts on a secluded South Goa beach. Solar powered, barefoot luxury with an artistic vibe.', type: 'Homestay', priceRange: '₹3,000–₹8,000/night', rating: 4.7, amenities: ['Beachfront', 'Eco-Friendly', 'Art'], checkIn: '2:00 PM', lat: 15.0100, lng: 74.0230 },
            { id: 'gh2', name: 'W Goa', img: '1566073771259-6a6300d73351', desc: 'Luxury beachside resort with infinity pool, spa, and multiple dining options overlooking the Arabian Sea.', type: 'Resort', priceRange: '₹15,000–₹40,000/night', rating: 4.6, amenities: ['Pool', 'Spa', 'Beach', 'Nightlife'], checkIn: '3:00 PM', lat: 15.5560, lng: 73.7450 },
        ],
        dayPlans: [
            {
                day: 1, title: 'Heritage Goa & Beach Sunset',
                weather: { temp: '22–31°C', condition: 'Sunny', emoji: '☀️', rain: 0, tip: 'Sunscreen essential — tropical sun is strong' },
                activities: [
                    { time: '08:00 AM', slot: 'Morning', name: 'Basilica of Bom Jesus', desc: 'UNESCO World Heritage baroque church from 1605.', crowd: 'Low', crowdTip: 'Opens at 8 — visit before tourist buses arrive', lat: 15.5009, lng: 73.9116 },
                    { time: '10:00 AM', slot: 'Morning', name: 'Sé Cathedral & Old Goa', desc: 'Largest church in Asia with golden bell and Portuguese architecture.', crowd: 'Medium', crowdTip: 'Combined with Basilica — 2 hr total', travelFromPrev: '5 min walk', lat: 15.5039, lng: 73.9118 },
                    { time: '12:30 PM', slot: 'Afternoon', name: 'Fish Thali at Vinayak', desc: 'Authentic Goan fish curry rice thali in a heritage bungalow.', crowd: 'Medium', crowdTip: 'Popular — arrive on time for reservation', travelFromPrev: '20 min drive', lat: 15.4588, lng: 73.8158, type: 'restaurant' },
                    { time: '02:30 PM', slot: 'Afternoon', name: 'Spice Plantation Tour', desc: 'Walk through organic farms of cardamom, vanilla, pepper with traditional lunch.', crowd: 'Low', crowdTip: 'Small groups — very peaceful', travelFromPrev: '30 min drive', lat: 15.3800, lng: 74.0200 },
                    { time: '05:00 PM', slot: 'Evening', name: 'Anjuna Beach Sunset', desc: 'Golden hour on the sandy cliffs with shacks playing chill music.', crowd: 'Medium', crowdTip: 'Weekend gets busy — weekday is ideal', travelFromPrev: '25 min drive', lat: 15.5740, lng: 73.7411 },
                    { time: '08:00 PM', slot: 'Evening', name: 'Dinner at Thalassa', desc: 'Cliff-top Greek restaurant with fairy lights and live music over the sea.', crowd: 'High', crowdTip: 'Must reserve — booked out weeks ahead', travelFromPrev: '10 min drive', lat: 15.5950, lng: 73.7430, type: 'restaurant' },
                ],
            },
        ],
    },
    manali: {
        logistics: { flights: 'Nearest Airport: Kullu-Manali (KUU)', trains: 'Nearest Hub: Chandigarh, then drive' },
        description: 'Manali is a high-altitude Himalayan town — the perfect base for adventure sports, snow-capped landscapes, ancient temples, and mountain culture.',
        avgCost: '₹2,000 – ₹7,000',
        weather: { Jan: '-10–5°C', Feb: '-8–6°C', Mar: '-2–12°C', Apr: '4–18°C', May: '8–23°C', Jun: '12–27°C', Jul: '10–23°C', Aug: '10–22°C', Sep: '8–20°C', Oct: '2–15°C', Nov: '-3–8°C', Dec: '-8–3°C' },
        crowdLevel: 'High', crowdNote: 'Peak: May–Jun & Dec–Jan; Rohtang Pass closed Nov–May',
        mapCenter: { lat: 32.2396, lng: 77.1887 },
        highlights: [
            { name: 'Rohtang Pass', img: '1626621341517-bbf3d9990a23', desc: 'High mountain pass at 3,978m with glaciers and snowfields.', bestMonths: 'May – Sep', duration: '6–8 hrs', walking: 'Medium', value: 'High', tags: ['Mountains', 'Snow'], lat: 32.3700, lng: 77.2480 },
            { name: 'Hadimba Devi Temple', img: '1582283925565-d053709d3bdf', desc: 'Ancient cave temple amid towering cedar trees.', bestMonths: 'All year', duration: '1–2 hrs', walking: 'Easy', value: 'High', tags: ['Temple', 'Forest'], lat: 32.2427, lng: 77.1785 },
            { name: 'Solang Valley', img: '1626621341517-bbf3d9990a23', desc: 'Adventure hub for paragliding, skiing and cable car rides.', bestMonths: 'Dec–Feb, May–Jun', duration: '3–5 hrs', walking: 'Medium', value: 'High', tags: ['Adventure', 'Snow'], lat: 32.3152, lng: 77.1575 },
            { name: 'Old Manali Walk', img: '1524492412937-b28074a5d7da', desc: 'Apple orchards, bohemian cafes and Manu Maharishi Temple.', bestMonths: 'May – Oct', duration: '2–4 hrs', walking: 'Medium', value: 'High', tags: ['Culture', 'Walk'], lat: 32.2520, lng: 77.1870 },
        ],
        restaurants: [
            { id: 'mr1', name: 'Lazy Dog Lounge', img: '1555396273-367ea4eb4db5', desc: 'Old Manali café with mountain views, wood-fired pizza, and great coffee. Popular with backpackers.', cuisine: 'Continental', priceRange: '₹200–₹600', rating: 4.5, mustTry: 'Wood-fired Pizza & Pancakes', timing: '8:00 AM – 11:00 PM', lat: 32.2520, lng: 77.1870, tags: ['Café', 'Views'] },
            { id: 'mr2', name: 'Johnson\'s Café', img: '1517248135467-4c7edcad34c4', desc: 'Iconic Manali restaurant in a stone cottage from the 1930s. Famous for trout and continental dishes.', cuisine: 'Continental-Indian', priceRange: '₹400–₹1,000', rating: 4.6, mustTry: 'Fresh River Trout & Apple Crumble', timing: '10:00 AM – 10:00 PM', lat: 32.2400, lng: 77.1900, tags: ['Heritage', 'Fine Dining'] },
        ],
        hotels: [
            { id: 'mh1', name: 'Himalayan Village Resort', img: '1571896349842-33c89424de2d', desc: 'Traditional Himachali cottage resort with valley views, bonfire, and farm-to-table meals.', type: 'Resort', priceRange: '₹6,000–₹15,000/night', rating: 4.7, amenities: ['Valley View', 'Bonfire', 'Trekking', 'Organic Food'], checkIn: '1:00 PM', lat: 32.2500, lng: 77.1800 },
            { id: 'mh2', name: 'Zostel Manali', img: '1564501049412-61c2a3083791', desc: 'Hip backpacker hostel in Old Manali with mountain views, common room, and easy access to cafes.', type: 'Hostel', priceRange: '₹500–₹2,500/night', rating: 4.3, amenities: ['WiFi', 'Common Room', 'Mountain View'], checkIn: '1:00 PM', lat: 32.2520, lng: 77.1870 },
        ],
        dayPlans: [
            {
                day: 1, title: 'Manali Town & Mountain Temples',
                weather: { temp: '5–18°C', condition: 'Clear Skies', emoji: '🏔️', rain: 0, tip: 'Layer up — sunshine is warm but wind is cold' },
                activities: [
                    { time: '07:00 AM', slot: 'Morning', name: 'Hadimba Devi Temple', desc: 'Ancient pagoda-style cave temple surrounded by cedar forest.', crowd: 'Low', crowdTip: 'Early morning is most peaceful', lat: 32.2427, lng: 77.1785 },
                    { time: '09:30 AM', slot: 'Morning', name: 'Manu Temple & Old Manali', desc: 'Walk to the sage Manu temple then explore bohemian Old Manali cafes.', crowd: 'Low', crowdTip: 'Shops open by 10 — enjoy the quiet walk', travelFromPrev: '15 min walk', lat: 32.2520, lng: 77.1870 },
                    { time: '12:00 PM', slot: 'Afternoon', name: 'Lunch at Lazy Dog', desc: 'Wood-fired pizza and cappuccino with mountain views at this iconic café.', crowd: 'Medium', crowdTip: 'Small café — be prepared to share table', travelFromPrev: '5 min walk', lat: 32.2520, lng: 77.1870, type: 'restaurant' },
                    { time: '02:00 PM', slot: 'Afternoon', name: 'Vashisht Hot Springs', desc: 'Sacred natural hot water springs inside a stone temple — perfect after trekking.', crowd: 'Medium', crowdTip: 'Weekday afternoons are quieter', travelFromPrev: '10 min drive', lat: 32.2680, lng: 77.1830 },
                    { time: '04:30 PM', slot: 'Evening', name: 'Jogini Waterfall Trek', desc: 'Short scenic trek through apple orchards to a beautiful Himalayan waterfall.', crowd: 'Low', crowdTip: 'Trail is narrow — go in daylight only', travelFromPrev: '15 min drive', lat: 32.2590, lng: 77.1700 },
                    { time: '07:00 PM', slot: 'Evening', name: 'Dinner at Johnson\'s Café', desc: 'Fresh river trout and apple crumble in a beautiful stone cottage setting.', crowd: 'Medium', crowdTip: 'Reserve ahead — popular with tourists', travelFromPrev: '10 min drive', lat: 32.2400, lng: 77.1900, type: 'restaurant' },
                ],
            },
        ],
    },
};

export const FALLBACK_DEST: DestInfo = {
    ...DEST_DATA.kerala,
    description: 'An incredible Indian destination waiting to be explored.',
    avgCost: '₹2,000 – ₹6,000',
};

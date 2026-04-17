import { DEST_IMAGES, FALLBACK_IMAGES } from '@/lib/imageMap';

export type Destination = {
    id: number; name: string; state: string; tagline: string; rating: number;
    image: string; category: string; bestTime: string; budget: string; duration: string;
    highlights: string[];
};

export const ALL_DESTINATIONS: Destination[] = [
    // ── North India ──────────────────────────────────────────────
    { id: 1, name: 'Jaipur', state: 'Rajasthan', tagline: 'The Pink City', rating: 4.8, image: DEST_IMAGES.jaipur, category: 'Heritage', bestTime: 'Oct – Mar', budget: '₹15k – ₹25k', duration: '3–4 days', highlights: ['Hawa Mahal', 'Amber Fort', 'City Palace'] },
    { id: 2, name: 'Delhi', state: 'Delhi', tagline: 'Capital of Contrasts', rating: 4.5, image: DEST_IMAGES.delhi, category: 'Heritage', bestTime: 'Oct – Mar', budget: '₹10k – ₹25k', duration: '3–4 days', highlights: ['Red Fort', 'Qutub Minar', 'Chandni Chowk'] },
    { id: 3, name: 'Agra', state: 'Uttar Pradesh', tagline: 'City of the Taj', rating: 4.9, image: DEST_IMAGES.agra, category: 'Heritage', bestTime: 'Oct – Mar', budget: '₹8k – ₹18k', duration: '2–3 days', highlights: ['Taj Mahal', 'Agra Fort', 'Mehtab Bagh'] },
    { id: 4, name: 'Varanasi', state: 'Uttar Pradesh', tagline: 'City of Light', rating: 4.7, image: DEST_IMAGES.varanasi, category: 'Spiritual', bestTime: 'Nov – Feb', budget: '₹8k – ₹15k', duration: '2–3 days', highlights: ['Ganga Aarti', 'Sarnath', 'Boat Ride'] },
    { id: 5, name: 'Amritsar', state: 'Punjab', tagline: 'Golden City', rating: 4.8, image: DEST_IMAGES.amritsar, category: 'Spiritual', bestTime: 'Oct – Mar', budget: '₹8k – ₹15k', duration: '2–3 days', highlights: ['Golden Temple', 'Wagah Border', 'Jallianwala Bagh'] },
    { id: 6, name: 'Lucknow', state: 'Uttar Pradesh', tagline: 'City of Nawabs', rating: 4.5, image: DEST_IMAGES.lucknow, category: 'Heritage', bestTime: 'Oct – Mar', budget: '₹8k – ₹15k', duration: '2–3 days', highlights: ['Bara Imambara', 'Tunday Kebabi', 'Rumi Darwaza'] },
    { id: 7, name: 'Chandigarh', state: 'Punjab/Haryana', tagline: 'City Beautiful', rating: 4.3, image: DEST_IMAGES.chandigarh, category: 'Heritage', bestTime: 'Sep – Mar', budget: '₹8k – ₹18k', duration: '2–3 days', highlights: ['Rock Garden', 'Sukhna Lake', 'Rose Garden'] },
    { id: 8, name: 'Mathura-Vrindavan', state: 'Uttar Pradesh', tagline: 'Land of Krishna', rating: 4.6, image: DEST_IMAGES.mathura, category: 'Spiritual', bestTime: 'Oct – Mar', budget: '₹5k – ₹12k', duration: '2 days', highlights: ['Krishna Janmabhoomi', 'Banke Bihari', 'Prem Mandir'] },
    { id: 9, name: 'Ayodhya', state: 'Uttar Pradesh', tagline: 'City of Lord Ram', rating: 4.7, image: DEST_IMAGES.ayodhya, category: 'Spiritual', bestTime: 'Oct – Mar', budget: '₹5k – ₹10k', duration: '2 days', highlights: ['Ram Mandir', 'Hanuman Garhi', 'Saryu Ghat'] },
    { id: 10, name: 'Prayagraj', state: 'Uttar Pradesh', tagline: 'Sangam City', rating: 4.4, image: DEST_IMAGES.prayagraj, category: 'Spiritual', bestTime: 'Oct – Mar', budget: '₹5k – ₹12k', duration: '2 days', highlights: ['Triveni Sangam', 'Anand Bhawan', 'Kumbh Mela'] },

    // ── Rajasthan ────────────────────────────────────────────────
    { id: 11, name: 'Udaipur', state: 'Rajasthan', tagline: 'City of Lakes', rating: 4.9, image: DEST_IMAGES.udaipur, category: 'Heritage', bestTime: 'Sep – Mar', budget: '₹15k – ₹30k', duration: '3–4 days', highlights: ['Lake Pichola', 'City Palace', 'Jag Mandir'] },
    { id: 12, name: 'Jodhpur', state: 'Rajasthan', tagline: 'Blue City', rating: 4.7, image: DEST_IMAGES.jodhpur, category: 'Heritage', bestTime: 'Oct – Mar', budget: '₹10k – ₹22k', duration: '2–3 days', highlights: ['Mehrangarh Fort', 'Blue City Walk', 'Umaid Bhawan'] },
    { id: 13, name: 'Jaisalmer', state: 'Rajasthan', tagline: 'Golden City', rating: 4.8, image: DEST_IMAGES.jaisalmer, category: 'Adventure', bestTime: 'Oct – Mar', budget: '₹12k – ₹25k', duration: '3–4 days', highlights: ['Desert Safari', 'Jaisalmer Fort', 'Sam Sand Dunes'] },
    { id: 14, name: 'Pushkar', state: 'Rajasthan', tagline: 'Rose Garden of Rajasthan', rating: 4.5, image: DEST_IMAGES.pushkar, category: 'Spiritual', bestTime: 'Oct – Mar', budget: '₹5k – ₹12k', duration: '2 days', highlights: ['Pushkar Lake', 'Brahma Temple', 'Camel Fair'] },
    { id: 15, name: 'Ranthambore', state: 'Rajasthan', tagline: 'Tiger Territory', rating: 4.6, image: DEST_IMAGES.ranthambore, category: 'Nature', bestTime: 'Oct – Jun', budget: '₹15k – ₹30k', duration: '2–3 days', highlights: ['Tiger Safari', 'Ranthambore Fort', 'Wildlife Photography'] },

    // ── Himalayan Region ─────────────────────────────────────────
    { id: 16, name: 'Manali', state: 'Himachal Pradesh', tagline: 'Valley of the Gods', rating: 4.7, image: DEST_IMAGES.manali, category: 'Mountain', bestTime: 'Oct – Jun', budget: '₹10k – ₹25k', duration: '4–6 days', highlights: ['Rohtang Pass', 'Old Manali', 'Solang Valley'] },
    { id: 17, name: 'Shimla', state: 'Himachal Pradesh', tagline: 'Queen of Hills', rating: 4.5, image: DEST_IMAGES.shimla, category: 'Mountain', bestTime: 'Mar – Jun', budget: '₹10k – ₹22k', duration: '3–4 days', highlights: ['Mall Road', 'Jakhu Temple', 'Kufri'] },
    { id: 18, name: 'Dharamshala', state: 'Himachal Pradesh', tagline: 'Little Lhasa', rating: 4.7, image: DEST_IMAGES.dharamshala, category: 'Spiritual', bestTime: 'Mar – Jun', budget: '₹8k – ₹18k', duration: '3–4 days', highlights: ['McLeodGanj', 'Dalai Lama Temple', 'Triund Trek'] },
    { id: 19, name: 'Rishikesh', state: 'Uttarakhand', tagline: 'Yoga Capital', rating: 4.5, image: DEST_IMAGES.rishikesh, category: 'Adventure', bestTime: 'Sep – Apr', budget: '₹8k – ₹20k', duration: '3–4 days', highlights: ['River Rafting', 'Bungee Jump', 'Lakshman Jhula'] },
    { id: 20, name: 'Mussoorie', state: 'Uttarakhand', tagline: 'Queen of Hills', rating: 4.4, image: DEST_IMAGES.mussoorie, category: 'Mountain', bestTime: 'Mar – Jun', budget: '₹8k – ₹18k', duration: '2–3 days', highlights: ['Kempty Falls', 'Gun Hill', 'Camel\'s Back Road'] },
    { id: 21, name: 'Nainital', state: 'Uttarakhand', tagline: 'Lake District', rating: 4.5, image: DEST_IMAGES.nainital, category: 'Mountain', bestTime: 'Mar – Jun', budget: '₹8k – ₹18k', duration: '3 days', highlights: ['Naini Lake', 'Snow View', 'Naina Devi Temple'] },
    { id: 22, name: 'Haridwar', state: 'Uttarakhand', tagline: 'Gateway to Gods', rating: 4.6, image: DEST_IMAGES.haridwar, category: 'Spiritual', bestTime: 'Sep – Apr', budget: '₹5k – ₹12k', duration: '2 days', highlights: ['Har Ki Pauri Aarti', 'Mansa Devi', 'Chandi Devi'] },
    { id: 23, name: 'Kasol', state: 'Himachal Pradesh', tagline: 'Mini Israel', rating: 4.4, image: DEST_IMAGES.kasol, category: 'Adventure', bestTime: 'Mar – Jun', budget: '₹6k – ₹15k', duration: '3–4 days', highlights: ['Kheerganga Trek', 'Manikaran', 'Riverside Cafes'] },
    { id: 24, name: 'Chopta', state: 'Uttarakhand', tagline: 'Mini Switzerland', rating: 4.6, image: DEST_IMAGES.chopta, category: 'Adventure', bestTime: 'Mar – May', budget: '₹5k – ₹12k', duration: '3 days', highlights: ['Tungnath Trek', 'Chandrashila Peak', 'Deoria Tal'] },
    { id: 25, name: 'Auli', state: 'Uttarakhand', tagline: 'Skiing Paradise', rating: 4.5, image: DEST_IMAGES.auli, category: 'Adventure', bestTime: 'Nov – Mar', budget: '₹8k – ₹20k', duration: '3 days', highlights: ['Skiing', 'Gorson Bugyal', 'Cable Car'] },

    // ── Kashmir & Ladakh ─────────────────────────────────────────
    { id: 26, name: 'Srinagar', state: 'Jammu & Kashmir', tagline: 'Paradise on Earth', rating: 4.8, image: DEST_IMAGES.srinagar, category: 'Nature', bestTime: 'Mar – Oct', budget: '₹15k – ₹35k', duration: '4–5 days', highlights: ['Dal Lake Shikara', 'Mughal Gardens', 'Shankaracharya Temple'] },
    { id: 27, name: 'Gulmarg', state: 'Jammu & Kashmir', tagline: 'Meadow of Flowers', rating: 4.7, image: DEST_IMAGES.gulmarg, category: 'Adventure', bestTime: 'Dec – Mar', budget: '₹12k – ₹30k', duration: '3 days', highlights: ['Gondola Ride', 'Skiing', 'Alpather Lake'] },
    { id: 28, name: 'Ladakh', state: 'Ladakh', tagline: 'Land of High Passes', rating: 4.9, image: DEST_IMAGES.ladakh, category: 'Adventure', bestTime: 'Jun – Sep', budget: '₹25k – ₹50k', duration: '7–10 days', highlights: ['Pangong Lake', 'Khardung La', 'Nubra Valley'] },
    { id: 29, name: 'Pahalgam', state: 'Jammu & Kashmir', tagline: 'Valley of Shepherds', rating: 4.6, image: DEST_IMAGES.pahalgam, category: 'Nature', bestTime: 'Mar – Oct', budget: '₹12k – ₹25k', duration: '3 days', highlights: ['Betaab Valley', 'Aru Valley', 'Lidder River'] },

    // ── South India ──────────────────────────────────────────────
    { id: 30, name: 'Kerala Backwaters', state: 'Kerala', tagline: 'Venice of the East', rating: 4.9, image: DEST_IMAGES.kerala, category: 'Nature', bestTime: 'Sep – Mar', budget: '₹20k – ₹35k', duration: '4–5 days', highlights: ['Houseboat Cruise', 'Munnar', 'Thekkady'] },
    { id: 31, name: 'Mysuru', state: 'Karnataka', tagline: 'Palace City', rating: 4.6, image: DEST_IMAGES.mysuru, category: 'Heritage', bestTime: 'Oct – Feb', budget: '₹8k – ₹18k', duration: '2–3 days', highlights: ['Mysore Palace', 'Chamundi Hills', 'Brindavan Gardens'] },
    { id: 32, name: 'Hampi', state: 'Karnataka', tagline: 'Boulder Kingdom', rating: 4.7, image: DEST_IMAGES.hampi, category: 'Heritage', bestTime: 'Oct – Feb', budget: '₹5k – ₹12k', duration: '2–3 days', highlights: ['Virupaksha Temple', 'Matanga Hill', 'Lotus Mahal'] },
    { id: 33, name: 'Pondicherry', state: 'Tamil Nadu', tagline: 'French Riviera of East', rating: 4.5, image: DEST_IMAGES.pondicherry, category: 'Beach', bestTime: 'Oct – Mar', budget: '₹8k – ₹20k', duration: '3 days', highlights: ['French Quarter', 'Auroville', 'Rock Beach'] },
    { id: 34, name: 'Ooty', state: 'Tamil Nadu', tagline: 'Queen of Nilgiris', rating: 4.4, image: DEST_IMAGES.ooty, category: 'Mountain', bestTime: 'Oct – Jun', budget: '₹8k – ₹18k', duration: '3 days', highlights: ['Botanical Garden', 'Toy Train', 'Doddabetta Peak'] },
    { id: 35, name: 'Kodaikanal', state: 'Tamil Nadu', tagline: 'Princess of Hills', rating: 4.5, image: DEST_IMAGES.kodaikanal, category: 'Mountain', bestTime: 'Oct – Jun', budget: '₹8k – ₹18k', duration: '3 days', highlights: ['Kodai Lake', 'Pillar Rocks', 'Coaker\'s Walk'] },
    { id: 36, name: 'Coorg', state: 'Karnataka', tagline: 'Scotland of India', rating: 4.6, image: DEST_IMAGES.coorg, category: 'Nature', bestTime: 'Oct – Mar', budget: '₹10k – ₹22k', duration: '3 days', highlights: ['Coffee Plantations', 'Abbey Falls', 'Dubare Elephant Camp'] },
    { id: 37, name: 'Madurai', state: 'Tamil Nadu', tagline: 'Temple City', rating: 4.6, image: DEST_IMAGES.madurai, category: 'Spiritual', bestTime: 'Oct – Mar', budget: '₹6k – ₹15k', duration: '2 days', highlights: ['Meenakshi Temple', 'Thirumalai Nayak Palace', 'Night Market'] },
    { id: 38, name: 'Hyderabad', state: 'Telangana', tagline: 'City of Pearls', rating: 4.5, image: DEST_IMAGES.hyderabad, category: 'Heritage', bestTime: 'Oct – Mar', budget: '₹10k – ₹22k', duration: '3 days', highlights: ['Charminar', 'Golconda Fort', 'Dum Biryani'] },
    { id: 39, name: 'Chennai', state: 'Tamil Nadu', tagline: 'Gateway to South', rating: 4.3, image: DEST_IMAGES.chennai, category: 'Heritage', bestTime: 'Nov – Feb', budget: '₹8k – ₹18k', duration: '3 days', highlights: ['Kapaleeshwarar Temple', 'Marina Beach', 'Mahabalipuram'] },
    { id: 40, name: 'Rameshwaram', state: 'Tamil Nadu', tagline: 'Char Dham of South', rating: 4.7, image: DEST_IMAGES.rameshwaram, category: 'Spiritual', bestTime: 'Oct – Apr', budget: '₹6k – ₹15k', duration: '2 days', highlights: ['Ramanathaswamy Temple', 'Pamban Bridge', 'Dhanushkodi'] },
    { id: 41, name: 'Kanyakumari', state: 'Tamil Nadu', tagline: 'Land\'s End', rating: 4.5, image: DEST_IMAGES.kanyakumari, category: 'Spiritual', bestTime: 'Oct – Mar', budget: '₹6k – ₹15k', duration: '2 days', highlights: ['Vivekananda Rock', 'Sunrise & Sunset', 'Thiruvalluvar Statue'] },

    // ── West India ────────────────────────────────────────────────
    { id: 42, name: 'Goa', state: 'Goa', tagline: 'Beach Paradise', rating: 4.6, image: DEST_IMAGES.goa, category: 'Beach', bestTime: 'Nov – Feb', budget: '₹12k – ₹30k', duration: '3–5 days', highlights: ['Baga Beach', 'Old Goa', 'Dudhsagar Falls'] },
    { id: 43, name: 'Mumbai', state: 'Maharashtra', tagline: 'City of Dreams', rating: 4.5, image: DEST_IMAGES.mumbai, category: 'Heritage', bestTime: 'Nov – Feb', budget: '₹12k – ₹30k', duration: '3–4 days', highlights: ['Gateway of India', 'Marine Drive', 'Elephanta Caves'] },
    { id: 44, name: 'Lonavala', state: 'Maharashtra', tagline: 'Jewel of Sahyadri', rating: 4.3, image: DEST_IMAGES.lonavala, category: 'Nature', bestTime: 'Jun – Sep', budget: '₹5k – ₹12k', duration: '2 days', highlights: ['Tiger\'s Leap', 'Bhushi Dam', 'Karla Caves'] },
    { id: 45, name: 'Ajanta-Ellora', state: 'Maharashtra', tagline: 'Cave Masterpieces', rating: 4.8, image: DEST_IMAGES.ajanta, category: 'Heritage', bestTime: 'Oct – Mar', budget: '₹8k – ₹15k', duration: '2–3 days', highlights: ['Ajanta Caves', 'Ellora Caves', 'Kailasa Temple'] },
    { id: 46, name: 'Dwarka', state: 'Gujarat', tagline: 'Kingdom of Krishna', rating: 4.6, image: DEST_IMAGES.dwarka, category: 'Spiritual', bestTime: 'Oct – Mar', budget: '₹6k – ₹15k', duration: '2 days', highlights: ['Dwarkadhish Temple', 'Bet Dwarka', 'Nageshwar Jyotirlinga'] },
    { id: 47, name: 'Kutch', state: 'Gujarat', tagline: 'White Desert', rating: 4.7, image: DEST_IMAGES.kutch, category: 'Adventure', bestTime: 'Nov – Feb', budget: '₹10k – ₹22k', duration: '3–4 days', highlights: ['Rann Utsav', 'White Rann', 'Kutch Museum'] },

    // ── East India ────────────────────────────────────────────────
    { id: 48, name: 'Kolkata', state: 'West Bengal', tagline: 'City of Joy', rating: 4.5, image: DEST_IMAGES.kolkata, category: 'Heritage', bestTime: 'Oct – Mar', budget: '₹8k – ₹18k', duration: '3–4 days', highlights: ['Victoria Memorial', 'Howrah Bridge', 'Park Street'] },
    { id: 49, name: 'Darjeeling', state: 'West Bengal', tagline: 'Queen of Hills', rating: 4.5, image: DEST_IMAGES.darjeeling, category: 'Mountain', bestTime: 'Mar – May', budget: '₹10k – ₹22k', duration: '3–4 days', highlights: ['Tiger Hill', 'Toy Train', 'Tea Gardens'] },
    { id: 50, name: 'Gangtok', state: 'Sikkim', tagline: 'Land of Monasteries', rating: 4.6, image: DEST_IMAGES.gangtok, category: 'Mountain', bestTime: 'Mar – May', budget: '₹12k – ₹25k', duration: '4–5 days', highlights: ['Tsomgo Lake', 'Nathula Pass', 'Rumtek Monastery'] },
    { id: 51, name: 'Puri', state: 'Odisha', tagline: 'Abode of Lord Jagannath', rating: 4.6, image: DEST_IMAGES.puri, category: 'Spiritual', bestTime: 'Oct – Mar', budget: '₹6k – ₹15k', duration: '2–3 days', highlights: ['Jagannath Temple', 'Puri Beach', 'Konark Sun Temple'] },
    { id: 52, name: 'Bodh Gaya', state: 'Bihar', tagline: 'Seat of Enlightenment', rating: 4.7, image: DEST_IMAGES.bodhgaya, category: 'Spiritual', bestTime: 'Oct – Mar', budget: '₹5k – ₹12k', duration: '2 days', highlights: ['Mahabodhi Temple', 'Bodhi Tree', 'Great Buddha Statue'] },

    // ── Northeast India ──────────────────────────────────────────
    { id: 53, name: 'Shillong', state: 'Meghalaya', tagline: 'Scotland of East', rating: 4.5, image: DEST_IMAGES.shillong, category: 'Nature', bestTime: 'Sep – May', budget: '₹10k – ₹22k', duration: '3–4 days', highlights: ['Living Root Bridges', 'Elephant Falls', 'Ward\'s Lake'] },
    { id: 54, name: 'Kaziranga', state: 'Assam', tagline: 'Rhino Country', rating: 4.7, image: DEST_IMAGES.kaziranga, category: 'Nature', bestTime: 'Nov – Apr', budget: '₹12k – ₹25k', duration: '3 days', highlights: ['Rhino Safari', 'Elephant Ride', 'Bird Watching'] },
    { id: 55, name: 'Tawang', state: 'Arunachal Pradesh', tagline: 'Monastery in Clouds', rating: 4.8, image: DEST_IMAGES.tawang, category: 'Adventure', bestTime: 'Mar – Oct', budget: '₹15k – ₹30k', duration: '5–6 days', highlights: ['Tawang Monastery', 'Sela Pass', 'Madhuri Lake'] },

    // ── Central India ────────────────────────────────────────────
    { id: 56, name: 'Khajuraho', state: 'Madhya Pradesh', tagline: 'Temple of Love', rating: 4.7, image: DEST_IMAGES.khajuraho, category: 'Heritage', bestTime: 'Oct – Mar', budget: '₹6k – ₹15k', duration: '2 days', highlights: ['Western Temples', 'Light & Sound Show', 'Panna National Park'] },
    { id: 57, name: 'Ujjain', state: 'Madhya Pradesh', tagline: 'City of Mahakal', rating: 4.6, image: DEST_IMAGES.ujjain, category: 'Spiritual', bestTime: 'Oct – Mar', budget: '₹5k – ₹12k', duration: '2 days', highlights: ['Mahakaleshwar Temple', 'Kal Bhairav', 'Ram Ghat'] },

    // ── Islands ──────────────────────────────────────────────────
    { id: 58, name: 'Andaman Islands', state: 'Andaman & Nicobar', tagline: 'Tropical Paradise', rating: 4.8, image: DEST_IMAGES.andaman, category: 'Beach', bestTime: 'Oct – May', budget: '₹30k – ₹60k', duration: '5–7 days', highlights: ['Radhanagar Beach', 'Scuba Diving', 'Cellular Jail'] },
    { id: 59, name: 'Lakshadweep', state: 'Lakshadweep', tagline: 'Coral Islands', rating: 4.8, image: DEST_IMAGES.lakshadweep, category: 'Beach', bestTime: 'Oct – May', budget: '₹25k – ₹50k', duration: '4–5 days', highlights: ['Agatti Island', 'Bangaram Atoll', 'Glass Bottom Boats'] },

    // ── Pilgrimages ──────────────────────────────────────────────
    { id: 60, name: 'Tirupati', state: 'Andhra Pradesh', tagline: 'Abode of Lord Venkateswara', rating: 4.8, image: DEST_IMAGES.tirupati, category: 'Spiritual', bestTime: 'Sep – Mar', budget: '₹5k – ₹12k', duration: '2 days', highlights: ['Tirumala Temple', 'Talakona Waterfalls', 'Sri Kapileswara Swamy Temple'] },
    { id: 61, name: 'Shirdi', state: 'Maharashtra', tagline: 'Land of Sai Baba', rating: 4.6, image: DEST_IMAGES.shirdi, category: 'Spiritual', bestTime: 'Oct – Mar', budget: '₹4k – ₹10k', duration: '2 days', highlights: ['Sai Baba Temple', 'Shani Shingnapur', 'Dwarkamai'] },
    { id: 62, name: 'Somnath', state: 'Gujarat', tagline: 'Eternal Shrine', rating: 4.7, image: DEST_IMAGES.somnath, category: 'Spiritual', bestTime: 'Oct – Mar', budget: '₹5k – ₹12k', duration: '2 days', highlights: ['Somnath Temple', 'Triveni Sangam', 'Light & Sound Show'] },
];

export const HIDDEN_GEMS = [
    { name: 'Spiti Valley', state: 'Himachal Pradesh', desc: 'Moonscape desert in the Himalayas. 1000-year-old monasteries perched on cliffs, frozen lakes, and some of the highest villages in the world.', image: DEST_IMAGES.spiti, crowdLevel: 'Very Low', bestSeason: 'Jun – Sep', difficulty: 'Moderate' },
    { name: 'Majuli Island', state: 'Assam', desc: "World's largest river island shrinking each year. A living center of neo-Vaishnavite culture with mask-making monks and satras.", image: DEST_IMAGES.majuli, crowdLevel: 'Low', bestSeason: 'Oct – Mar', difficulty: 'Easy' },
    { name: 'Gokarna', state: 'Karnataka', desc: "Sacred temple town meets pristine coastline. Trek between hidden beaches that Goa hasn't discovered yet.", image: DEST_IMAGES.gokarna, crowdLevel: 'Low', bestSeason: 'Oct – Mar', difficulty: 'Easy' },
    { name: 'Chettinad', state: 'Tamil Nadu', desc: 'Palatial mansions built by merchant princes, the spiciest cuisine in India, and villages frozen in the 19th century.', image: FALLBACK_IMAGES.heritage, crowdLevel: 'Very Low', bestSeason: 'Nov – Mar', difficulty: 'Easy' },
    { name: 'Ziro Valley', state: 'Arunachal Pradesh', desc: 'UNESCO World Heritage site. Emerald rice paddies, Apatani tribal nose plugs, and the wildest music festival in India.', image: DEST_IMAGES.ziro, crowdLevel: 'Very Low', bestSeason: 'Mar – Oct', difficulty: 'Easy' },
    { name: 'Mandu', state: 'Madhya Pradesh', desc: 'A forgotten ruined city of romance. Afghan architecture draped in monsoon green, with legends of love carved in every arch.', image: DEST_IMAGES.mandu, crowdLevel: 'Low', bestSeason: 'Jul – Mar', difficulty: 'Easy' },
    { name: 'Orchha', state: 'Madhya Pradesh', desc: 'Time-frozen Bundela capital with cenotaphs, palaces, and the only Ram temple where he is worshipped as king.', image: DEST_IMAGES.orchha, crowdLevel: 'Low', bestSeason: 'Oct – Mar', difficulty: 'Easy' },
    { name: 'Dhanushkodi', state: 'Tamil Nadu', desc: 'Ghost town at the tip of Rameshwaram. Where the Bay of Bengal and Indian Ocean meet — mythological bridge to Sri Lanka.', image: DEST_IMAGES.rameshwaram, crowdLevel: 'Low', bestSeason: 'Oct – Mar', difficulty: 'Easy' },
    { name: 'Sandakphu', state: 'West Bengal', desc: 'The only place in India where you see Everest, Kanchenjunga, Lhotse, and Makalu together. Highest peak in West Bengal.', image: DEST_IMAGES.darjeeling, crowdLevel: 'Low', bestSeason: 'Oct – Dec', difficulty: 'Moderate' },
    { name: 'Mawlynnong', state: 'Meghalaya', desc: 'Asia\'s cleanest village. Living root bridges, crystal streams, and a sky walk over the Bangladesh plains.', image: DEST_IMAGES.shillong, crowdLevel: 'Low', bestSeason: 'Oct – May', difficulty: 'Easy' },
];

export const CUISINES = [
    { 
        region: 'South India', 
        dishes: [
            { name: 'Hyderabadi Biryani', city: 'Hyderabad', note: 'Dum-cooked basmati layered with saffron-spiced meat — the Nizam\'s kitchen legacy since the 1600s.' },
            { name: 'Dosa & Sambar', city: 'Chennai', note: 'Crispy fermented rice crepe with tangy lentil stew — a 2,000-year-old Dravidian staple.' },
            { name: 'Chettinad Chicken', city: 'Karaikudi', note: 'Fiery pepper-and-star-anise gravy from Tamil Nadu\'s merchant princes, traded spice routes shaped this cuisine.' },
            { name: 'Appam & Stew', city: 'Kochi', note: 'Lacy coconut rice pancake with mild curry — a Syrian-Christian specialty blending Kerala and Portuguese flavors.' }
        ], 
        icon: '🫕', gradient: 'from-orange-500 via-red-500 to-rose-600', 
        image: DEST_IMAGES.hyderabad, states: 'Tamil Nadu, Kerala, Karnataka, Telangana' 
    },
    { 
        region: 'North India', 
        dishes: [
            { name: 'Butter Chicken', city: 'Delhi', note: 'Creamy tomato-cashew gravy with tandoori chicken — invented at Moti Mahal, Old Delhi, in 1947.' },
            { name: 'Chole Bhature', city: 'Delhi', note: 'Spiced chickpeas with puffed fried bread — Punjabi migrants made this Delhi\'s unofficial breakfast.' },
            { name: 'Lucknowi Galouti Kebab', city: 'Lucknow', note: 'Melt-on-tongue minced meat patty — created for a toothless Nawab in the 18th century.' },
            { name: 'Rogan Josh', city: 'Srinagar', note: 'Slow-braised lamb in Kashmiri red chili — a Wazwan feast centerpiece from Mughal courts.' }
        ], 
        icon: '🍛', gradient: 'from-amber-500 via-orange-500 to-red-500', 
        image: DEST_IMAGES.delhi, states: 'Punjab, Delhi, Uttar Pradesh, Kashmir' 
    },
    { 
        region: 'West India', 
        dishes: [
            { name: 'Pav Bhaji', city: 'Mumbai', note: 'Buttery mashed vegetable curry with soft bread — born on Mumbai\'s textile mill floors in the 1850s.' },
            { name: 'Dal Baati Churma', city: 'Jaipur', note: 'Baked wheat balls with lentils and sweet crumble — Rajasthan\'s desert warriors\' portable feast.' },
            { name: 'Goan Vindaloo', city: 'Goa', note: 'Tangy, fiery pork in vinegar-garlic paste — Portuguese "carne de vinha d\'alhos" reimagined with Indian spices.' },
            { name: 'Dabeli', city: 'Kutch', note: 'Sweet-spicy potato slider with pomegranate — a Gujarati street food gem from the Kutch region.' }
        ], 
        icon: '🌶️', gradient: 'from-red-500 via-pink-500 to-fuchsia-500', 
        image: DEST_IMAGES.mumbai, states: 'Maharashtra, Rajasthan, Gujarat, Goa' 
    },
    { 
        region: 'East India', 
        dishes: [
            { name: 'Macher Jhol', city: 'Kolkata', note: 'Mustard-spiced fish curry in light broth — Bengal\'s daily comfort food, inseparable from river culture.' },
            { name: 'Momos', city: 'Gangtok', note: 'Steamed Himalayan dumplings with fiery chutney — Tibetan refugees brought this to Sikkim in the 1960s.' },
            { name: 'Litti Chokha', city: 'Patna', note: 'Roasted wheat balls stuffed with sattu, with smoky vegetable mash — Bihar\'s ancient warrior fuel.' },
            { name: 'Bamboo Shoot Curry', city: 'Shillong', note: 'Fermented bamboo in pork gravy — Northeast tribal specialty using centuries-old preservation techniques.' }
        ], 
        icon: '🥘', gradient: 'from-emerald-500 via-teal-500 to-cyan-500', 
        image: DEST_IMAGES.kolkata, states: 'Bengal, Sikkim, Bihar, Meghalaya' 
    },
    { 
        region: 'Street Food Trail', 
        dishes: [
            { name: 'Pani Puri', city: 'Mumbai', note: 'Crispy shell filled with spiced water explosion — every Indian city has its own version, debates are fierce.' },
            { name: 'Vada Pav', city: 'Mumbai', note: 'Mumbai\'s ₹20 spicy potato burger in a bun — Ashok Vada Pav started the revolution in 1966.' },
            { name: 'Kathi Roll', city: 'Kolkata', note: 'Paratha-wrapped kebab on the go — Nizam\'s restaurant, Kolkata, invented it for British officers in 1932.' },
            { name: 'Jalebi-Fafda', city: 'Ahmedabad', note: 'Spiral-fried sweet with savory chickpea strips — Gujarat\'s Sunday morning ritual for centuries.' }
        ], 
        icon: '🍢', gradient: 'from-violet-500 via-purple-500 to-indigo-500', 
        image: DEST_IMAGES.varanasi, states: 'Mumbai, Delhi, Kolkata, Ahmedabad' 
    },
];

export const TRENDING = [
    { name: 'Coorg', tag: 'Coffee Country', state: 'Karnataka', image: DEST_IMAGES.coorg, travelers: '2.4k this week' },
    { name: 'Bir Billing', tag: 'Paragliding Capital', state: 'Himachal', image: DEST_IMAGES.birBilling, travelers: '1.8k this week' },
    { name: 'Chopta', tag: 'Mini Switzerland', state: 'Uttarakhand', image: DEST_IMAGES.chopta, travelers: '980 this week' },
    { name: 'Pondicherry', tag: 'French Riviera of East', state: 'Tamil Nadu', image: DEST_IMAGES.pondicherry, travelers: '3.1k this week' },
    { name: 'Kasol', tag: 'Backpacker Paradise', state: 'Himachal', image: DEST_IMAGES.kasol, travelers: '1.5k this week' },
    { name: 'Lakshadweep', tag: 'India\'s Maldives', state: 'Lakshadweep', image: DEST_IMAGES.lakshadweep, travelers: '2.2k this week' },
];

export const SEASONAL = [
    { name: 'Valley of Flowers', season: 'Jul – Sep', image: FALLBACK_IMAGES.nature, note: 'UNESCO Heritage — 600+ flower species bloom only 3 months a year', bestFor: 'Trekkers & Nature photographers' },
    { name: 'Rann of Kutch', season: 'Nov – Feb', image: DEST_IMAGES.kutch, note: 'Infinite white salt desert under full moon. Rann Utsav cultural festival.', bestFor: 'Culture seekers & photographers' },
    { name: 'Cherrapunji', season: 'Oct – Mar', image: DEST_IMAGES.cherrapunji, note: 'Living root bridges grown over centuries. The wettest place on Earth, surreally green.', bestFor: 'Adventure trekkers' },
    { name: 'Gulmarg Skiing', season: 'Dec – Mar', image: DEST_IMAGES.gulmarg, note: 'World\'s highest gondola and powder snow slopes rivaling the Alps.', bestFor: 'Skiing & snowboarding enthusiasts' },
    { name: 'Jaisalmer Desert Festival', season: 'Feb', image: DEST_IMAGES.jaisalmer, note: 'Camel races, folk music, fire dancers under the desert stars.', bestFor: 'Cultural explorers' },
];

export const CATEGORIES = ['All', 'Heritage', 'Nature', 'Beach', 'Mountain', 'Adventure', 'Spiritual'];

// Bento cell layout classes for destination grid — cycles for 62 destinations
export const BENTO_DEST: string[] = [
    'col-span-2 row-span-2', // 0: hero card — large
    'col-span-1 row-span-1', // 1
    'col-span-1 row-span-1', // 2
    'col-span-1 row-span-2', // 3: tall
    'col-span-1 row-span-1', // 4
    'col-span-1 row-span-1', // 5
    'col-span-2 row-span-1', // 6: wide
    'col-span-1 row-span-1', // 7
    'col-span-1 row-span-2', // 8: tall
    'col-span-1 row-span-1', // 9
    'col-span-1 row-span-1', // 10
    'col-span-1 row-span-1', // 11
];

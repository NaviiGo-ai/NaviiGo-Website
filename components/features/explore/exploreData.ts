export type Destination = {
    id: number; name: string; state: string; tagline: string; rating: number;
    image: string; category: string; bestTime: string; budget: string; duration: string;
    highlights: string[];
};

export const ALL_DESTINATIONS: Destination[] = [
    { id: 1, name: 'Jaipur', state: 'Rajasthan', tagline: 'The Pink City', rating: 4.8, image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80', category: 'Heritage', bestTime: 'Oct – Mar', budget: '₹15k – ₹25k', duration: '3–4 days', highlights: ['Hawa Mahal', 'Amber Fort', 'City Palace'] },
    { id: 2, name: 'Kerala Backwaters', state: 'Kerala', tagline: 'Venice of the East', rating: 4.9, image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80', category: 'Nature', bestTime: 'Sep – Mar', budget: '₹20k – ₹35k', duration: '4–5 days', highlights: ['Houseboat Cruise', 'Munnar', 'Thekkady'] },
    { id: 3, name: 'Varanasi', state: 'Uttar Pradesh', tagline: 'City of Light', rating: 4.7, image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80', category: 'Spiritual', bestTime: 'Nov – Feb', budget: '₹8k – ₹15k', duration: '2–3 days', highlights: ['Ganga Aarti', 'Sarnath', 'Boat Ride'] },
    { id: 4, name: 'Goa', state: 'Goa', tagline: 'Beach Paradise', rating: 4.6, image: 'https://images.unsplash.com/photo-1614082242765-7c98ca0f3df3?auto=format&fit=crop&w=800&q=80', category: 'Beach', bestTime: 'Nov – Feb', budget: '₹12k – ₹30k', duration: '3–5 days', highlights: ['Baga Beach', 'Old Goa', 'Dudhsagar Falls'] },
    { id: 5, name: 'Manali', state: 'Himachal Pradesh', tagline: 'Valley of the Gods', rating: 4.7, image: 'https://images.unsplash.com/photo-1585136917120-62f9a3900e88?auto=format&fit=crop&w=800&q=80', category: 'Mountain', bestTime: 'Oct – Jun', budget: '₹10k – ₹25k', duration: '4–6 days', highlights: ['Rohtang Pass', 'Old Manali', 'Solang Valley'] },
    { id: 6, name: 'Udaipur', state: 'Rajasthan', tagline: 'City of Lakes', rating: 4.9, image: 'https://images.unsplash.com/photo-1568495248636-6432b97bd949?auto=format&fit=crop&w=800&q=80', category: 'Heritage', bestTime: 'Sep – Mar', budget: '₹15k – ₹30k', duration: '3–4 days', highlights: ['Lake Pichola', 'City Palace', 'Jag Mandir'] },
    { id: 7, name: 'Rishikesh', state: 'Uttarakhand', tagline: 'Yoga Capital', rating: 4.5, image: 'https://images.unsplash.com/photo-1588083949404-c4f1ed1323b3?auto=format&fit=crop&w=800&q=80', category: 'Adventure', bestTime: 'Sep – Apr', budget: '₹8k – ₹20k', duration: '3–4 days', highlights: ['River Rafting', 'Bungee Jump', 'Lakshman Jhula'] },
    { id: 8, name: 'Mysuru', state: 'Karnataka', tagline: 'Palace City', rating: 4.6, image: 'https://images.unsplash.com/photo-1580581096469-8afb65cd5cec?auto=format&fit=crop&w=800&q=80', category: 'Heritage', bestTime: 'Oct – Feb', budget: '₹8k – ₹18k', duration: '2–3 days', highlights: ['Mysore Palace', 'Chamundi Hills', 'Brindavan Gardens'] },
    { id: 9, name: 'Ladakh', state: 'Ladakh', tagline: 'Land of High Passes', rating: 4.9, image: 'https://images.unsplash.com/photo-1626015365107-aa10a7a4791f?auto=format&fit=crop&w=800&q=80', category: 'Adventure', bestTime: 'Jun – Sep', budget: '₹25k – ₹50k', duration: '7–10 days', highlights: ['Pangong Lake', 'Khardung La', 'Nubra Valley'] },
    { id: 10, name: 'Hampi', state: 'Karnataka', tagline: 'Boulder Kingdom', rating: 4.7, image: 'https://images.unsplash.com/photo-1590050751754-00e48ec44985?auto=format&fit=crop&w=800&q=80', category: 'Heritage', bestTime: 'Oct – Feb', budget: '₹5k – ₹12k', duration: '2–3 days', highlights: ['Virupaksha Temple', 'Matanga Hill', 'Lotus Mahal'] },
    { id: 11, name: 'Andaman Islands', state: 'Andaman & Nicobar', tagline: 'Tropical Paradise', rating: 4.8, image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80', category: 'Beach', bestTime: 'Oct – May', budget: '₹30k – ₹60k', duration: '5–7 days', highlights: ['Radhanagar Beach', 'Scuba Diving', 'Cellular Jail'] },
    { id: 12, name: 'Darjeeling', state: 'West Bengal', tagline: 'Queen of Hills', rating: 4.5, image: 'https://images.unsplash.com/photo-1622308644420-27fed4054ced?auto=format&fit=crop&w=800&q=80', category: 'Mountain', bestTime: 'Mar – May', budget: '₹10k – ₹22k', duration: '3–4 days', highlights: ['Tiger Hill', 'Toy Train', 'Tea Gardens'] },
];

export const HIDDEN_GEMS = [
    { name: 'Spiti Valley', state: 'Himachal Pradesh', desc: 'Moonscape desert in the Himalayas. 1000-year-old monasteries perched on cliffs, frozen lakes, and some of the highest villages in the world.', image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=600&q=80', crowdLevel: 'Very Low', bestSeason: 'Jun – Sep', difficulty: 'Moderate' },
    { name: 'Majuli Island', state: 'Assam', desc: "World's largest river island shrinking each year. A living center of neo-Vaishnavite culture with mask-making monks and satras.", image: 'https://images.unsplash.com/photo-1590050751754-00e48ec44985?auto=format&fit=crop&w=600&q=80', crowdLevel: 'Low', bestSeason: 'Oct – Mar', difficulty: 'Easy' },
    { name: 'Gokarna', state: 'Karnataka', desc: "Sacred temple town meets pristine coastline. Trek between hidden beaches that Goa hasn't discovered yet.", image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80', crowdLevel: 'Low', bestSeason: 'Oct – Mar', difficulty: 'Easy' },
    { name: 'Chettinad', state: 'Tamil Nadu', desc: 'Palatial mansions built by merchant princes, the spiciest cuisine in India, and villages frozen in the 19th century.', image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=600&q=80', crowdLevel: 'Very Low', bestSeason: 'Nov – Mar', difficulty: 'Easy' },
    { name: 'Ziro Valley', state: 'Arunachal Pradesh', desc: 'UNESCO World Heritage site. Emerald rice paddies, Apatani tribal nose plugs, and the wildest music festival in India.', image: 'https://images.unsplash.com/photo-1600008108978-6e43e3ef4ea0?auto=format&fit=crop&w=600&q=80', crowdLevel: 'Very Low', bestSeason: 'Mar – Oct', difficulty: 'Easy' },
    { name: 'Mandu', state: 'Madhya Pradesh', desc: 'A forgotten ruined city of romance. Afghan architecture draped in monsoon green, with legends of love carved in every arch.', image: 'https://images.unsplash.com/photo-1599661502283-a44ea24dfc74?auto=format&fit=crop&w=600&q=80', crowdLevel: 'Low', bestSeason: 'Jul – Mar', difficulty: 'Easy' },
];

export const CUISINES = [
    { region: 'South India', dishes: [{ name: 'Dosa & Sambar', note: 'Crispy fermented crepe with lentil stew' }, { name: 'Hyderabadi Biryani', note: 'Dum-cooked layers of basmati and spiced meat' }, { name: 'Chettinad Chicken', note: 'Fiery pepper-based gravy' }, { name: 'Appam & Stew', note: 'Lacy rice pancake with coconut curry' }], icon: '🫕', gradient: 'from-orange-500 via-red-500 to-rose-600', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80', states: 'Tamil Nadu, Kerala, Karnataka, AP' },
    { region: 'North India', dishes: [{ name: 'Butter Chicken', note: 'Creamy tomato gravy, smoky tandoori chicken' }, { name: 'Chole Bhature', note: 'Spiced chickpeas with fried bread' }, { name: 'Rogan Josh', note: 'Kashmiri slow-cooked lamb' }, { name: 'Lucknowi Kebab', note: 'Melt-in-mouth galouti and seekh' }], icon: '🍛', gradient: 'from-amber-500 via-orange-500 to-red-500', image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=600&q=80', states: 'Punjab, Delhi, UP, Kashmir' },
    { region: 'West India', dishes: [{ name: 'Pav Bhaji', note: "Mumbai's buttery street classic" }, { name: 'Dal Baati Churma', note: "Rajasthan's desert feast" }, { name: 'Goan Vindaloo', note: 'Portuguese-inspired spicy pork' }, { name: 'Dhokla', note: 'Steamed savory chickpea cake' }], icon: '🌶️', gradient: 'from-red-500 via-pink-500 to-fuchsia-500', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80', states: 'Maharashtra, Rajasthan, Gujarat, Goa' },
    { region: 'East India', dishes: [{ name: 'Macher Jhol', note: 'Bengali mustard fish curry' }, { name: 'Momos', note: 'Himalayan steamed dumplings' }, { name: 'Litti Chokha', note: "Bihar's roasted wheat balls" }, { name: 'Bamboo Shoot Curry', note: 'Northeast tribal specialty' }], icon: '🥘', gradient: 'from-emerald-500 via-teal-500 to-cyan-500', image: 'https://images.unsplash.com/photo-1567337710282-00832b415979?auto=format&fit=crop&w=600&q=80', states: 'Bengal, Sikkim, Bihar, Assam' },
    { region: 'Street Food Trail', dishes: [{ name: 'Pani Puri', note: 'Crispy shell, spiced water explosion' }, { name: 'Vada Pav', note: "Mumbai's ₹20 burger" }, { name: 'Kathi Roll', note: "Kolkata's stuffed paratha wrap" }, { name: 'Jalebi Fafda', note: "Ahmedabad's sweet-savory duo" }], icon: '🍢', gradient: 'from-violet-500 via-purple-500 to-indigo-500', image: 'https://images.unsplash.com/photo-1606491956689-2ea866880049?auto=format&fit=crop&w=600&q=80', states: 'Mumbai, Delhi, Kolkata, Ahmedabad' },
];

export const TRENDING = [
    { name: 'Coorg', tag: 'Coffee Country', state: 'Karnataka', image: 'https://images.unsplash.com/photo-1600100397608-e9b37e4ffa4e?auto=format&fit=crop&w=600&q=80', travelers: '2.4k this week' },
    { name: 'Bir Billing', tag: 'Paragliding Capital', state: 'Himachal', image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=600&q=80', travelers: '1.8k this week' },
    { name: 'Chopta', tag: 'Mini Switzerland', state: 'Uttarakhand', image: 'https://images.unsplash.com/photo-1566837945700-30057527ade0?auto=format&fit=crop&w=600&q=80', travelers: '980 this week' },
    { name: 'Pondicherry', tag: 'French Riviera of East', state: 'Tamil Nadu', image: 'https://images.unsplash.com/photo-1512343779784-a1d53b98b8ef?auto=format&fit=crop&w=600&q=80', travelers: '3.1k this week' },
];

export const SEASONAL = [
    { name: 'Valley of Flowers', season: 'Jul – Sep', image: 'https://images.unsplash.com/photo-1600008108978-6e43e3ef4ea0?auto=format&fit=crop&w=600&q=80', note: 'UNESCO Heritage — 600+ flower species bloom only 3 months a year', bestFor: 'Trekkers & Nature photographers' },
    { name: 'Rann of Kutch', season: 'Nov – Feb', image: 'https://images.unsplash.com/photo-1599661502283-a44ea24dfc74?auto=format&fit=crop&w=600&q=80', note: 'Infinite white salt desert under full moon. Rann Utsav cultural festival.', bestFor: 'Culture seekers & photographers' },
    { name: 'Cherrapunji', season: 'Oct – Mar', image: 'https://images.unsplash.com/photo-1590050751754-00e48ec44985?auto=format&fit=crop&w=600&q=80', note: 'Living root bridges grown over centuries. The wettest place on Earth, surreally green.', bestFor: 'Adventure trekkers' },
];

export const CATEGORIES = ['All', 'Heritage', 'Nature', 'Beach', 'Mountain', 'Adventure', 'Spiritual'];

// Bento cell layout classes for destination grid
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

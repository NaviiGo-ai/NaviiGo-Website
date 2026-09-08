// ─── Indian Festival Calendar ─────────────────────────────────────────────────
// Static data for major Indian festivals with travel impact analysis.
// Used to enhance itinerary generation with festival-aware recommendations.

export interface Festival {
    name: string;
    emoji: string;
    /** Month-day ranges: [startMonth, startDay, endMonth, endDay] */
    dates: [number, number, number, number][];
    locations: string[];        // cities/states where it's most celebrated
    description: string;
    travelImpact: {
        crowdMultiplier: number;  // 1.0 = normal, 2.0 = double crowds
        priceSurge: number;       // percentage increase in hotel/transport prices
        specialActivities: string[];
        warnings: string[];
    };
    category: 'religious' | 'cultural' | 'regional' | 'national';
}

export const FESTIVALS: Festival[] = [
    {
        name: 'Diwali',
        emoji: '🪔',
        dates: [[10, 15, 11, 15]], // ranges across Oct-Nov
        locations: ['Jaipur', 'Varanasi', 'Delhi', 'Udaipur', 'Amritsar', 'Ayodhya'],
        description: 'Festival of Lights — fireworks, diyas, rangoli, and sweets across India.',
        travelImpact: {
            crowdMultiplier: 2.5,
            priceSurge: 40,
            specialActivities: ['Lakshmi Puja at temples', 'Fireworks at ghats', 'Diwali Mela shopping', 'Illuminated forts & palaces'],
            warnings: ['Hotels book out 2-3 months in advance', 'Trains fully booked — book early', 'Air quality drops in North India'],
        },
        category: 'religious',
    },
    {
        name: 'Holi',
        emoji: '🎨',
        dates: [[3, 1, 3, 25]],
        locations: ['Mathura', 'Vrindavan', 'Jaipur', 'Delhi', 'Varanasi', 'Udaipur'],
        description: 'Festival of Colors — celebrate with colors, water balloons, bhang, and music.',
        travelImpact: {
            crowdMultiplier: 2.0,
            priceSurge: 30,
            specialActivities: ['Lathmar Holi in Barsana/Nandgaon', 'Widow Holi in Vrindavan', 'Royal Holi at City Palace Udaipur', 'Holika Dahan bonfire'],
            warnings: ['Wear old clothes', 'Streets can be chaotic — plan transport early', 'Some temples close during celebrations'],
        },
        category: 'religious',
    },
    {
        name: 'Durga Puja',
        emoji: '🙏',
        dates: [[9, 25, 10, 25]],
        locations: ['Kolkata', 'Darjeeling', 'Bhubaneswar', 'Puri'],
        description: 'Bengal\'s grandest festival — elaborate pandals, art, drumming, and cultural performances.',
        travelImpact: {
            crowdMultiplier: 3.0,
            priceSurge: 50,
            specialActivities: ['Pandal hopping', 'Sindur Khela', 'Cultural performances', 'Street food festivals', 'Dhunuchi Naach'],
            warnings: ['Kolkata hotels fully booked', 'Traffic jams — use metro', 'Book flights 2 months early'],
        },
        category: 'religious',
    },
    {
        name: 'Navratri & Garba',
        emoji: '💃',
        dates: [[9, 25, 10, 15]],
        locations: ['Ahmedabad', 'Vadodara', 'Mumbai', 'Jaipur', 'Delhi'],
        description: 'Nine nights of dance — Garba and Dandiya Raas celebrations across Gujarat.',
        travelImpact: {
            crowdMultiplier: 2.0,
            priceSurge: 35,
            specialActivities: ['Garba nights', 'Dandiya Raas', 'Fasting feast preparation', 'Temple decorations'],
            warnings: ['Gujarat hotels premium during this period', 'Late night celebrations — plan accordingly'],
        },
        category: 'religious',
    },
    {
        name: 'Ganesh Chaturthi',
        emoji: '🐘',
        dates: [[8, 20, 9, 15]],
        locations: ['Mumbai', 'Pune', 'Hyderabad'],
        description: 'Lord Ganesha celebration — grand pandals, processions, and Visarjan immersion.',
        travelImpact: {
            crowdMultiplier: 2.0,
            priceSurge: 25,
            specialActivities: ['Lalbaugcha Raja darshan', 'Visarjan procession', 'Pandal art installations', 'Modak tasting'],
            warnings: ['Mumbai traffic at peak', 'Visarjan day = road closures', 'Book accommodation early for Girgaon area'],
        },
        category: 'religious',
    },
    {
        name: 'Onam',
        emoji: '🌸',
        dates: [[8, 15, 9, 10]],
        locations: ['Kerala', 'Kochi', 'Munnar', 'Alleppey'],
        description: 'Kerala\'s harvest festival — boat races, Pookalam flower carpets, and Onam Sadya feast.',
        travelImpact: {
            crowdMultiplier: 1.8,
            priceSurge: 30,
            specialActivities: ['Vallam Kali boat races', 'Onam Sadya feast', 'Pookalam competitions', 'Kathakali performances'],
            warnings: ['Monsoon season — expect rain', 'Houseboat prices surge', 'Book 1 month early'],
        },
        category: 'regional',
    },
    {
        name: 'Pongal / Makar Sankranti',
        emoji: '☀️',
        dates: [[1, 13, 1, 16]],
        locations: ['Chennai', 'Madurai', 'Thanjavur', 'Jaipur', 'Ahmedabad'],
        description: 'Harvest festival — kite flying, Kolam art, Jallikattu bull-taming, and festive feasts.',
        travelImpact: {
            crowdMultiplier: 1.5,
            priceSurge: 15,
            specialActivities: ['Kite flying festival', 'Jallikattu (Tamil Nadu)', 'Sugarcane & rice feasts', 'Kolam/Rangoli art'],
            warnings: ['Jaipur International Kite Festival = big crowds', 'Tamil Nadu roads busy during Jallikattu'],
        },
        category: 'regional',
    },
    {
        name: 'Rath Yatra',
        emoji: '🛕',
        dates: [[6, 20, 7, 15]],
        locations: ['Puri', 'Ahmedabad'],
        description: 'Grand chariot procession of Lord Jagannath — one of India\'s most spectacular festivals.',
        travelImpact: {
            crowdMultiplier: 3.0,
            priceSurge: 60,
            specialActivities: ['Chariot pulling', 'Temple darshan', 'Mahaprasad feast', 'Cultural processions'],
            warnings: ['Puri becomes EXTREMELY crowded', 'Book hotels 3 months early', 'Streets closed for procession'],
        },
        category: 'religious',
    },
    {
        name: 'Pushkar Camel Fair',
        emoji: '🐪',
        dates: [[10, 25, 11, 10]],
        locations: ['Pushkar'],
        description: 'World\'s largest camel fair — camel trading, competitions, folk music, and desert vibes.',
        travelImpact: {
            crowdMultiplier: 2.5,
            priceSurge: 50,
            specialActivities: ['Camel beauty contest', 'Longest moustache competition', 'Hot air balloon ride', 'Desert campfire concert'],
            warnings: ['All Pushkar hotels fully booked', 'Camp stays are the way to go', 'Book months in advance'],
        },
        category: 'cultural',
    },
    {
        name: 'Republic Day',
        emoji: '🇮🇳',
        dates: [[1, 24, 1, 27]],
        locations: ['Delhi'],
        description: 'India\'s grand military parade on Rajpath (Kartavya Path) with fly-pasts and tableaux.',
        travelImpact: {
            crowdMultiplier: 2.0,
            priceSurge: 30,
            specialActivities: ['Republic Day Parade', 'Beating Retreat ceremony', 'Art exhibitions'],
            warnings: ['Heavy security — carry ID', 'Traffic diversions in Central Delhi', 'Seats must be booked via government portal'],
        },
        category: 'national',
    },
    {
        name: 'Christmas & New Year',
        emoji: '🎄',
        dates: [[12, 20, 1, 2]],
        locations: ['Goa', 'Pondicherry', 'Mumbai', 'Kolkata', 'Shimla', 'Manali'],
        description: 'Beach parties in Goa, colonial charm in Pondicherry, snow in the hills.',
        travelImpact: {
            crowdMultiplier: 2.5,
            priceSurge: 60,
            specialActivities: ['Goa beach parties', 'Christmas Mass at Old Goa churches', 'New Year fireworks', 'Snow activities in Himalayas'],
            warnings: ['Goa hotel prices 3x normal', 'Flights at premium', 'Book 2-3 months early'],
        },
        category: 'cultural',
    },
    {
        name: 'Kumbh Mela',
        emoji: '🙏',
        dates: [[1, 10, 2, 28]],
        locations: ['Prayagraj', 'Haridwar', 'Ujjain', 'Nashik'],
        description: 'World\'s largest religious gathering — millions bathe at the sacred Sangam.',
        travelImpact: {
            crowdMultiplier: 5.0,
            priceSurge: 80,
            specialActivities: ['Sacred Sangam bath', 'Naga Sadhu processions', 'Spiritual discourses', 'Cultural programs'],
            warnings: ['Extreme crowds — plan carefully', 'Security is heavy', 'Accommodation very limited — book tent cities'],
        },
        category: 'religious',
    },
    {
        name: 'Bihu',
        emoji: '🌾',
        dates: [[4, 13, 4, 16]],
        locations: ['Guwahati', 'Kaziranga', 'Majuli'],
        description: 'Assam\'s vibrant harvest festival — traditional Bihu dance, feasts, and community bonfires.',
        travelImpact: {
            crowdMultiplier: 1.5,
            priceSurge: 15,
            specialActivities: ['Bihu dance performances', 'Meji bonfire', 'Pitha rice cake tasting', 'Bulbul fights (cultural)'],
            warnings: ['Local transport may be limited during festivities'],
        },
        category: 'regional',
    },
];

/**
 * Check if any festivals are active during the given date range.
 * Returns matching festivals sorted by relevance to the destination.
 */
export function getActiveFestivals(startDate: string, days: number, destName: string): Festival[] {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + days);

    const startMonth = start.getMonth() + 1;
    const startDay = start.getDate();
    const endMonth = end.getMonth() + 1;
    const endDay = end.getDate();

    return FESTIVALS.filter(festival => {
        // Check if any of the festival's date ranges overlap with the trip
        return festival.dates.some(([fm1, fd1, fm2, fd2]) => {
            const festivalStart = fm1 * 100 + fd1;
            const festivalEnd = fm2 * 100 + fd2;
            const tripStart = startMonth * 100 + startDay;
            const tripEnd = endMonth * 100 + endDay;

            // Handle year wraparound (e.g., Dec-Jan)
            if (festivalEnd < festivalStart) {
                return tripStart >= festivalStart || tripEnd <= festivalEnd ||
                       tripStart <= festivalEnd || tripEnd >= festivalStart;
            }

            return tripStart <= festivalEnd && tripEnd >= festivalStart;
        });
    }).sort((a, b) => {
        // Prioritize festivals at the destination
        const aLocal = a.locations.some(loc => 
            destName.toLowerCase().includes(loc.toLowerCase()) ||
            loc.toLowerCase().includes(destName.toLowerCase())
        );
        const bLocal = b.locations.some(loc => 
            destName.toLowerCase().includes(loc.toLowerCase()) ||
            loc.toLowerCase().includes(destName.toLowerCase())
        );
        if (aLocal && !bLocal) return -1;
        if (!aLocal && bLocal) return 1;
        return b.travelImpact.crowdMultiplier - a.travelImpact.crowdMultiplier;
    });
}

/**
 * Get upcoming festivals for a destination (next 3 months).
 */
export function getUpcomingFestivals(destName: string): Festival[] {
    const now = new Date();
    const threeMonths = new Date(now);
    threeMonths.setMonth(threeMonths.getMonth() + 3);

    const nowMonth = now.getMonth() + 1;
    const endMonth = threeMonths.getMonth() + 1;

    return FESTIVALS.filter(festival => {
        const isRelevant = festival.locations.some(loc =>
            destName.toLowerCase().includes(loc.toLowerCase()) ||
            loc.toLowerCase().includes(destName.toLowerCase())
        );

        if (!isRelevant) return false;

        return festival.dates.some(([fm1, , fm2]) => {
            if (endMonth >= nowMonth) {
                return fm1 >= nowMonth && fm1 <= endMonth;
            }
            // Year wraparound
            return fm1 >= nowMonth || fm1 <= endMonth;
        });
    });
}

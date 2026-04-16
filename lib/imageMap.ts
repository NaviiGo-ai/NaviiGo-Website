// ─── Centralized Image Map ────────────────────────────────────────────────────
// Single source of truth for ALL destination & landmark images across NaviiGo.
//
// Strategy: Use Unsplash Source URLs (images.unsplash.com) which are designed
// for hotlinking and have no rate limits for standard usage. These URLs are
// permanent and serve optimized, high-quality images.
//
// HOW TO UPDATE:
//   1. Find an image on unsplash.com for your destination
//   2. Copy the photo ID from the URL (e.g., "photo-1234567890123-abc")
//   3. Replace the URL string for the relevant key below

// ─── Unsplash helper ──────────────────────────────────────────────────────────
function unsplash(photoId: string, w: number = 1280): string {
    return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${w}&q=80`;
}

// ─── DESTINATION HERO IMAGES ──────────────────────────────────────────────────

export const DEST_IMAGES: Record<string, string> = {
    // ── North India ──────────────────────────────────────────────
    jaipur:         unsplash('photo-1599661046289-e31897846e41'),  // Hawa Mahal pink
    delhi:          unsplash('photo-1587474260584-136574528ed5'),  // India Gate
    agra:           unsplash('photo-1564507592333-c60657eea523'),  // Taj Mahal
    varanasi:       unsplash('photo-1561361513-2d000a50f0dc'),  // Varanasi ghats
    lucknow:        unsplash('photo-1578662996442-48f60103fc96'),  // Bara Imambara
    amritsar:       unsplash('photo-1514222134-b57cbb8ce073'),  // Golden Temple
    mathura:        unsplash('photo-1609947017136-9daf32a2cd73'),  // Krishna temple
    prayagraj:      unsplash('photo-1561361513-2d000a50f0dc'),  // Sangam
    chandigarh:     unsplash('photo-1598977123118-4e30ba3c4f5b'),  // Rock Garden
    ayodhya:        unsplash('photo-1609947017136-9daf32a2cd73'),  // Ram Mandir
    vrindavan:      unsplash('photo-1609947017136-9daf32a2cd73'),  // Temple
    khajuraho:      unsplash('photo-1524492412937-b28074a5d7da'),  // Temple sculpture
    orchha:         unsplash('photo-1524492412937-b28074a5d7da'),  // Heritage fort

    // ── Rajasthan ────────────────────────────────────────────────
    udaipur:        unsplash('photo-1602216056096-3b40cc0c9944'),  // Lake Palace
    jodhpur:        unsplash('photo-1568495248636-6432b97bd949'),  // Blue City
    jaisalmer:      unsplash('photo-1609866138210-84bb689f3c61'),  // Golden Fort
    pushkar:        unsplash('photo-1599661046289-e31897846e41'),  // Pushkar Lake
    mountabu:       unsplash('photo-1599661046289-e31897846e41'),  // Mount Abu
    ranthambore:    unsplash('photo-1615824996195-f780bba7cfab'),  // Tiger
    bikaner:        unsplash('photo-1599661046289-e31897846e41'),  // Bikaner Fort

    // ── Himalayan Region ─────────────────────────────────────────
    manali:         unsplash('photo-1626621341517-bbf3d9990a23'),  // Snow mountains
    shimla:         unsplash('photo-1597074866923-dc0589150358'),  // Shimla Mall Road
    dharamshala:    unsplash('photo-1626621341517-bbf3d9990a23'),  // McLeodGanj
    rishikesh:      unsplash('photo-1583309219338-a582f1f9ca6b'),  // Lakshman Jhula
    haridwar:       unsplash('photo-1561361513-2d000a50f0dc'),  // Ganga aarti
    mussoorie:      unsplash('photo-1626621341517-bbf3d9990a23'),  // Hill station
    nainital:       unsplash('photo-1626621341517-bbf3d9990a23'),  // Lake
    dehradun:       unsplash('photo-1626621341517-bbf3d9990a23'),  // Dehradun valley
    leh:            unsplash('photo-1512100356356-de1b84283e18'),  // Pangong Lake
    ladakh:         unsplash('photo-1512100356356-de1b84283e18'),  // Ladakh mountains
    spiti:          unsplash('photo-1626621341517-bbf3d9990a23'),  // Spiti Valley
    kasol:          unsplash('photo-1626621341517-bbf3d9990a23'),  // Parvati Valley
    mcleodganj:     unsplash('photo-1626621341517-bbf3d9990a23'),  // Mountains
    chopta:         unsplash('photo-1626621341517-bbf3d9990a23'),  // Tungnath
    auli:           unsplash('photo-1626621341517-bbf3d9990a23'),  // Skiing

    // ── Kashmir ──────────────────────────────────────────────────
    srinagar:       unsplash('photo-1596402184320-417e7178b2cd'),  // Dal Lake
    gulmarg:        unsplash('photo-1596402184320-417e7178b2cd'),  // Snow meadow
    pahalgam:       unsplash('photo-1596402184320-417e7178b2cd'),  // Valley
    sonmarg:        unsplash('photo-1596402184320-417e7178b2cd'),  // Golden meadow

    // ── South India ──────────────────────────────────────────────
    kerala:         unsplash('photo-1602216056096-3b40cc0c9944'),  // Backwaters
    mysuru:         unsplash('photo-1600100397608-e5a7c7bca4b1'),  // Mysore Palace
    chennai:        unsplash('photo-1582510003544-4d00b7f74220'),  // Kapaleeshwarar
    bangalore:      unsplash('photo-1596176530529-78163a4f7af2'),  // Garden City
    hyderabad:      unsplash('photo-1572097662878-03e200dfe2c4'),  // Charminar
    ooty:           unsplash('photo-1602216056096-3b40cc0c9944'),  // Nilgiri hills
    kodaikanal:     unsplash('photo-1602216056096-3b40cc0c9944'),  // Hill station
    coorg:          unsplash('photo-1602216056096-3b40cc0c9944'),  // Coffee estates
    pondicherry:    unsplash('photo-1582510003544-4d00b7f74220'),  // French Quarter
    madurai:        unsplash('photo-1582510003544-4d00b7f74220'),  // Meenakshi Temple
    thanjavur:      unsplash('photo-1582510003544-4d00b7f74220'),  // Brihadeshwara
    hampi:          unsplash('photo-1590050752117-238cb20e10a0'),  // Boulder ruins
    gokarna:        unsplash('photo-1507525428034-b723cf961d3e'),  // Beach
    wayanad:        unsplash('photo-1602216056096-3b40cc0c9944'),  // Green hills
    alleppey:       unsplash('photo-1593693397690-362cb9666fc2'),  // Houseboat
    munnar:         unsplash('photo-1602216056096-3b40cc0c9944'),  // Tea gardens
    mahabalipuram:  unsplash('photo-1582510003544-4d00b7f74220'),  // Shore Temple
    rameshwaram:    unsplash('photo-1582510003544-4d00b7f74220'),  // Pamban Bridge
    kanyakumari:    unsplash('photo-1507525428034-b723cf961d3e'),  // Land's End

    // ── West India ───────────────────────────────────────────────
    goa:            unsplash('photo-1512343879784-a960bf40e7f2'),  // Beach sunset
    mumbai:         unsplash('photo-1570168007204-dfb528c6958f'),  // Gateway India
    pune:           unsplash('photo-1570168007204-dfb528c6958f'),  // Shaniwar Wada
    lonavala:       unsplash('photo-1506905925346-21bda4d32df4'),  // Western Ghats
    nashik:         unsplash('photo-1570168007204-dfb528c6958f'),  // Vineyards
    ajanta:         unsplash('photo-1524492412937-b28074a5d7da'),  // Cave art
    ellora:         unsplash('photo-1524492412937-b28074a5d7da'),  // Kailasa Temple
    dwarka:         unsplash('photo-1609947017136-9daf32a2cd73'),  // Dwarkadhish
    somnath:        unsplash('photo-1609947017136-9daf32a2cd73'),  // Somnath Temple
    kutch:          unsplash('photo-1609866138210-84bb689f3c61'),  // White Rann
    diu:            unsplash('photo-1507525428034-b723cf961d3e'),  // Beach
    ahmedabad:      unsplash('photo-1524492412937-b28074a5d7da'),  // Adalaj Stepwell

    // ── East India ───────────────────────────────────────────────
    kolkata:        unsplash('photo-1558431382-27e303142255'),  // Victoria Memorial
    darjeeling:     unsplash('photo-1544735716-392fe2489ffa'),  // Tea gardens
    gangtok:        unsplash('photo-1544735716-392fe2489ffa'),  // Mountains
    puri:           unsplash('photo-1609947017136-9daf32a2cd73'),  // Jagannath
    bhubaneswar:    unsplash('photo-1524492412937-b28074a5d7da'),  // Lingaraj Temple
    konark:         unsplash('photo-1524492412937-b28074a5d7da'),  // Sun Temple
    bodhgaya:       unsplash('photo-1524492412937-b28074a5d7da'),  // Mahabodhi Temple
    sundarbans:     unsplash('photo-1615824996195-f780bba7cfab'),  // Mangrove forest

    // ── Northeast India ──────────────────────────────────────────
    shillong:       unsplash('photo-1506905925346-21bda4d32df4'),  // Green hills
    cherrapunji:    unsplash('photo-1506905925346-21bda4d32df4'),  // Waterfalls
    kaziranga:      unsplash('photo-1615824996195-f780bba7cfab'),  // Rhino
    tawang:         unsplash('photo-1626621341517-bbf3d9990a23'),  // Monastery
    majuli:         unsplash('photo-1506905925346-21bda4d32df4'),  // River island
    guwahati:       unsplash('photo-1506905925346-21bda4d32df4'),  // Assam
    imphal:         unsplash('photo-1506905925346-21bda4d32df4'),  // Manipur
    kohima:         unsplash('photo-1506905925346-21bda4d32df4'),  // Nagaland
    ziro:           unsplash('photo-1506905925346-21bda4d32df4'),  // Rice paddies

    // ── Central India ────────────────────────────────────────────
    bhopal:         unsplash('photo-1524492412937-b28074a5d7da'),  // Lake city
    indore:         unsplash('photo-1524492412937-b28074a5d7da'),  // Rajwada
    ujjain:         unsplash('photo-1609947017136-9daf32a2cd73'),  // Mahakaleshwar
    sanchi:         unsplash('photo-1524492412937-b28074a5d7da'),  // Stupa
    pachmarhi:      unsplash('photo-1506905925346-21bda4d32df4'),  // Hills
    mandu:          unsplash('photo-1524492412937-b28074a5d7da'),  // Ruins

    // ── Islands ──────────────────────────────────────────────────
    andaman:        unsplash('photo-1507525428034-b723cf961d3e'),  // Radhanagar Beach
    lakshadweep:    unsplash('photo-1507525428034-b723cf961d3e'),  // Coral island

    // ── Other Popular ────────────────────────────────────────────
    tirupati:       unsplash('photo-1609947017136-9daf32a2cd73'),  // Tirupati Temple
    shirdi:         unsplash('photo-1609947017136-9daf32a2cd73'),  // Sai Baba
    vaishno_devi:   unsplash('photo-1626621341517-bbf3d9990a23'),  // Mountain temple
    birBilling:     unsplash('photo-1626621341517-bbf3d9990a23'),  // Paragliding
};

// ─── LANDMARK / ATTRACTION IMAGES ─────────────────────────────────────────────

export const LANDMARK_IMAGES: Record<string, string> = {
    // Jaipur
    'Hawa Mahal':               unsplash('photo-1599661046289-e31897846e41'),
    'Amer Fort':                unsplash('photo-1599661046289-e31897846e41'),
    'City Palace Jaipur':       unsplash('photo-1599661046289-e31897846e41'),
    'Nahargarh Fort':           unsplash('photo-1599661046289-e31897846e41'),
    'Jal Mahal':                unsplash('photo-1599661046289-e31897846e41'),

    // Agra
    'Taj Mahal':                unsplash('photo-1564507592333-c60657eea523'),
    'Agra Fort':                unsplash('photo-1564507592333-c60657eea523'),
    'Mehtab Bagh':              unsplash('photo-1564507592333-c60657eea523'),

    // Varanasi
    'Dashashwamedh Ghat':       unsplash('photo-1561361513-2d000a50f0dc'),
    'Kashi Vishwanath':         unsplash('photo-1561361513-2d000a50f0dc'),
    'Sarnath':                  unsplash('photo-1524492412937-b28074a5d7da'),

    // Delhi
    'Red Fort':                 unsplash('photo-1587474260584-136574528ed5'),
    'Qutub Minar':              unsplash('photo-1587474260584-136574528ed5'),
    'India Gate':               unsplash('photo-1587474260584-136574528ed5'),

    // Kerala
    'Alleppey Houseboat':       unsplash('photo-1593693397690-362cb9666fc2'),
    'Munnar Tea Gardens':       unsplash('photo-1602216056096-3b40cc0c9944'),
    'Fort Kochi':               unsplash('photo-1602216056096-3b40cc0c9944'),

    // Goa
    'Basilica of Bom Jesus':    unsplash('photo-1512343879784-a960bf40e7f2'),
    'Chapora Fort':             unsplash('photo-1512343879784-a960bf40e7f2'),
    'Dudhsagar Falls':          unsplash('photo-1506905925346-21bda4d32df4'),

    // Rishikesh
    'Laxman Jhula':             unsplash('photo-1583309219338-a582f1f9ca6b'),
    'Beatles Ashram':           unsplash('photo-1583309219338-a582f1f9ca6b'),
    'Triveni Ghat':             unsplash('photo-1583309219338-a582f1f9ca6b'),

    // Manali
    'Rohtang Pass':             unsplash('photo-1626621341517-bbf3d9990a23'),
    'Hadimba Temple':           unsplash('photo-1626621341517-bbf3d9990a23'),
    'Solang Valley':            unsplash('photo-1626621341517-bbf3d9990a23'),

    // Udaipur
    'City Palace Udaipur':      unsplash('photo-1602216056096-3b40cc0c9944'),
    'Lake Pichola':             unsplash('photo-1602216056096-3b40cc0c9944'),

    // Amritsar
    'Golden Temple':            unsplash('photo-1514222134-b57cbb8ce073'),

    // Hyderabad
    'Charminar':                unsplash('photo-1572097662878-03e200dfe2c4'),

    // Mysuru
    'Mysore Palace':            unsplash('photo-1600100397608-e5a7c7bca4b1'),

    // Hampi
    'Virupaksha Temple':        unsplash('photo-1590050752117-238cb20e10a0'),

    // Kolkata
    'Victoria Memorial':        unsplash('photo-1558431382-27e303142255'),
    'Howrah Bridge':            unsplash('photo-1558431382-27e303142255'),

    // Mumbai
    'Gateway of India':         unsplash('photo-1570168007204-dfb528c6958f'),
};

// ─── CATEGORY IMAGES ──────────────────────────────────────────────────────────

export const CATEGORY_IMAGES: Record<string, string> = {
    food_indian:    unsplash('photo-1585937421612-70a008356fbe'),  // Indian thali
    food_south:     unsplash('photo-1630383249896-524143b5e419'),  // Dosa
    food_north:     unsplash('photo-1603894584373-5ac82b2ae7d9'),  // Butter chicken
    food_street:    unsplash('photo-1601050690597-df0568f70950'),  // Street food
    hotel_luxury:   unsplash('photo-1602216056096-3b40cc0c9944'),  // Palace hotel
    hotel_budget:   unsplash('photo-1583309219338-a582f1f9ca6b'),  // Backpacker
    resort:         unsplash('photo-1602216056096-3b40cc0c9944'),  // Resort pool
};

// ─── GENERIC FALLBACK IMAGES ──────────────────────────────────────────────────

export const FALLBACK_IMAGES = {
    attraction: unsplash('photo-1564507592333-c60657eea523'),   // Taj Mahal
    restaurant: unsplash('photo-1585937421612-70a008356fbe'),   // Indian food
    hotel:      unsplash('photo-1602216056096-3b40cc0c9944'),   // Palace
    nature:     unsplash('photo-1506905925346-21bda4d32df4'),   // Green hills
    beach:      unsplash('photo-1507525428034-b723cf961d3e'),   // Beach
    mountain:   unsplash('photo-1626621341517-bbf3d9990a23'),   // Mountains
    spiritual:  unsplash('photo-1561361513-2d000a50f0dc'),      // Varanasi
    heritage:   unsplash('photo-1524492412937-b28074a5d7da'),   // Heritage
    default:    unsplash('photo-1564507592333-c60657eea523'),   // Taj Mahal
};

// ─── CSS Gradient Fallbacks (for when ALL images fail) ────────────────────────

export const GRADIENT_FALLBACKS: Record<string, string> = {
    nature:     'linear-gradient(135deg, #0f766e 0%, #064e3b 100%)',
    spiritual:  'linear-gradient(135deg, #b45309 0%, #78350f 100%)',
    beach:      'linear-gradient(135deg, #0369a1 0%, #075985 100%)',
    mountain:   'linear-gradient(135deg, #4338ca 0%, #1e1b4b 100%)',
    heritage:   'linear-gradient(135deg, #92400e 0%, #451a03 100%)',
    food:       'linear-gradient(135deg, #c2410c 0%, #7c2d12 100%)',
    hotel:      'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)',
    adventure:  'linear-gradient(135deg, #047857 0%, #064e3b 100%)',
    default:    'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
};

// ─── Smart Image Resolver ─────────────────────────────────────────────────────

export function getPlaceImage(name: string, category?: string): string {
    // 1. Try exact landmark match
    if (LANDMARK_IMAGES[name]) return LANDMARK_IMAGES[name];

    // 2. Try destination match
    const key = name.toLowerCase().replace(/\s+/g, '').replace(/backwaters|beaches|city|islands/gi, '');
    for (const [k, v] of Object.entries(DEST_IMAGES)) {
        if (key.includes(k) || k.includes(key)) return v;
    }

    // 3. Try category fallback
    if (category && FALLBACK_IMAGES[category as keyof typeof FALLBACK_IMAGES]) {
        return FALLBACK_IMAGES[category as keyof typeof FALLBACK_IMAGES];
    }

    return FALLBACK_IMAGES.default;
}

// ─── Image Error Handler ─────────────────────────────────────────────────────

export function handleImgError(
    e: React.SyntheticEvent<HTMLImageElement | HTMLDivElement>,
    category?: string
): void {
    const el = e.currentTarget;
    const gradient = GRADIENT_FALLBACKS[category || 'default'] || GRADIENT_FALLBACKS.default;

    if (el instanceof HTMLImageElement) {
        el.style.display = 'none';
        const parent = el.parentElement;
        if (parent) {
            parent.style.background = gradient;
        }
    } else {
        el.style.backgroundImage = 'none';
        el.style.background = gradient;
    }
}

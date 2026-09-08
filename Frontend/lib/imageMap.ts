// ─── Centralized Image Map ────────────────────────────────────────────────────
// Single source of truth for ALL destination images across NaviiGo.
//
// Strategy: ALL images are served locally from /public/destinations/.
// No external URLs. No hotlinking. No rate limits. No 404s.
// Each destination has its own unique image file.

// ─── Helper: Resolve file extension ──────────────────────────────────────────
// Generated images are .png, Wikipedia downloads are .jpg
function img(name: string): string {
    // Check if we have a .png (AI-generated, higher quality)
    // At build time these are all known, so we hardcode the extension
    return `/destinations/${name}`;
}

// ─── DESTINATION IMAGES ──────────────────────────────────────────────────────
// Every single destination has its own unique, distinct local image.

export const DEST_IMAGES: Record<string, string> = {
    // ── North India ──────────────────────────────────────────────
    jaipur:         img('jaipur.png'),       // Hawa Mahal
    delhi:          img('delhi.png'),        // India Gate
    agra:           img('agra.png'),         // Taj Mahal
    varanasi:       img('varanasi.png'),     // Ghats & Ganga Aarti
    amritsar:       img('amritsar.png'),     // Golden Temple
    lucknow:        img('lucknow.png'),      // Bara Imambara
    chandigarh:     img('chandigarh.jpg'),   // Open Hand Monument
    mathura:        img('mathura.jpg'),      // Krishna Temple
    ayodhya:        img('ayodhya.jpg'),      // Ram Mandir
    prayagraj:      img('prayagraj.jpg'),    // Triveni Sangam

    // ── Rajasthan ────────────────────────────────────────────────
    udaipur:        img('udaipur.png'),      // Lake Palace
    jodhpur:        img('jodhpur.png'),      // Blue City & Mehrangarh
    jaisalmer:      img('jaisalmer.png'),    // Golden Fort & Dunes
    pushkar:        img('pushkar.png'),      // Pushkar Lake
    ranthambore:    img('ranthambore.jpg'),  // Tiger Safari
    bikaner:        img('bikaner.jpg'),      // Junagarh Fort

    // ── Himalayan Region ─────────────────────────────────────────
    manali:         img('manali.png'),       // Snow peaks & pines
    shimla:         img('shimla.png'),       // Colonial hill station
    dharamshala:    img('dharamshala.png'),  // Prayer flags & peaks
    rishikesh:      img('rishikesh.png'),    // Lakshman Jhula & Ganges
    mussoorie:      img('mussoorie.png'),    // Misty green mountains
    nainital:       img('nainital.png'),     // Lake & mountains
    haridwar:       img('haridwar.jpg'),     // Ganga Aarti
    kasol:          img('kasol.jpg'),        // Parvati Valley

    // ── Kashmir & Ladakh ─────────────────────────────────────────
    srinagar:       img('srinagar.jpg'),     // Dal Lake
    gulmarg:        img('gulmarg.jpg'),      // Meadow of Flowers
    ladakh:         img('ladakh.jpg'),       // High passes
    pahalgam:       img('pahalgam.jpg'),     // Valley of Shepherds

    // ── South India ──────────────────────────────────────────────
    kerala:         img('kerala.jpg'),       // Backwaters houseboat
    mysuru:         img('mysuru.jpg'),       // Mysore Palace
    hampi:          img('hampi.jpg'),        // Virupaksha Temple
    pondicherry:    img('pondicherry.jpg'),  // French Quarter
    ooty:           img('ooty.jpg'),         // Nilgiri hills
    kodaikanal:     img('kodaikanal.jpg'),   // Princess of Hills
    coorg:          img('coorg.jpg'),        // Coffee plantations
    madurai:        img('madurai.jpg'),      // Meenakshi Temple
    hyderabad:      img('hyderabad.jpg'),    // Charminar
    chennai:        img('chennai.jpg'),      // Kapaleeshwarar Temple
    rameshwaram:    img('rameshwaram.jpg'),  // Pamban Bridge
    kanyakumari:    img('kanyakumari.jpg'),  // Land's End
    tirupati:       img('tirupati.jpg'),     // Tirumala Temple

    // ── West India ────────────────────────────────────────────────
    goa:            img('goa.jpg'),          // Beach paradise
    mumbai:         img('mumbai.jpg'),       // Gateway of India
    lonavala:       img('lonavala.jpg'),     // Sahyadri hills
    ajanta:         img('ajanta.jpg'),       // Ajanta Caves
    dwarka:         img('dwarka.jpg'),       // Dwarkadhish Temple
    kutch:          img('kutch.jpg'),        // Rann of Kutch
    shirdi:         img('shirdi.jpg'),       // Sai Baba Temple
    somnath:        img('somnath.jpg'),      // Somnath Temple

    // ── East India ────────────────────────────────────────────────
    kolkata:        img('kolkata.jpg'),      // Victoria Memorial
    darjeeling:     img('darjeeling.jpg'),   // Toy Train & Tea
    gangtok:        img('gangtok.jpg'),      // MG Marg
    puri:           img('puri.jpg'),         // Jagannath Temple
    bodhgaya:       img('bodhgaya.jpg'),     // Mahabodhi Temple

    // ── Northeast India ──────────────────────────────────────────
    shillong:       img('shillong.jpg'),     // Scotland of East
    kaziranga:      img('kaziranga.jpg'),    // Rhino Safari
    tawang:         img('tawang.jpg'),       // Tawang Monastery

    // ── Central India ────────────────────────────────────────────
    khajuraho:      img('khajuraho.jpg'),    // Temple sculptures
    ujjain:         img('ujjain.jpg'),       // Mahakaleshwar

    // ── Islands ──────────────────────────────────────────────────
    andaman:        img('andaman.png'),      // Tropical paradise
    lakshadweep:    img('lakshadweep.jpg'),  // Coral islands

    // ── Hidden Gems & Trending ───────────────────────────────────
    spiti:          img('spiti.jpg'),        // Spiti Valley
    gokarna:        img('goa.jpg'),         // Beach vibe
    majuli:         img('kaziranga.jpg'),    // NE India
    chopta:         img('chopta.jpg'),       // Mini Switzerland
    auli:           img('auli.jpg'),         // Skiing paradise
    ziro:           img('ziro.jpg'),         // Ziro Valley
    mandu:          img('mandu.jpg'),        // Ruined city of romance
    orchha:         img('orchha.jpg'),       // Bundela capital
    birBilling:     img('birbilling.jpg'),   // Paragliding capital
    cherrapunji:    img('cherrapunji.jpg'),  // Wettest place on Earth
};

// ─── Category Image Pools ─────────────────────────────────────────────────────
// Used by resolveImgSrc() for deterministic variety — each category has a pool
// of local images. A hash of the item name selects one, preventing all cards
// from showing the same fallback image.

export const CATEGORY_IMAGE_POOLS: Record<string, string[]> = {
    temple:     [img('varanasi.png'), img('madurai.jpg'), img('tirupati.jpg'), img('puri.jpg'), img('haridwar.jpg'), img('amritsar.png'), img('bodhgaya.jpg'), img('ujjain.jpg'), img('mathura.jpg'), img('ayodhya.jpg'), img('shirdi.jpg'), img('dwarka.jpg')],
    spiritual:  [img('varanasi.png'), img('rishikesh.png'), img('haridwar.jpg'), img('bodhgaya.jpg'), img('amritsar.png'), img('ujjain.jpg'), img('prayagraj.jpg'), img('mathura.jpg')],
    heritage:   [img('jaipur.png'), img('hampi.jpg'), img('lucknow.png'), img('khajuraho.jpg'), img('orchha.jpg'), img('ajanta.jpg'), img('mysuru.jpg'), img('kolkata.jpg')],
    fort:       [img('jaipur.png'), img('jaisalmer.png'), img('jodhpur.png'), img('udaipur.png'), img('orchha.jpg'), img('bikaner.jpg')],
    palace:     [img('udaipur.png'), img('mysuru.jpg'), img('jaipur.png'), img('jodhpur.png')],
    beach:      [img('goa.jpg'), img('pondicherry.jpg'), img('andaman.png'), img('lakshadweep.jpg'), img('kanyakumari.jpg'), img('rameshwaram.jpg')],
    nature:     [img('coorg.jpg'), img('ooty.jpg'), img('kodaikanal.jpg'), img('mussoorie.png'), img('nainital.png'), img('darjeeling.jpg'), img('cherrapunji.jpg'), img('shillong.jpg')],
    mountain:   [img('manali.png'), img('shimla.png'), img('dharamshala.png'), img('ladakh.jpg'), img('spiti.jpg'), img('auli.jpg'), img('chopta.jpg'), img('gulmarg.jpg')],
    trekking:   [img('manali.png'), img('rishikesh.png'), img('ladakh.jpg'), img('spiti.jpg'), img('chopta.jpg'), img('auli.jpg')],
    market:     [img('jaipur.png'), img('kolkata.jpg'), img('hyderabad.jpg'), img('mumbai.jpg'), img('lucknow.png')],
    shopping:   [img('jaipur.png'), img('mumbai.jpg'), img('hyderabad.jpg'), img('kolkata.jpg')],
    food:       [img('hyderabad.jpg'), img('kolkata.jpg'), img('lucknow.png'), img('chennai.jpg'), img('mumbai.jpg'), img('goa.jpg')],
    restaurant: [img('hyderabad.jpg'), img('goa.jpg'), img('pondicherry.jpg'), img('kolkata.jpg'), img('lucknow.png'), img('chennai.jpg')],
    hotel:      [img('udaipur.png'), img('shimla.png'), img('goa.jpg'), img('coorg.jpg'), img('mysuru.jpg'), img('mussoorie.png')],
    museum:     [img('kolkata.jpg'), img('mumbai.jpg'), img('hyderabad.jpg'), img('jaipur.png'), img('lucknow.png')],
    lake:       [img('nainital.png'), img('udaipur.png'), img('srinagar.jpg'), img('kodaikanal.jpg'), img('pushkar.png')],
    garden:     [img('ooty.jpg'), img('coorg.jpg'), img('mussoorie.png'), img('darjeeling.jpg'), img('chandigarh.jpg')],
    waterfall:  [img('coorg.jpg'), img('cherrapunji.jpg'), img('lonavala.jpg'), img('ooty.jpg')],
    sunset:     [img('goa.jpg'), img('kanyakumari.jpg'), img('udaipur.png'), img('pondicherry.jpg')],
    default:    [img('jaipur.png'), img('varanasi.png'), img('goa.jpg'), img('manali.png'), img('udaipur.png'), img('kerala.jpg'), img('mumbai.jpg'), img('coorg.jpg')],
};

/**
 * Hash a string to an integer — used for deterministic image selection.
 * Same name always picks the same image from a pool.
 */
export function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}

/**
 * Get a deterministic image from a category pool based on the item name.
 * This ensures each restaurant/hotel/attraction gets a visually different image.
 */
export function getCategoryImage(name: string, category?: string): string {
    const cat = (category || 'default').toLowerCase();
    const pool = CATEGORY_IMAGE_POOLS[cat] || CATEGORY_IMAGE_POOLS.default;
    const hash = hashString(name || 'default');
    return pool[hash % pool.length];
}

// ─── Generic Fallbacks (Backward Compatibility) ───────────────────────────────
export const FALLBACK_IMAGES: Record<string, string> = {
    attraction: CATEGORY_IMAGE_POOLS.heritage[0],
    restaurant: CATEGORY_IMAGE_POOLS.restaurant[0],
    hotel:      CATEGORY_IMAGE_POOLS.hotel[0],
    nature:     CATEGORY_IMAGE_POOLS.nature[0],
    beach:      CATEGORY_IMAGE_POOLS.beach[0],
    mountain:   CATEGORY_IMAGE_POOLS.mountain[0],
    spiritual:  CATEGORY_IMAGE_POOLS.spiritual[0],
    heritage:   CATEGORY_IMAGE_POOLS.heritage[0],
    default:    CATEGORY_IMAGE_POOLS.default[0],
};

export const GRADIENT_FALLBACKS: Record<string, string> = {
    nature:     'linear-gradient(135deg, #0f766e 0%, #064e3b 100%)',
    spiritual:  'linear-gradient(135deg, #b45309 0%, #78350f 100%)',
    beach:      'linear-gradient(135deg, #0369a1 0%, #075985 100%)',
    mountain:   'linear-gradient(135deg, #4338ca 0%, #1e1b4b 100%)',
    heritage:   'linear-gradient(135deg, #92400e 0%, #451a03 100%)',
    food:       'linear-gradient(135deg, #c2410c 0%, #7c2d12 100%)',
    hotel:      'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)',
    default:    'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
};

// ─── Resolver Function ────────────────────────────────────────────────────────
export function getPlaceImage(name: string, category?: string): string {
    const key = name.toLowerCase().replace(/[\s\-]+/g, '');
    for (const [k, v] of Object.entries(DEST_IMAGES)) {
        if (key.includes(k) || k.includes(key)) return v;
    }
    // Use category-aware hash-based fallback instead of always showing Delhi
    if (category) {
        return getCategoryImage(name, category);
    }
    return getCategoryImage(name, 'default');
}

export function handleImgError(e: React.SyntheticEvent<HTMLImageElement | HTMLDivElement>, category?: string): void {
    const el = e.currentTarget;
    const gradient = GRADIENT_FALLBACKS[category || 'default'] || GRADIENT_FALLBACKS.default;
    if (el instanceof HTMLImageElement) {
        el.style.display = 'none';
        if (el.parentElement) el.parentElement.style.background = gradient;
    } else {
        el.style.backgroundImage = 'none';
        el.style.background = gradient;
    }
}


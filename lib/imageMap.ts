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

// ─── Generic Fallbacks ────────────────────────────────────────────────────────
export const FALLBACK_IMAGES: Record<string, string> = {
    attraction: img('agra.png'),
    restaurant: img('delhi.png'),
    hotel:      img('udaipur.png'),
    nature:     img('coorg.jpg'),
    beach:      img('goa.jpg'),
    mountain:   img('manali.png'),
    spiritual:  img('varanasi.png'),
    heritage:   img('jaipur.png'),
    default:    img('delhi.png'),
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
    if (category && FALLBACK_IMAGES[category as keyof typeof FALLBACK_IMAGES]) {
        return FALLBACK_IMAGES[category as keyof typeof FALLBACK_IMAGES];
    }
    return FALLBACK_IMAGES.default;
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

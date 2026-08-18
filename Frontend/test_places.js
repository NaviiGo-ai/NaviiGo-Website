const key = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=MG+Marg,+Gangtok,+India&key=${key}`)
  .then(res => res.json())
  .then(data => {
    console.log('Status:', data.status);
    console.log('Results:', data.results?.length);
    if(data.results?.[0]?.photos) {
      console.log('Photo Reference:', data.results[0].photos[0].photo_reference.substring(0, 20) + '...');
    }
  })
  .catch(console.error);

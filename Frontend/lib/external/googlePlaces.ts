export async function getPlaceImages(placeQuery: string, fallbackImages: string[]): Promise<string[]> {
  try {
    const res = await fetch(`/api/places/photo?name=${encodeURIComponent(placeQuery)}&w=1200`);
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data?.url) {
        return [data.url, ...fallbackImages.slice(1)];
      }
    }
  } catch (err) {
    console.warn(`[Places Proxy] Could not resolve photo for ${placeQuery}:`, err);
  }
  return fallbackImages;
}
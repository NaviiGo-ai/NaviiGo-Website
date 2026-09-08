export type NaviiGoPlaceType = 'attraction' | 'restaurant' | 'hotel';

/** Canonical links used from generated itineraries and destination cards. */
export function destinationExploreHref(destinationName: string) {
  return `/explore/${encodeURIComponent(destinationName.trim())}`;
}

export function itineraryPlaceHref(
  type: NaviiGoPlaceType,
  destinationId: string,
  item: { name: string; lat?: number; lng?: number },
) {
  const params = new URLSearchParams({ type, dest: destinationId, name: item.name });
  if (Number.isFinite(item.lat)) params.set('lat', String(item.lat));
  if (Number.isFinite(item.lng)) params.set('lng', String(item.lng));
  return `/itinerary/detail?${params.toString()}`;
}

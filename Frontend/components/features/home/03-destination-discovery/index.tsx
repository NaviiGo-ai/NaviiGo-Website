import React from 'react';
import DestinationClient from './DestinationClient';
import { getPlaceImages } from '@/lib/external/googlePlaces';

const destinationsData = [
  {
    id: '01',
    title: 'Udaipur',
    subtitle: 'The City of Lakes',
    description: 'Floating marble palaces and tranquil waters. A romance carved in white stone, offering an intimately royal perspective on Rajasthan.',
    query: 'The Oberoi Udaivilas Udaipur luxury',
    fallback: 'https://images.unsplash.com/photo-1615836245337-f5b9b230bc18?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: '02',
    title: 'Ranthambore',
    subtitle: 'Wilderness Retreat',
    description: 'Where the wild holds court amidst ancient ruins. Experience the raw pulse of the jungle from the sanctuary of ultra-luxury tents.',
    query: 'Aman-i-Khas Ranthambore',
    fallback: 'https://images.unsplash.com/photo-1570125909232-eb263c85f48c?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: '03',
    title: 'Kerala',
    subtitle: 'God\'s Own Country',
    description: 'Navigate emerald backwaters in bespoke houseboats. A testament to slow luxury, surrounded by unyielding tropical calmness.',
    query: 'Kumarakom Lake Resort Kerala luxury',
    fallback: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: '04',
    title: 'Jodhpur',
    subtitle: 'The Blue City',
    description: 'Towering above the indigo labyrinth is a living palace of golden sandstone. Reawaken the era of maharajas with uncompromising grandeur.',
    query: 'Umaid Bhawan Palace Jodhpur',
    fallback: 'https://images.unsplash.com/photo-1590050720562-b9cf67ecbebd?auto=format&fit=crop&w=1600&q=80',
  }
];

export default async function DestinationDiscovery() {
  // Fetch images for all destinations in parallel
  const destinations = await Promise.all(
    destinationsData.map(async (dest) => {
      const images = await getPlaceImages(dest.query, [dest.fallback]);
      return {
        ...dest,
        image: images[0] || dest.fallback, // Take the first image
      };
    })
  );

  return <DestinationClient destinations={destinations} />;
}

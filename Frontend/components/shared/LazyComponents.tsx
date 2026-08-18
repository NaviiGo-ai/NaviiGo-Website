'use client';

import dynamic from 'next/dynamic';

const SocialButton = dynamic(() => import('@/components/shared/SocialButton'), { ssr: false });
const MorphSurface = dynamic(() => import('@/components/shared/MorphSurface'), { ssr: false });
const WebGLBackground = dynamic(() => import('@/components/shared/WebGLBackground'), { ssr: false });

export function LazySocialButton() { return <div className="fixed right-0 top-1/3 z-50 rounded-l-lg overflow-hidden"><SocialButton /></div>; }
export function LazyMorphSurface() { return <MorphSurface />; }
export function LazyWebGLBackground() { return <WebGLBackground />; }

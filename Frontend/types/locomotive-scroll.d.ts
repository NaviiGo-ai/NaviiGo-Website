// Ambient type declaration for the optional `locomotive-scroll` npm module.
//
// The app deliberately does NOT ship `locomotive-scroll` as a dependency — the
// production bundle loads it from a CDN <script> (see app/layout.tsx) and
// LocomotiveScrollProvider falls back to the `window.LocomotiveScroll` global.
// This declaration lets the guarded dynamic import in that provider typecheck
// without installing the package. The export is `any` because v3/v4 class shapes
// differ and the provider treats the instance as opaque (`scroll: any`).
declare module 'locomotive-scroll' {
  const LocomotiveScroll: any;
  export default LocomotiveScroll;
}

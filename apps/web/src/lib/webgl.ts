/**
 * WebGL capability detection utility for PitchXI
 * Enables progressive enhancement fallback from 3D R3F Stadium to 2D Pitch Builder
 */

let webGLAvailableCache: boolean | null = null;

export function isWebGLAvailable(): boolean {
  if (webGLAvailableCache !== null) {
    return webGLAvailableCache;
  }

  if (typeof window === 'undefined' || !window.WebGLRenderingContext) {
    webGLAvailableCache = false;
    return false;
  }

  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');

    webGLAvailableCache = Boolean(gl && gl instanceof WebGLRenderingContext || (window.WebGL2RenderingContext && gl instanceof WebGL2RenderingContext));
    return webGLAvailableCache;
  } catch {
    webGLAvailableCache = false;
    return false;
  }
}

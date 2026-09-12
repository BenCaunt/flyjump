/** Image measurements only. No inferred neuron activity or retinotopic mapping. */
export type Stimulus = { ready: boolean; luminance: number; motion: number; left: number; right: number; bins?: { light: number; change: number }[] };
export const emptyStimulus: Stimulus = { ready: false, luminance: 0, motion: 0, left: 0, right: 0 };
export function measureFrame(rgba: Uint8ClampedArray, width: number, previous?: Float32Array) {
  const values = new Float32Array(rgba.length / 4);
  const bins = Array.from({ length: 32 }, () => ({ light: 0, change: 0, count: 0 }));
  const height = values.length / width;
  let light = 0, motion = 0, left = 0, right = 0, leftCount = 0, rightCount = 0;
  for (let i = 0; i < values.length; i++) {
    const p = i * 4;
    const value = (.2126 * rgba[p] + .7152 * rgba[p + 1] + .0722 * rgba[p + 2]) / 255;
    const delta = previous ? Math.abs(value - previous[i]) : 0;
    const bin = bins[Math.min(3, Math.floor(Math.floor(i / width) / height * 4)) * 8 + Math.min(7, Math.floor((i % width) / width * 8))];
    bin.light += value; bin.change += delta; bin.count++;
    values[i] = value; light += value; motion += delta;
    // A visible overlay of image-half energy, not an anatomical correspondence.
    const energy = Math.min(1, value * .65 + delta * 2.5);
    if (i % width < width / 2) { left += energy; leftCount++; }
    else { right += energy; rightCount++; }
  }
  return { values, signal: { ready: true, luminance: light / values.length, motion: motion / values.length, left: left / leftCount, right: right / rightCount, bins: bins.map(b => ({ light: b.light / Math.max(1,b.count), change: b.change / Math.max(1,b.count) })) } };
}

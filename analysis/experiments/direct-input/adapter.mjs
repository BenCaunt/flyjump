import { Connectome } from '../../flyjump/src/lib/connectome.ts';

const originalStep = Connectome.prototype.step;
export const ADAPTER_VERSION = 'flydino-direct-input-v1';

/** Preserve the existing 16-input readout and RNG layout. No scaling or memory. */
export function directStep(observations, ablated = false) {
  if (ablated) return Array(16).fill(0);
  if (observations.length !== 8) throw new Error('Expected eight observations');
  return [...observations, 0, 0, 0, 0, 0, 0, 0, 0];
}

/** Process-local intervention: upstream source and published checkpoints stay intact. */
export function setAdapter(kind) {
  if (!['direct', 'connectome'].includes(kind)) throw new Error('Unknown adapter');
  Connectome.prototype.step = kind === 'direct' ? directStep : originalStep;
}

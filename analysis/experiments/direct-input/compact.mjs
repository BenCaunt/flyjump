/** Fold zero padding and affine input preprocessing into an ordinary 8–12–3 MLP. */
export function compactWeights(weights, gain = null) {
  if (weights.length !== 243) throw new Error('Expected a 243-parameter source readout');
  const compact = [];
  const scale = gain === null ? 1 : 2 * gain;
  const offset = gain === null ? 0 : -gain;
  for (let h = 0; h < 12; h++) {
    const base = h * 17;
    let bias = weights[base + 16];
    for (let i = 0; i < 8; i++) {
      compact.push(scale * weights[base + i]);
      bias += offset * weights[base + i];
    }
    compact.push(bias);
  }
  compact.push(...weights.slice(204));
  return compact;
}

/** No connectome, recurrence, feature engineering, padding, or preprocessing. */
export function forwardCompact(weights, observations) {
  const hidden = Array(12);
  const scores = Array(3);
  let k = 0;
  for (let h = 0; h < 12; h++) {
    let z = 0;
    for (let i = 0; i < 8; i++) z += weights[k++] * observations[i];
    hidden[h] = Math.tanh(z + weights[k++]);
  }
  for (let a = 0; a < 3; a++) {
    let z = 0;
    for (let h = 0; h < 12; h++) z += weights[k++] * hidden[h];
    scores[a] = z + weights[k++];
  }
  let action = 0;
  for (let a = 1; a < 3; a++) if (scores[a] > scores[action]) action = a;
  return { scores, action };
}

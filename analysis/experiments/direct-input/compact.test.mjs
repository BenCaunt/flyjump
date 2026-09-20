import test from 'node:test';
import assert from 'node:assert/strict';
import { randomWeights, rng } from '../../flyjump/src/lib/training.ts';
import { forward } from '../../flyjump/src/lib/policy.ts';
import { compactWeights, forwardCompact } from './compact.mjs';

test('147-parameter raw-input network preserves the padded affine readout across varied observations', () => {
  const random = rng(87);
  for (const gain of [null, 0.5, 1, 2, 4]) {
    const original = randomWeights(random);
    const compact = compactWeights(original, gain);
    assert.equal(compact.length, 147);
    for (let trial = 0; trial < 100; trial++) {
      const observations = Array.from({ length: 8 }, () => random() * 4 - 2);
      const inputs = observations.map((x) => gain === null ? x : gain * (2 * x - 1));
      const expected = forward(original, [...inputs, ...Array(8).fill(0)]);
      const actual = forwardCompact(compact, observations);
      assert.equal(actual.action, expected.action);
      for (let a = 0; a < 3; a++) assert.ok(Math.abs(actual.scores[a] - expected.scores[a]) < 1e-12);
    }
  }
});

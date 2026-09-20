import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { observation, actionInput, forward, NETWORK, OBSERVATION_LABELS } from '../../flyjump/src/lib/policy.ts';
import { createRunner, tickRunner, RUNNER, score } from '../../flyjump/src/lib/runner.ts';
import { compactWeights, forwardCompact } from './compact.mjs';

const directory = resolve(process.argv[2] ?? 'experiments/direct-input/tuned-results');
const load = (path) => JSON.parse(readFileSync(path, 'utf8'));
const save = (path, value) => writeFileSync(path, JSON.stringify(value, null, 2) + '\n');
const report = load(join(directory, 'benchmark.json'));
const selected = load(join(directory, 'selected-runs.json'));
assert.equal(report.results.filter((r) => r.kind === 'direct-affine').length, 6, 'All tuned direct-controller evaluations must finish first');
const checks = [];
for (const run of selected) {
  const modelDirectory = run.seed === report.manifest.tuningSeed
    ? join(directory, 'candidates', String(run.gain), String(run.seed))
    : join(directory, 'replicates', String(run.seed));
  const source = load(join(modelDirectory, 'model.json'));
  const weights = compactWeights(source.weights, source.inputAdapter.gain);
  const path = join(modelDirectory, 'compact-model.json');
  save(path, {
    version: 'flydino-raw-observation-8-12-3-v1', environment: NETWORK.version,
    architecture: [8, 12, 3], parameters: 147, observations: OBSERVATION_LABELS,
    trainingSeed: source.trainingSeed, selectedGeneration: source.generation,
    note: 'Algebraically folded from the trained padded affine controller; no additional learning. Feed upstream observations unchanged.',
    weights,
  });
  const comparisons = report.results.filter((r) => r.kind === 'direct-affine' && r.seed === run.seed);
  for (const comparison of comparisons) {
    let decisionsChecked = 0;
    for (const expected of comparison.runs) {
      const state = createRunner(expected.seed);
      const actions = [0, 0, 0];
      let action = 0;
      for (let i = 0; i < Math.round(180 / RUNNER.step) && !state.dead; i++) {
        if (i % NETWORK.decisionSteps === 0) {
          const observations = observation(state);
          action = forwardCompact(weights, observations).action;
          const originalInputs = [...observations.map((x) => source.inputAdapter.gain * (2*x - 1)), ...Array(8).fill(0)];
          assert.equal(action, forward(source.weights, originalInputs).action, 'Decision changed when folding preprocessing');
          decisionsChecked++;
          actions[action]++;
        }
        tickRunner(state, false, actionInput(action));
      }
      const actual = { seed: expected.seed, seconds: state.time, score: score(state), dead: state.dead, jumps: state.jumps, ducks: state.ducks, actions };
      assert.deepEqual(actual, expected, `Compact mismatch for training seed ${run.seed}, course ${expected.seed}`);
    }
    checks.push({ seed: run.seed, split: comparison.split, courses: comparison.runs.length, decisionsChecked, matchedExactly: true, completed: comparison.survived, compactModelSha256: createHash('sha256').update(readFileSync(path)).digest('hex') });
  }
}
save(join(directory, 'compact-verification.json'), { checks, note: 'Independent rollout calls only observation(), forwardCompact(), and tickRunner(auto=false). It never instantiates or steps a connectome.' });
console.table(checks);

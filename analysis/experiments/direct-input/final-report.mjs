import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const load = (path) => JSON.parse(readFileSync(join(here, path), 'utf8'));
const primary = load('results/benchmark.json');
const tuned = load('tuned-results/benchmark.json');
const selection = load('tuned-results/selection.json');
const compact = load('tuned-results/compact-verification.json');
assert.equal(primary.results.length, 15);
assert.equal(tuned.results.length, 12);
assert.equal(compact.checks.length, 6);
assert.ok(compact.checks.every((c) => c.matchedExactly && c.courses === 100));
const seeds = [20260912, 20260913, 20260914];
const pick = (report, kind, seed, split) => report.results.find((r) => r.kind === kind && r.seed === seed && r.split === split);
const perfectSeeds = seeds.filter((seed) => ['published', 'fresh'].every((split) => pick(tuned, 'direct-affine', seed, split).survived === 100));
const mainFinding = perfectSeeds.length
  ? `A plain **147-parameter, 8–12–3 neural network with no connectome** completed every course in both 100-course test sets for training seed(s) **${perfectSeeds.join(', ')}**. This is a constructive example of solving this task without fly connectivity. The original connectome system was more consistent across the three training seeds tested; the full comparison is below.`
  : 'The original controller can learn substantial gameplay directly from the existing eight numerical observations, without any fly connectivity. The full comparison across training seeds is below.';
const published = seeds.map((seed) => {
  const c = pick(tuned, 'connectome', seed, 'published');
  const p = pick(primary, 'direct', seed, 'published');
  const t = pick(tuned, 'direct-affine', seed, 'published');
  return `| ${seed} | ${c.survived}/100 | ${p.survived}/100 | ${t.survived}/100 |`;
});
const fresh = seeds.map((seed) => {
  const c = pick(tuned, 'connectome', seed, 'fresh');
  const t = pick(tuned, 'direct-affine', seed, 'fresh');
  return `| ${seed} | ${c.survived}/100 | ${t.survived}/100 | ${c.meanSeconds.toFixed(3)} | ${t.meanSeconds.toFixed(3)} |`;
});
const aggregate = (kind, split) => {
  const runs = tuned.results.filter((r) => r.kind === kind && r.split === split);
  return { meanCompleted: runs.reduce((s, r) => s + r.survived, 0) / runs.length, meanSeconds: runs.reduce((s, r) => s + r.meanSeconds, 0) / runs.length };
};
const aggregates = ['published', 'fresh'].map((split) => {
  const c = aggregate('connectome', split), t = aggregate('direct-affine', split);
  return `| ${split} | ${c.meanCompleted.toFixed(2)}% | ${t.meanCompleted.toFixed(2)}% | ${c.meanSeconds.toFixed(3)} | ${t.meanSeconds.toFixed(3)} |`;
});
const candidates = selection.candidates.map((c) => `| ${c.gain} | ${c.validation.toFixed(2)} | ${c.generation} | ${c.gain === selection.chosen.gain ? 'Selected' : ''} |`);
const finalModels = load('tuned-results/selected-runs.json').map((r) => {
  const rel = r.directory.slice(here.length + 1);
  return `- Training seed ${r.seed}: [147-parameter checkpoint](${rel}/compact-model.json), [original training log](${rel}/training.json).`;
});
const text = `# Fly Dino: training the controller without a connectome

Date: 2026-09-20. Upstream audited and evaluated at [c08c86b](https://github.com/cobanov/flyjump/tree/c08c86bc18efd8125964b1d2ca4fc1df59700f30).

${mainFinding}

Exact passthrough was unreliable across seeds; a follow-up selected a simple affine input normalization using validation scores. Both stages, including unsuccessful runs, are reported below.

## Published test courses: every training replica

| Training seed | Original connectome | Unchanged direct inputs | Tuned direct inputs |
| --- | ---: | ---: | ---: |
${published.join('\n')}

Counts are completed 180-second courses out of 100. All three conditions use the original observations, game engine, action cadence, 12 hidden units, reward, CEM algorithm, and 80-generation/15,680-episode training budget per run. The tuned condition has additional hyperparameter-search compute, disclosed below.

## Additional test courses declared before tuning

Fresh seeds 4100001–4100100 were fixed before the scaling sweep and never used for checkpoint or scaling selection.

| Training seed | Connectome completed | Tuned direct completed | Connectome mean survival (s) | Tuned direct mean survival (s) |
| --- | ---: | ---: | ---: | ---: |
${fresh.join('\n')}

| Split | Connectome mean completion across 3 replicas | Tuned direct mean completion across 3 replicas | Connectome mean survival (s) | Tuned direct mean survival (s) |
| --- | ---: | ---: | ---: | ---: |
${aggregates.join('\n')}

These averages describe three training replicas on shared courses, not 300 independent test courses. There is no statistical equivalence or superiority claim.

## What changed

The source repository is unchanged. A process-local experiment replaces the output of \`Connectome.step\` with the observation vector followed by eight zeros, preserving the original 16-input readout and optimizer's random-number consumption. No anatomical connections, recurrent state, spiking, teacher actions, or extra observations are used. Only the original readout weights are learned.

The initial experiment used the eight observations unchanged. The follow-up used \`gain * (2*x - 1)\` on each observation, then zero padding. Four gains were tried: 0.5, 1, 2, 4. The selected gain was **${selection.chosen.gain}**. Selection used only the original four validation courses, with ties broken by earlier selected generation and then smaller gain.

This changes input scaling and centering, not information content. The network has 243 stored/search parameters but 147 effective parameters because 96 incoming weights multiply zero. For delivery, the padding was removed and the affine preprocessing was folded algebraically into the first-layer weights and biases, yielding a plain **8–12–3 neural network with 147 parameters taking the original observations unchanged**. This conversion requires no further training.

An independent inference loop that never instantiates or steps a connectome reproduced all **600 tuned direct-controller test rollouts exactly**, including score, survival, action counts, jumps, and ducks, using those compact models. See [verification](tuned-results/compact-verification.json) and [standalone network implementation](compact.mjs).

## Scaling selection and complete budget

All scaling candidates were trained for 80 generations on seed 20260912; none was chosen using test performance.

| Gain | Best validation score | Selected generation | Decision |
| --- | ---: | ---: | --- |
${candidates.join('\n')}

After freezing the gain, two further training seeds, 20260913 and 20260914, were run without changing that setting. All training completed before the tuned models were evaluated on any test course.

- Initial unchanged-input experiment: 3 runs × 15,680 episodes = **47,040 episodes**.
- Follow-up: 4 scaling candidates + 2 additional replicas = **94,080 episodes**.
- Total new training/validation work across both stages: **141,120 episodes**.
- Each reported final controller still has an individual training budget of **15,680 episodes**. Total development/search compute is greater than the three published connectome runs, so this is not an equal-total-budget comparison.

Original connectome checkpoints were reevaluated locally. Every published per-course result was reproduced exactly for all three seeds. Their original training was not rerun. The initial experiment also used a different fresh split, 3100001–3100100; its full results remain in [the initial report](results/REPORT.md), including all weak replicas and untrained controls.

## Supported conclusion and limits

This tests the narrow claim that fly connectivity is necessary for strong performance on this engineered-state Dino task. Successful direct-controller rollouts are counterexamples to that necessity claim. They do not establish that the connectome contributes nothing, that its representation cannot improve optimization, or that all biological connectivity is interchangeable with a generic network.

The initial direct-input results show sensitivity to training seed and preprocessing. A comparison designed to isolate biological topology would also train matched random/rewired recurrent circuits, with matched hyperparameter-search budgets and more training replicas. Three runs and a four-course validation set do not establish general robustness or equal sample efficiency.

## Inspect and reproduce

- [Initial protocol and hashes](results/manifest.json)
- [Tuning protocol and budget](tuned-results/manifest.json)
- [All tuning candidates](tuned-results/candidates.json)
- [Validation-only selection record](tuned-results/selection.json)
- [Initial per-course outcomes](results/benchmark.json)
- [Tuned per-course outcomes](tuned-results/benchmark.json)
- [Compact inference verification](tuned-results/compact-verification.json)
${finalModels.join('\n')}

From the workspace root, using Node 22.18+:

\`\`\`sh
node --experimental-strip-types --test experiments/direct-input/adapter.test.mjs experiments/direct-input/compact.test.mjs
node --experimental-strip-types experiments/direct-input/run.mjs NEW_RAW_OUTPUT_DIRECTORY
node --experimental-strip-types experiments/direct-input/tune.mjs NEW_TUNED_OUTPUT_DIRECTORY
node --experimental-strip-types experiments/direct-input/verify-compact.mjs NEW_TUNED_OUTPUT_DIRECTORY
\`\`\`

The first two runners refuse to overwrite an existing experiment manifest. The final report generator reads the delivered default result directories. No application source changes, dependency installation, deployment, or changes to published checkpoints were needed.
`;
writeFileSync(join(here, 'FINDINGS.md'), text);
console.log(join(here, 'FINDINGS.md'));

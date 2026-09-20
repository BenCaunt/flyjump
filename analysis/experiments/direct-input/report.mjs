import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const directory = resolve(process.argv[2] ?? 'experiments/direct-input/results');
const report = JSON.parse(readFileSync(join(directory, 'benchmark.json'), 'utf8'));
const { manifest, results } = report;
assert.equal(results.length, 15, 'Expected all six trained models on two splits and three untrained controls');
const rows = [];
const paired = [];
for (const split of ['published', 'fresh']) {
  for (const seed of manifest.training.seeds) {
    const direct = results.find((r) => r.kind === 'direct' && r.seed === seed && r.split === split);
    const connectome = results.find((r) => r.kind === 'connectome' && r.seed === seed && r.split === split);
    assert.equal(direct.runs.length, 100);
    assert.deepEqual(direct.runs.map((r) => r.seed), connectome.runs.map((r) => r.seed));
    rows.push(`| ${split} | ${seed} | ${connectome.survived}/100 | ${direct.survived}/100 | ${connectome.meanSeconds.toFixed(3)} | ${direct.meanSeconds.toFixed(3)} |`);
    const counts = { bothComplete: 0, directOnlyComplete: 0, connectomeOnlyComplete: 0, neitherComplete: 0 };
    for (let i = 0; i < direct.runs.length; i++) {
      const d = !direct.runs[i].dead, c = !connectome.runs[i].dead;
      counts[d && c ? 'bothComplete' : d ? 'directOnlyComplete' : c ? 'connectomeOnlyComplete' : 'neitherComplete']++;
    }
    paired.push({ split, seed, ...counts, meanSecondsDifference: direct.meanSeconds - connectome.meanSeconds, meanScoreDifference: direct.meanScore - connectome.meanScore });
  }
}
writeFileSync(join(directory, 'paired.json'), JSON.stringify(paired, null, 2) + '\n');
const trainingRows = manifest.training.seeds.map((seed) => {
  const model = JSON.parse(readFileSync(join(directory, String(seed), 'model.json'), 'utf8'));
  const training = JSON.parse(readFileSync(join(directory, String(seed), 'training.json'), 'utf8'));
  assert.equal(training.history.length, 80);
  assert.equal(training.history.at(-1).episodes, 15680);
  return `| ${seed} | ${model.generation} | ${model.validation.toFixed(2)} | ${training.history.at(-1).episodes.toLocaleString('en-US')} | ${training.wallSeconds.toFixed(2)} |`;
});
const untrainedRows = results.filter((r) => r.kind === 'direct-untrained').map((r) => `| ${r.seed} | ${r.survived}/100 | ${r.meanSeconds.toFixed(3)} |`);
const text = `# Direct observation experiment

Upstream commit: \`${manifest.upstreamCommit}\`. Protocol frozen at ${manifest.createdAt}.

This experiment replaces all connectome computation with the eight unchanged, upstream game-state observations plus eight zeros. It trains the original 16–12–3 controller from scratch using the original CEM algorithm. Nothing in the direct controller uses fly connectivity.

## Held-out results

| Test split | Training seed | Connectome completed | Direct completed | Connectome mean seconds | Direct mean seconds |
| --- | ---: | ---: | ---: | ---: | ---: |
${rows.join('\n')}

Each course has a 180-second limit. The published split is 2100001–2100100; the fresh split is 3100001–3100100. The three connectome checkpoints were reevaluated locally; each published-split rollout reproduced the original stored result exactly. Original connectome training was not repeated.

## Direct training runs

| Training seed | Selected generation | Validation score | Training + validation episodes | Local training seconds |
| --- | ---: | ---: | ---: | ---: |
${trainingRows.join('\n')}

All runs continued through generation 80. Checkpoint selection used only the original four validation courses. No test course was evaluated until all three direct training runs had finished. The three original training seeds and optimizer settings were unchanged. Training times above are local measurements and should not be compared as a hardware-matched speed benchmark with the authors' recorded timings.

## Untrained direct controls, published split

| Training initialization seed | Completed | Mean seconds |
| --- | ---: | ---: |
${untrainedRows.join('\n')}

## Interpretation limits

- Successful direct-controller runs establish that this task can be solved without fly connectivity. Compare all three runs before making a robustness claim.
- The full weight vector has 243 stored/search parameters; only 147 are effective because 96 weights multiply padded zeros. The original controller has 243 potentially effective parameters and an additional fixed recurrent circuit.
- These are three training replicas sharing the same test courses, not 300 independent courses per split. No statistical equivalence or superiority test is claimed.
- The public test results were already known from the source audit. The additional fresh split was declared before this experiment's training and was not used to select checkpoints or settings.
- This compares direct observations with the original connectome system. It does not isolate biological topology from generic recurrence, transformations, or input scaling; a random/rewired reservoir would address that separate question.

## Evidence and reproduction

- [Frozen protocol and file hashes](manifest.json)
- [All per-course results](benchmark.json)
- [Compact results](summary.json)
- [Paired course outcomes](paired.json)
- [Intervention and commands](../README.md)
- Checkpoints and generation logs are stored in each training-seed directory.

Run \`node --experimental-strip-types experiments/direct-input/run.mjs NEW_OUTPUT_DIRECTORY\` from the workspace root, then \`node experiments/direct-input/report.mjs NEW_OUTPUT_DIRECTORY\`.
`;
writeFileSync(join(directory, 'REPORT.md'), text);
console.log(join(directory, 'REPORT.md'));

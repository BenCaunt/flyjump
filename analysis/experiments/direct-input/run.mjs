import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Trainer, TRAINING, episode, randomWeights, rng } from '../../flyjump/src/lib/training.ts';
import { NETWORK, validModel } from '../../flyjump/src/lib/policy.ts';
import { summarize } from '../../flyjump/src/lib/benchmark.ts';
import { ADAPTER_VERSION, setAdapter } from './adapter.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const upstream = resolve(here, '../../flyjump');
const output = resolve(process.argv[2] ?? join(here, 'results'));
if (existsSync(join(output, 'manifest.json'))) {
  throw new Error('Output already contains an experiment. Choose a new directory.');
}
const hash = (raw) => createHash('sha256').update(raw).digest('hex');
const load = (path) => JSON.parse(readFileSync(path, 'utf8'));
const save = (path, value) => writeFileSync(path, JSON.stringify(value, null, 2) + '\n');
const seeds = [20260912, 20260913, 20260914];
const splits = {
  published: Array.from({ length: 100 }, (_, i) => 2100001 + i),
  fresh: Array.from({ length: 100 }, (_, i) => 3100001 + i),
};
const upstreamFiles = [
  'src/lib/connectome.ts', 'src/lib/policy.ts', 'src/lib/training.ts',
  'src/lib/runner.ts', 'src/lib/chromium-engine.js', 'src/lib/benchmark.ts',
  'src/data/connectome.json', 'public/benchmarks/model.json',
  ...seeds.slice(1).map((seed) => `public/benchmarks/replicates/${seed}/model.json`),
];
assert.equal(execFileSync('git', ['diff', '--name-only', 'HEAD'], { cwd: upstream, encoding: 'utf8' }).trim(), '');
const manifest = {
  experiment: ADAPTER_VERSION,
  createdAt: new Date().toISOString(),
  upstreamCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: upstream, encoding: 'utf8' }).trim(),
  sourceHashes: Object.fromEntries(upstreamFiles.map((file) => [file, hash(readFileSync(join(upstream, file)))])),
  experimentHashes: Object.fromEntries(['adapter.mjs', 'run.mjs', 'README.md'].map((file) => [file, hash(readFileSync(join(here, file)))])),
  node: process.version,
  intervention: 'Replace Connectome.step output with eight unchanged upstream observations followed by eight zeros. No recurrence, gain, centering, or extra features.',
  network: { inputs: 16, hidden: 12, outputs: 3, storedParameters: 243, effectiveParameters: 147 },
  training: { ...TRAINING, seeds, checkpointSelection: 'Strict improvement on original four validation courses only' },
  evaluation: { seconds: 180, splits },
  policy: 'Run all three training seeds for exactly 80 generations before evaluating any test course. Report every run. No hyperparameter or checkpoint selection using tests.',
  comparison: 'Original published connectome checkpoints, same three training seeds and same episode budget. Original training is not rerun; inference is reevaluated locally.',
};
mkdirSync(output, { recursive: true });
save(join(output, 'manifest.json'), manifest);
console.log(`Manifest frozen at ${join(output, 'manifest.json')}`);

// Run the original Trainer verbatim, changing only the feature-producing method.
setAdapter('direct');
for (const seed of seeds) {
  const directory = join(output, String(seed));
  mkdirSync(directory, { recursive: true });
  const trainer = new Trainer(seed);
  const start = performance.now();
  for (let generation = 0; generation < TRAINING.generations; generation++) {
    const p = trainer.step();
    const checkpoint = { ...p.model, version: ADAPTER_VERSION, environment: NETWORK.version, inputAdapter: 'raw-zero-pad' };
    // Deliberately incompatible with the original app's connectome-only model loader.
    assert.equal(validModel(checkpoint), false);
    save(join(directory, 'model.json'), checkpoint);
    save(join(directory, 'training.json'), {
      experiment: ADAPTER_VERSION, seed, config: TRAINING,
      wallSeconds: (performance.now() - start) / 1000,
      history: trainer.history,
    });
    if (p.generation === 1 || p.generation % 5 === 0) {
      console.log(`direct seed=${seed} generation=${p.generation} train=${p.bestFitness.toFixed(2)} validation=${p.validation.toFixed(2)} episodes=${p.episodes} elapsed=${((performance.now() - start) / 1000).toFixed(1)}s`);
    }
  }
  assert.equal(trainer.episodes, 15680);
}

console.log('All training completed. Starting frozen-checkpoint test evaluation.');
const results = [];
for (const kind of ['direct', 'connectome']) {
  setAdapter(kind);
  for (const seed of seeds) {
    const source = kind === 'direct'
      ? join(output, String(seed), 'model.json')
      : join(upstream, 'public/benchmarks', seed === seeds[0] ? 'model.json' : `replicates/${seed}/model.json`);
    const model = load(source);
    for (const [split, courseSeeds] of Object.entries(splits)) {
      const runs = courseSeeds.map((courseSeed) => episode(model.weights, courseSeed, 180));
      const result = {
        kind, seed, split, generation: model.generation, validation: model.validation,
        modelSha256: hash(readFileSync(source)), ...summarize(runs), runs,
      };
      if (kind === 'connectome' && split === 'published') {
        const saved = load(join(dirname(source), 'benchmark.json')).results[0];
        assert.deepEqual(runs, saved.runs, `Published connectome results differ for seed ${seed}`);
        result.exactPublishedReproduction = true;
      }
      results.push(result);
      save(join(output, 'benchmark.json'), { manifest, results });
      console.log(`${kind} seed=${seed} split=${split} completed=${result.survived}/${result.courses} meanSeconds=${result.meanSeconds.toFixed(3)} meanScore=${result.meanScore.toFixed(2)}`);
    }
  }
}

// Untrained direct controls are descriptive and never select trained models.
setAdapter('direct');
for (const seed of seeds) {
  const runs = splits.published.map((courseSeed) => episode(randomWeights(rng(seed)), courseSeed, 180));
  results.push({ kind: 'direct-untrained', seed, split: 'published', ...summarize(runs), runs });
}
setAdapter('connectome');
for (const [file, expected] of Object.entries(manifest.sourceHashes)) {
  assert.equal(hash(readFileSync(join(upstream, file))), expected, `Source changed: ${file}`);
}
save(join(output, 'benchmark.json'), { manifest, results });
save(join(output, 'summary.json'), results.map(({ runs, ...row }) => row));
console.table(results.map(({ kind, seed, split, survived, meanSeconds, meanScore }) => ({ kind, seed, split, survived, meanSeconds, meanScore })));

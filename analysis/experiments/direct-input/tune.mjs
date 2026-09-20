import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Connectome } from '../../flyjump/src/lib/connectome.ts';
import { Trainer, TRAINING, episode } from '../../flyjump/src/lib/training.ts';
import { NETWORK, validModel } from '../../flyjump/src/lib/policy.ts';
import { summarize } from '../../flyjump/src/lib/benchmark.ts';

const here = dirname(fileURLToPath(import.meta.url));
const upstream = resolve(here, '../../flyjump');
const output = resolve(process.argv[2] ?? join(here, 'tuned-results'));
if (existsSync(join(output, 'manifest.json'))) throw new Error('Choose a new output directory');
const load = (path) => JSON.parse(readFileSync(path, 'utf8'));
const save = (path, value) => writeFileSync(path, JSON.stringify(value, null, 2) + '\n');
const hash = (raw) => createHash('sha256').update(raw).digest('hex');
const originalStep = Connectome.prototype.step;
const version = 'flydino-direct-affine-v1';
const seeds = [20260912, 20260913, 20260914];
const gains = [0.5, 1, 2, 4];
const splits = {
  published: Array.from({ length: 100 }, (_, i) => 2100001 + i),
  fresh: Array.from({ length: 100 }, (_, i) => 4100001 + i),
};
const manifest = {
  experiment: version, createdAt: new Date().toISOString(),
  upstreamCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: upstream, encoding: 'utf8' }).trim(),
  scriptSha256: hash(readFileSync(fileURLToPath(import.meta.url))),
  intervention: 'Map each of the eight original observations x to gain*(2*x-1), then append eight zeros. No synapses, nonlinear feature transform, memory, or additional observations.',
  gains, tuningSeed: seeds[0], replicaSeeds: seeds.slice(1), training: TRAINING,
  selection: 'Train four affine input gains for 80 generations each on seed 20260912. Choose highest four-course validation score; break ties by earliest selected generation, then smaller gain. Freeze gain before training the other two seeds and before all test evaluations.',
  network: { storedParameters: 243, effectiveParameters: 147, inputs: 16, hidden: 12, outputs: 3 },
  evaluation: { seconds: 180, splits },
  motivation: 'The preceding unchanged-observation baseline had validation scores 1249.25, 2898, and 1155.75. The follow-up tests simple affine scaling, beginning with the same 2*x-1 centering used at the original connectome input.',
  priorExposure: 'Original published benchmark and first direct-input experiment results were inspected before this tuning protocol. The new 4100001–4100100 split is declared here before tuning and is not used for selection.',
  budget: { tuningRuns: 4, additionalReplicas: 2, generationsPerRun: 80, episodesPerRun: 15680, totalEpisodes: 94080, precedingRawExperimentEpisodes: 47040 },
  limits: 'This tuned comparison has additional development compute. Per-run training budgets are equal, but total tuning budgets are not matched. Do not claim equal-budget superiority or statistical equivalence.',
};
mkdirSync(output, { recursive: true });
save(join(output, 'manifest.json'), manifest);
console.log(`Tuning protocol frozen at ${join(output, 'manifest.json')}`);
function setGain(gain) {
  Connectome.prototype.step = function(observations, ablated = false) {
    if (ablated) return Array(16).fill(0);
    assert.equal(observations.length, 8);
    return [...observations.map((x) => gain * (2 * x - 1)), 0, 0, 0, 0, 0, 0, 0, 0];
  };
}
function train(gain, seed, directory) {
  setGain(gain);
  mkdirSync(directory, { recursive: true });
  const trainer = new Trainer(seed);
  const start = performance.now();
  for (let i = 0; i < TRAINING.generations; i++) {
    const p = trainer.step();
    const model = { ...p.model, version, environment: NETWORK.version, inputAdapter: { type: 'affine-zero-pad', gain, formula: 'gain * (2*x - 1)' } };
    assert.equal(validModel(model), false);
    save(join(directory, 'model.json'), model);
    save(join(directory, 'training.json'), { seed, gain, config: TRAINING, wallSeconds: (performance.now() - start) / 1000, history: trainer.history });
    if (p.generation === 1 || p.generation % 10 === 0) console.log(`gain=${gain} seed=${seed} generation=${p.generation} train=${p.bestFitness.toFixed(2)} validation=${p.validation.toFixed(2)} elapsed=${((performance.now() - start) / 1000).toFixed(1)}s`);
  }
  assert.equal(trainer.episodes, 15680);
  return { gain, seed, directory, validation: trainer.champion.validation, generation: trainer.champion.generation };
}
const candidates = [];
for (const gain of gains) {
  candidates.push(train(gain, seeds[0], join(output, 'candidates', String(gain), String(seeds[0]))));
  save(join(output, 'candidates.json'), candidates);
}
const ranked = [...candidates].sort((a, b) => b.validation - a.validation || a.generation - b.generation || a.gain - b.gain);
const chosen = ranked[0];
save(join(output, 'selection.json'), { frozenAt: new Date().toISOString(), rule: manifest.selection, chosen, candidates });
console.log(`Gain frozen by validation: ${chosen.gain}; score=${chosen.validation}; generation=${chosen.generation}`);
const trained = [chosen];
for (const seed of seeds.slice(1)) trained.push(train(chosen.gain, seed, join(output, 'replicates', String(seed))));
save(join(output, 'selected-runs.json'), trained);
console.log('Tuning and replica training complete. Beginning held-out evaluation.');
const results = [];
for (const kind of ['direct-affine', 'connectome']) {
  if (kind === 'connectome') Connectome.prototype.step = originalStep;
  else setGain(chosen.gain);
  for (const seed of seeds) {
    const source = kind === 'connectome'
      ? join(upstream, 'public/benchmarks', seed === seeds[0] ? 'model.json' : `replicates/${seed}/model.json`)
      : join(trained.find((r) => r.seed === seed).directory, 'model.json');
    const model = load(source);
    for (const [split, courseSeeds] of Object.entries(splits)) {
      const runs = courseSeeds.map((courseSeed) => episode(model.weights, courseSeed, 180));
      const row = { kind, seed, split, gain: kind === 'direct-affine' ? chosen.gain : null, generation: model.generation, validation: model.validation, modelSha256: hash(readFileSync(source)), ...summarize(runs), runs };
      if (kind === 'connectome' && split === 'published') {
        assert.deepEqual(runs, load(join(dirname(source), 'benchmark.json')).results[0].runs);
        row.exactPublishedReproduction = true;
      }
      results.push(row);
      save(join(output, 'benchmark.json'), { manifest, selectedGain: chosen.gain, results });
      console.log(`${kind} seed=${seed} split=${split} completed=${row.survived}/100 meanSeconds=${row.meanSeconds.toFixed(3)} meanScore=${row.meanScore.toFixed(2)}`);
    }
  }
}
Connectome.prototype.step = originalStep;
save(join(output, 'summary.json'), results.map(({ runs, ...row }) => row));
console.table(results.map(({ kind, seed, split, survived, meanSeconds }) => ({ kind, seed, split, survived, meanSeconds })));

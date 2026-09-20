# Direct observation control

Protocol recorded before training or evaluating this intervention, 2026-09-20.

Question: can the original Fly Dino readout learn the game when given the existing eight engineered observations directly, without any connectome computation?

Upstream revision: `c08c86bc18efd8125964b1d2ca4fc1df59700f30` from https://github.com/cobanov/flyjump.

## Intervention

The only computational change is replacing `Connectome.prototype.step` inside the experiment process with:

```js
return [...observations, 0, 0, 0, 0, 0, 0, 0, 0];
```

The eight features retain upstream order and normalization. No centering, rescaling, nonlinear transform, recurrent state, extra information, teacher, or action rule is introduced. Zero padding preserves the existing 16–12–3 readout, all original training code, and RNG consumption. This gives 243 stored/search parameters but 147 effective parameters: the 96 weights attached to zero inputs cannot influence the output. Thus this is not an exact effective-capacity match; the direct controller has fewer effective parameters.

Upstream source and published artifacts are unmodified. The process-local method replacement affects both training and evaluation. Models are saved with a distinct version so the original application's connectome-only loader rejects them.

## Fixed training and evaluation plan

- Run all three upstream training seeds: 20260912, 20260913, 20260914.
- Preserve upstream CEM: 64 candidates, 8 elites, 80 generations, 3 shared courses per generation, and all initialization/distribution-update settings.
- Preserve 180-second episodes and validation courses 1100001–1100004.
- Select checkpoints solely through the original strict validation-improvement rule.
- Complete all three runs before evaluating any test course; retain and report every run.
- Evaluate the original 100 test courses, 2100001–2100100, and 100 additional courses, 3100001–3100100, declared here before training.
- Reevaluate the three original published connectome checkpoints on both sets. Assert exact per-course agreement with original published benchmarks.
- Evaluate initial untrained direct controllers on the published split for context.
- No hyperparameter tuning or test-based checkpoint selection in this experiment. If later experiments change settings, keep them separate and disclose their additional budget.

The original test results have already been inspected while auditing the repository. The new split is for an additional check after freezing the intervention, not a claim that the original split was previously unseen by the investigator. Courses are reused across training replicas, so three runs on 100 courses are not 300 independently generated courses. The connectome's original training is not repeated; published checkpoints and logs provide that comparison.

## Reproduce

Requires Node 22.18+ and the upstream checkout at `../../flyjump`; no npm dependencies are required for these headless scripts.

```sh
node --experimental-strip-types --test experiments/direct-input/adapter.test.mjs
node --experimental-strip-types experiments/direct-input/run.mjs experiments/direct-input/results
```

Run from the workspace root. Choose a new output directory when repeating. The runner records the protocol and source hashes before training, logs every generation, stores each validation-selected checkpoint, and exports individual test rollouts and summaries. It checks upstream hashes again at completion.

This can establish whether connectome computation is necessary to obtain strong performance in this particular engineered-observation task. It cannot establish that all connectomes are useless, nor by itself prove statistical equivalence, superiority, or equal sample efficiency across architectures.

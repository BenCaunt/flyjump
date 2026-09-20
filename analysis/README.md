# Fly Dino connectome control experiment

Code audit and reproducible experiments for [cobanov/flyjump](https://github.com/cobanov/flyjump), pinned to commit `c08c86bc18efd8125964b1d2ca4fc1df59700f30`.

The experiment asks whether the original game's trained neural readout can learn from its existing eight game-state observations without any connectome computation. It preserves the upstream environment, CEM training algorithm, and per-run training budget. Initial passthrough results, a separate validation-selected input-normalization sweep, all training replicas, and failed runs are retained.

- [Findings and all comparisons](experiments/direct-input/FINDINGS.md)
- [Initial direct-input protocol](experiments/direct-input/README.md)
- [Initial experiment report](experiments/direct-input/results/REPORT.md)
- [Follow-up tuning protocol](experiments/direct-input/tuned-results/manifest.json)
- [Standalone 147-parameter network](experiments/direct-input/compact.mjs)

## Setup

Requires Node 22.18 or later. No npm install is needed for headless experiments.

From a fresh clone of this fork:

```sh
git clone https://github.com/BenCaunt/flyjump.git flyjump-control
cd flyjump-control/analysis
git clone https://github.com/cobanov/flyjump.git flyjump
git -C flyjump checkout c08c86bc18efd8125964b1d2ca4fc1df59700f30
node --experimental-strip-types --test experiments/direct-input/adapter.test.mjs experiments/direct-input/compact.test.mjs
node --experimental-strip-types experiments/direct-input/verify-compact.mjs experiments/direct-input/tuned-results
```

If this fork is already cloned, start with `cd analysis` and then create the pinned `flyjump` checkout. The extra checkout preserves the original experiment scripts, their recorded hashes, and the exact upstream Git revision used for the experiment.

Run all experiment commands from `analysis/`: references to the "workspace root" in the original experiment documents mean this directory. The compact verification command replays all 600 tuned direct-controller test rollouts, checks their recorded outcomes, and rewrites identical compact checkpoints and verification data; it does not retrain the models. See the findings for commands to repeat training in new output directories and inspect the saved checkpoints, generation logs, and per-course outcomes.

See [publication notes](PUBLICATION.md) for packaging changes and verification. The scripts, training logs, checkpoint weights, and per-course outcomes are retained; machine-local paths in five metadata/log files were shortened for publication.

The intervention addresses necessity for this specific engineered-observation task. It does not establish that biological topology is generally useless or that the alternatives have equal sample efficiency. The tuning stage spends additional search compute and is reported separately from the initially matched experiment.

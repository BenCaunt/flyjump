> Historical v1 record. Not the current environment or model. See [v2](../../experiment.md).

# Fly Jump: training a neural controller for an anatomical fly rig

## What the experiment demonstrates

An artificial feed-forward network learns a runner-control policy from episode scores. Its selected action drives both the runner and the fly keyboard visualization. The UI exposes the actual input vector, tanh activations, signed weighted contributions and three output scores from the most recent inference. The largest raw score wins deterministically. These scores are not probabilities or Q-values. The UI samples decisions at roughly 10 Hz; inference runs at 30 Hz of simulated game time.

This is **neuroevolution using the cross-entropy method (CEM)**, not DQN, PPO, backpropagation, NEAT topology evolution, or biological synaptic plasticity. It solves a reward-based control task by population search over neural weights. For broader context, see [Deep Neuroevolution (Such et al., 2017)](https://arxiv.org/abs/1712.06567) and [Evolution Strategies (Salimans et al., 2017)](https://arxiv.org/abs/1703.03864). Our small CEM implementation is not a reproduction of either paper's algorithm or reported benchmark.

## Environment contract

- Environment version: `flyjump-v1`.
- Deterministic physics: 120 steps/s, gravity 1800 px/s², initial upward velocity 650 px/s. Game speed grows from 280 to 520 px/s.
- Seeded cactus widths/heights and low, middle, high birds. Birds become eligible after eight simulated seconds. Collision terminates an episode.
- Actions: `0=run`, `1=jump`, `2=duck`. The action is held for four physics steps, so decisions happen at 30 Hz. Jump while airborne has no effect. Duck while airborne causes fast fall; grounded duck reduces height and increases width of the collision box. A held jump action can start another jump after landing.
- Human-only early key release also supports short hops. The three-action learned policy uses fast fall to modulate its trajectory; it does not have a separate release-jump action.
- Observation: nearest uncleared obstacle distance, width, height, bottom altitude, game speed, player elevation, vertical velocity and grounded flag. Normalization is defined in `src/lib/policy.ts`. No future spawn seed, action hint or rule-controller output enters the observation.
- Reward/fitness: episode distance / 10 (the displayed game score), capped at 180 simulated seconds. No action-specific reward or expert demonstrations. Early collision ends accumulation.
- The policy sees structured geometry, not pixels. Calling this an image-based or connectome-based agent would be inaccurate.

## Training protocol

Network: 8 inputs, one 12-unit tanh layer and 3 linear outputs. There are 147 trainable scalar weights and biases. Architecture remains fixed.

Each generation evaluates 64 candidates on the same three newly sampled training seeds (range 1–900,000). The eight highest-scoring candidates update a diagonal Gaussian search distribution, with 0.7 update weight and a 0.07 standard-deviation floor. One candidate preserves the previous champion. Fitness is mean score over those three courses.

A generation winner is compared on the fixed validation seeds 1,000,001–1,000,004, each capped at 180 seconds. Strict validation improvement replaces the champion. Validation is part of model selection and is **not** held-out test performance. Training runs for 80 generations, evaluating 15,680 episodes including validation. The published run uses training RNG seed **20260912**; its retained champion came from generation **11**. The population continued optimizing until generation 80 even though the validation champion did not change.

The first prototype used a shorter horizon; the published training uses 180-second courses to include maximum running speed. The test set was first evaluated after this horizon was fixed. The final algorithm and selected model were not changed in response to the held-out results.

The Web Worker executes these rollouts independently of rendering speed. The visible fly plays a separate course with the current champion. It does not show all 64 candidate episodes. Training charts come from actual rollouts, not a timer animation. Stop terminates the worker and retains the last received champion. A checkpoint contains policy weights, not the complete search distribution/RNG state, so importing a model enables inference, not exact optimizer resumption. Train from scratch always starts a new run.

## Published benchmark

100 fixed test seeds **2,000,001–2,000,100**, disjoint from both training and validation. Every policy faces the same courses with a 180-second cap. The rule baseline uses its original 120 Hz control loop; the neural and random policies act at 30 Hz. This is a practical hand-coded reference, not a compute-matched learning algorithm.

| Controller | Completed 180s | Mean survival | Mean score |
| --- | ---: | ---: | ---: |
| Learned network | 54 / 100 | 104.656 s | 4364.914 |
| Rule baseline | 100 / 100 | 180.000 s | 7665.982 |
| Random action | 0 / 100 | 4.961 s | 141.020 |
| Idle | 0 / 100 | 4.892 s | 139.004 |

Raw per-course results include seeds, termination, survival, score, jump/duck counts and action counts. `benchmark.json` also contains the checkpoint SHA-256. `training.json` records the configuration, seed, wall-clock duration and generation-level train/validation scores. CLI timing depends on hardware and is not a browser speed claim.

The learned controller materially outperforms random and idle controls, but the designed rule baseline remains stronger. A 100-course benchmark from **one training run** does not establish robustness across training seeds. Four validation courses are a small selection set; perfect validation does not imply perfect generalization. Repeatedly tuning against these public test seeds would turn them into a development set; use a fresh, declared test range for future tuned versions. Random/idle deaths happen at the first cactus, before birds spawn, so those baselines do not demonstrate skill on aerial hazards.

## What is and is not a fly brain

Flybody provides the anatomical body mesh. MaleCNS provides measured soma positions in the separate atlas tab. The atlas overlay responds to game-image brightness/motion, with no biological receptive-field mapping or inferred firing. The artificial control network does not use MaleCNS connectivity, membrane potentials, synaptic weights, sensory neurons or muscle dynamics. The forelegs visualize discrete game commands through a kinematic animation.

A defensible blog description is: **“I trained a neural controller to play a runner and visualized its decisions through an anatomical fly keyboard rig.”** Training an actual fly connectome would require a different experiment: synaptic connectivity, neuronal dynamics, a justified sensory/motor interface and appropriate biological validation.

## Reproduction and sharing

```sh
npm ci
npm test
npm run train -- 20260912 80
npm run benchmark
npm run build
```

Training and benchmark commands overwrite the public JSON artifacts. The benchmark test verifies that the bundled model reproduces the recorded per-course results. In the UI, select Train from scratch, export the model and learning history, then run Benchmark current model and export its report. Checkpoints are versioned and validated on import; the 147 weights must be finite.

The [live bench](https://flyjump.cobanov.dev/) and repository can be shared with the published model and logs. Attribution requirements in the repository license and third-party notices still apply. This document provides material and evidence for a blog post; it is not an automatically published blog article.

## Related connectome approaches

See [the Doomfly, FlyDoom and fly-craftax source comparison](../../connectome-review.md). Doomfly performs plasticity on reconstructed edges but reports failed learning validation. Fly Jump currently supplies the conventional neural baseline for a future connectome-controlled comparison; it does not run the Doomfly model.

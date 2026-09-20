# Fly Dino: direct-input control experiment

This fork of [cobanov/flyjump](https://github.com/cobanov/flyjump) adds a reproducible control experiment by Ben Caunt. It trains the existing action readout on the same engineered observations without connectome computation. The original application, training implementation, published checkpoints, and upstream documentation below are preserved.

**Result:** one ordinary 147-parameter, 8–12–3 controller completed all 100 published test courses and all 100 additional test courses. Results varied across training seeds; the original connectome system had higher average completion across the three seeds tested. The input-scaling sweep used additional development compute. This demonstrates that strong performance is possible without fly connectivity, but does not establish equal training reliability or that the connectome provides no benefit.

- [Full findings, every training seed, and limitations](analysis/experiments/direct-input/FINDINGS.md)
- [Setup and reproduction](analysis/README.md)
- [Publication notes and verification](analysis/PUBLICATION.md)
- [Successful standalone 147-parameter checkpoint](analysis/experiments/direct-input/tuned-results/replicates/20260914/compact-model.json)

The additions are in `analysis/`; the upstream experiment is pinned to commit `c08c86bc18efd8125964b1d2ca4fc1df59700f30`. This is an independent follow-up, not an upstream endorsement. The original [license](LICENSE), attribution, and third-party notices remain applicable.

---

# Original Fly Dino documentation

**[Open the experiment](https://flydino.cobanov.dev/)** · [Method and evidence](docs/experiment.md) · [Credits](THIRD_PARTY_NOTICES.md)

An 80-cell measured fly connectome circuit drives the **original Chromium Dino** through a learned neural readout. Watch the decisions and computed circuit activity side by side, train from random weights in your browser, and reproduce the benchmark locally.

- Original Chromium engine and sprites, pinned source, jump / short hop / duck / fast fall, genuine collision boxes.
- **8 engineered observations → 80 fixed MaleCNS cells → 16 descending-cell activities → 16–12–3 trained readout → 3 keys.**
- Real cross-entropy neuroevolution (CEM), 64 candidates, 8 elites, 80 generations, 15,680 episodes. Only the 243 readout parameters learn.
- Separate live decision network and anatomical activity view. Colored cells use the exact states that feed the action decoder. Gray atlas cells are unmodeled context.
- Seeded training, import/export checkpoints, learning curves, held-out benchmark and control conditions.

The published checkpoint completed **99/100** held-out 180-second courses (mean survival **179.37 seconds**). The same readout with the circuit silenced completed 0/100; its initial untrained weights also completed 0/100. These results demonstrate learned control and dependence on circuit activity, **not superiority of biological topology**. See per-course results and independent training replicas in [public/benchmarks](public/benchmarks).

## Run and reproduce

Node 22.18 or newer:

```sh
npm ci
npm run dev
# A complete reproducible training run, then independent evaluation:
npm run train -- 20260912 80
npm run benchmark
npm test
npm run check:assets
npm run build
```

The training command overwrites the published checkpoint and log. To preserve them:

```sh
npm run train -- 20260913 80 public/benchmarks/replicates/20260913
npm run train -- 20260914 80 public/benchmarks/replicates/20260914
npm run benchmark:replicates
```

The original run took about 7.6 minutes on the development Mac mini; browser/device speeds vary. Training and evaluation run in a worker and can be stopped. Ordinary gameplay uses frozen weights. Browser-local checkpoints persist on the current origin; Export/Import transfers them across domains or devices.

## Controls

Space / Up / Jump: jump. Release after the minimum jump height for a shorter jump. Hold Down / S / Duck to crouch or drop faster in midair. Manual input takes over. The controller selector returns to automatic play. Manual collisions wait for Restart (or keyboard/canvas jump); automatic modes restart after 1.4 seconds. Pause freezes the game; Stop terminates a background training/evaluation job.

The adapter treats actions as held keys with explicit transitions. Holding Jump does not synthesize browser key-repeat events. This convention is identical in live play and training.

## What is real, and what is modeled?

**Real source/data:** Chromium game code and pixel sprites; MaleCNS v1.0 cell identities, soma coordinates, neurotransmitter annotations and all 1,296 selected directed connections (26,029 synaptic contacts); Flybody anatomical meshes.

**Engineered model:** an explicitly bounded 80-cell subgraph, game-state-to-visual-cell mapping, signed normalized leaky tanh dynamics, artificial trainable action readout and keyboard rig animation. Computed activity is dimensionless, not measured spikes or membrane voltage. The remaining 124,289-cell atlas is anatomical context, not a whole-brain simulation. No biological fly, muscle simulation or internal synaptic plasticity is claimed.

The circuit is selected using anatomy alone. Source hashes, extraction procedure, channel mapping, equations, benchmark split and limitations are in [the protocol](docs/experiment.md). Rebuild scripts are included; the approximately 1 GB raw connectivity table is downloaded separately, not bundled into the website.

## Shared work and attribution

- **The Chromium Authors:** original Dino code and artwork, BSD 3-Clause.
- **FlyEM / HHMI Janelia and MaleCNS collaborators:** measured connectome and anatomy, CC BY 4.0.
- **Turaga Lab / Flybody:** fly anatomy, Apache 2.0.
- **CodeBullet:** Dino structured observations, score-driven neuroevolution and decision-network visualization inspired this integration. CodeBullet uses NEAT; Fly Dino uses CEM. No unlicensed Processing code was copied.
- **aome510/chrome-dino-game-rl:** reviewed DQN alternative; not our implemented algorithm.
- **nftechie/doomfly, liuzihe02/fly-craftax, eganeganegan/flydoom:** connectome learning architecture and experimental-control references. Their methods are distinguished in the [source review](docs/connectome-review.md).
- **de Boer, Kroese, Mannor and Rubinstein:** cross-entropy method tutorial.
- Built with [fly-connectome-template](https://github.com/cobanov/fly-connectome-template) by [Mert Cobanov](https://github.com/cobanov).

Full source pins, transformations and licenses: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Original application/template work retains the [Cobanov Template Attribution License 1.0](LICENSE). Third-party licenses remain separate. Independent project, not affiliated with Google Chrome.

## Deployment

Static Vite application. Existing Cloudflare Pages project and GitHub repository remain named `flyjump`; public branding and canonical URL are **Fly Dino / flydino.cobanov.dev**. Deploy with `wrangler pages deploy dist --project-name flyjump --branch main`. The old `flyjump.cobanov.dev` alias remains compatible.

# Third-party materials and methodological credits

The custom license in `LICENSE` applies only to original template/application work. It does not replace the licenses below. Preserve these notices and source licenses when redistributing this project.

## Code and assets actually reused

### The Chromium Authors: Dino engine and sprites

- Upstream: https://github.com/chromium/chromium
- Tag: **98.0.4758.55**, commit **0b0619d8287f51c4fca09d0385c163d30bd35c4b**.
- Original files: `components/neterror/resources/offline.js`, `offline-sprite-definitions.js`, `images/default_200_percent/offline/200-offline-sprite.png`, and root `LICENSE`.
- License: **BSD 3-Clause**, bundled at `public/vendor/chromium/LICENSE` and linked on the page.
- JS source files under `vendor/chromium` are unchanged. `scripts/build-chromium.mjs` generates an isolated lexical wrapper under `src/lib/chromium-engine.js`. `src/lib/runner.ts` supplies fixed clock/RNG, headless/rendered canvas and host lifecycle hooks. Core game physics, collisions and sprite definitions are original upstream code.
- Hashes and modification boundary: `vendor/chromium/manifest.json`. This is a pinned classic version, not a claim to run the latest Chromium release. No affiliation or endorsement is implied.

### Flybody and visualization foundation

- `public/data/flybody/`: derived Flybody anatomical meshes from https://github.com/TuragaLab/flybody, **Apache License 2.0**. Preserve bundled `LICENSE`, `NOTICE.md` and checksums.
- The browser mesh conversion and scene foundation originate in PinFly / [fly-connectome-template](https://github.com/cobanov/fly-connectome-template), by Mert Cobanov. Original template/application portions retain **Cobanov Template Attribution License 1.0**. The keyboard animation is an application integration, not biological motor control.

## Measured data reused

`public/data/brain-atlas/`, `public/data/connectome/` and `src/data/connectome.json` derive from **MaleCNS v1.0**, **CC BY 4.0**: https://male-cns.janelia.org/download/ and https://creativecommons.org/licenses/by/4.0/.

Data creators: FlyEM / HHMI Janelia, University of Cambridge, MRC Laboratory of Molecular Biology and Google Research. Bundled notices and manifests describe source tables, hashes, filtering and transformations. No invented somata or synaptic edges are introduced. The inferred transmitter signs, engineered game encoder, rate dynamics and action decoder are our modeling assumptions. No dataset-author endorsement is implied.

## Ideas and research reviewed, without copied implementation code

- **CodeBullet**, [Google-Chrome-Dino-Game-AI](https://github.com/Code-Bullet/Google-Chrome-Dino-Game-AI/tree/9d601157baf4de54b20454170af8d276c526e113): structured obstacle observations, score-based neuroevolution, champion replay and live decision-network visualization. CodeBullet implements **NEAT**; we implement **CEM**. No Processing code or assets copied. A repository without an explicit reuse license is treated as a reference, not as code licensed for redistribution.
- **aome510**, [chrome-dino-game-rl](https://github.com/aome510/chrome-dino-game-rl/tree/8a536f6f4e39280a08b70a575cf19c4f1f1c7015): reviewed replay-based DQN training and evaluation alternative. We do not implement its DQN or copy its custom game replica.
- **nftechie**, [doomfly](https://github.com/nftechie/doomfly/tree/71ecf53d78eaffaf1a57ed7b0ccf5d458abc9f33): MaleCNS integration, explicit plasticity experiments and critical validation reporting. Its dopamine-gated KC→MBON rule is not implemented here.
- **Liu Zihe**, [fly-craftax](https://github.com/liuzihe02/fly-craftax/tree/2fe4145b47a30c3daf45447b17832b86dc345dfc): fixed connectome / learned descending readout separation and ablation discipline. Its JAX LIF model and PPO are not ported.
- **eganeganegan**, [flydoom](https://github.com/eganeganegan/flydoom): sparse connectome-constrained rate modeling, bounded subsets and matched-control motivation. Our small TypeScript recurrence is independently written and does not reproduce its full architecture or PPO training.
- **Pieter-Tjerk de Boer, Dirk P. Kroese, Shie Mannor and Reuven Y. Rubinstein**, [A Tutorial on the Cross-Entropy Method](https://people.smp.uq.edu.au/DirkKroese/ps/CEtutorial.pdf): the standard population-search method used for optimizing the readout. We use Gaussian elite fitting with smoothing and a variance floor; no paper code copied.
- [cobanov/awesome-fly](https://github.com/cobanov/awesome-fly): discovery and organization of the connectome research references.

The [review](docs/connectome-review.md) distinguishes these upstream methods from the implemented experiment and its evidence.

## Libraries and fonts

React / React DOM: MIT. Three.js: MIT. Vite and its React plugin: MIT. TypeScript: Apache-2.0. Type declarations and transitive dependencies retain their package licenses. Installed packages contain those license texts. Geist and JetBrains Mono are loaded through Google Fonts under their respective SIL Open Font Licenses, https://github.com/vercel/geist-font and https://github.com/JetBrains/JetBrainsMono.

The public trained checkpoints were generated by this project's documented runs. No third-party pretrained policy, private media, account credentials or deployment secrets are included.

# Fly Jump

A learned neural policy plays a Dino-style endless runner through an anatomical fly keyboard rig. **[Open the training bench](https://flyjump.cobanov.dev/)**.

- Jump, duck, short hops, fast fall, cacti and three bird altitudes. Keyboard and touch controls.
- A real **8 → 12 → 3** neural network chooses **run / jump / duck** at 30 Hz. Watch its observations, hidden activations, connections and raw action scores live.
- **Train from scratch** runs CEM neuroevolution in a Web Worker: 64 candidates, 8 elites, 80 generations. Scores from real game rollouts update weights. No teacher labels or scripted action fallback.
- Export/import checkpoints, export learning curves, and benchmark a checkpoint on 100 held-out courses against rule, random and idle baselines.
- Published artifacts: [model](public/benchmarks/model.json), [training history](public/benchmarks/training.json), [per-course benchmark](public/benchmarks/benchmark.json). Method and limitations: **[experiment notes](docs/experiment.md)**.

The shipped checkpoint completed **54/100** held-out three-minute courses (mean survival **104.7 seconds**). The hand-written baseline completed 100/100; random and idle completed 0/100. This is a small, structured-state benchmark, not a claim of biological learning or general intelligence.

## Controls

Space / Up / Jump: jump. Release early for a short hop. Hold Down / S / Duck: crouch on the ground or fall faster in the air. Manual input takes over from the selected controller. Select Neural network or Rule baseline to return to automatic play. Pause freezes the visible game; Stop ends a background training/evaluation job.

Normal play runs inference with fixed weights. Training happens only when requested. Training shows the current champion in the visible runner while candidate episodes run headlessly in a worker. A completed/local checkpoint is saved on the device; Restore published model returns to the bundled checkpoint.

## Reproduce

Node 22.18+:

```sh
npm ci
npm test
npm run check:assets
npm run build
npm run dev
npm run train -- 20260912 80
npm run benchmark
```

Training and benchmarking overwrite the artifacts in `public/benchmarks/`. The browser and CLI use the same physics, inference and training code. The regression suite reproduces the published per-course benchmark; it does not rerun full training on every build.

Static Cloudflare Pages project: `flyjump`. Production: https://flyjump.cobanov.dev.

## What is biological?

The fly rig uses Flybody anatomy. The separate anatomy tab shows 124,289 classified brain somata from 140,024 measured MaleCNS v1.0 soma positions, preserving native proportions. Its image overlay is illustrative, not firing activity or a biological receptive-field map. The learned 12-neuron hidden layer is an artificial controller; it is **not the fly connectome**, and its input is structured game state rather than camera pixels. No synaptic graph or muscle dynamics is simulated.

Data notices and provenance: `public/data/brain-atlas/NOTICE.md` and `manifest.json`. Flybody retains its Apache-2.0 license and notices. This is an independently written runner with original canvas artwork, not copied Chrome code or sprites; not affiliated with Google Chrome.

Built with [fly-connectome-template](https://github.com/cobanov/fly-connectome-template) by [Mert Cobanov](https://github.com/cobanov).

Original template and application code: [Cobanov Template Attribution License 1.0](LICENSE). Web UI and repository attribution are required. Third-party data and assets retain their own licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

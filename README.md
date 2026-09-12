# Fly Jump

A fly plays an original Dino-style endless runner. [Play at flyjump.cobanov.dev](https://flyjump.cobanov.dev/).

- Opens running with obstacle-distance auto control. Space, Up or tap also jumps; Auto can be disabled.
- Real ballistic jumps, cactus collisions, increasing speed, seeded courses and automatic restart.
- Anatomical Flybody forelegs press one SPACE key using the same command that triggers the jump.
- Real MaleCNS soma atlas with a labeled game-image overlay. No trained policy, neural firing or synaptic simulation is claimed.

## Develop

Node 22.18+. `npm ci`, `npm run dev`. `npm test` checks deterministic physics,
manual collision and 20 seeded three-minute courses with the rule-based controller.
`npm run check:assets` verifies anatomical hashes. `npm run build` writes `dist/`.

Static Cloudflare Pages project: `flyjump`. Production: https://flyjump.cobanov.dev.
This is a separate modified derivative of the template, with original runner
physics, canvas artwork and keyboard rig. No Chrome source code or sprite assets
are copied. Not affiliated with Google Chrome.

## Data and attribution

The atlas contains 140,024 measured MaleCNS v1.0 soma positions; 124,289 classified
brain somata are shown. Native proportions are retained. The fixed-gain image
preview is illustrative and has no biological receptive-field mapping. See
`public/data/brain-atlas/NOTICE.md` and `manifest.json` for exact provenance.
Flybody retains its Apache-2.0 license and notices.

Built with [fly-connectome-template](https://github.com/cobanov/fly-connectome-template) by [Mert Cobanov](https://github.com/cobanov).

Original template and application code: [Cobanov Template Attribution License 1.0](LICENSE).
Web UI and repository attribution are required. Third-party data and assets retain
their own licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

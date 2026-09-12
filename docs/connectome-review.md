# Connectome training approaches reviewed on 2026-09-12

This is a source review, not an independent execution of the upstream neural simulations. It informed Fly Dino v2. Our implementation is a bounded 80-cell rate model with a CEM-trained readout, not a port of any upstream whole-graph simulation.

## Doomfly: plasticity inside the reconstructed graph

Reviewed `nftechie/doomfly` at commit [`71ecf53d78eaffaf1a57ed7b0ccf5d458abc9f33`](https://github.com/nftechie/doomfly/tree/71ecf53d78eaffaf1a57ed7b0ccf5d458abc9f33).

The [live protocol](https://github.com/nftechie/doomfly/blob/71ecf53d78eaffaf1a57ed7b0ccf5d458abc9f33/docs/doom-live-training.md) feeds RGB-derived signals into modeled photoreceptors, propagates activity through the retained MaleCNS graph (166,700 neurons; 25,582,938 directed connections), then applies a fixed descending-neuron/button mapping. The dynamics and sensory/motor mappings are declared model assumptions.

Nonfatal damage produces a 200 ms artificial PPL101 dopamine-cell stimulus. Actual simulated KC and dopamine firing rates drive a baseline-centered anti-Hebbian rule on 4,184 pre-existing KC→MBON11 edges. The [rule implementation](https://github.com/nftechie/doomfly/blob/71ecf53d78eaffaf1a57ed7b0ccf5d458abc9f33/doom_learning_v6/rule.py) uses one-second traces, 1,800-second passive memory decay, a 50 ms efficacy filter and efficacy bounds of 0.1–2 times the original strengths. The [brain integration](https://github.com/nftechie/doomfly/blob/71ecf53d78eaffaf1a57ed7b0ccf5d458abc9f33/doom_learning_v6/brain.py) writes those efficacies back into the sparse graph. This is actual numerical plasticity, not a cosmetic weight animation or PPO.

Its [reported survival pilot](https://github.com/nftechie/doomfly/blob/71ecf53d78eaffaf1a57ed7b0ccf5d458abc9f33/docs/doom-learning-iteration-log.md#completed-survival-pilot) is negative: on one held-out start the learned and timing-shuffled models died at 3.657 seconds while frozen weights reached the 8-second cap. Erasing memory restored the frozen trace. This supports a causal effect of the modeled weight changes, but the observed effect was harmful. The authors explicitly do not claim learned survival; the pilot has only one training replica and two test starts.

The complete graph runs in a Python/C++ service with several GB of RAM; the website is a spectator client. Porting the viewer would not port the simulation or validate the learning mechanism.

## Two other approaches in Awesome Fly

- [fly-craftax](https://github.com/liuzihe02/fly-craftax): its documented training command applies PPO to a linear descending-neuron readout and evaluates ablations on a held-out key. This trains the artificial action decoder attached to the simulated graph, rather than establishing biological synaptic learning.
- [eganeganegan/flydoom](https://github.com/eganeganegan/flydoom): a sparse recurrent model constrained to MaleCNS edges, with fixed-internal, trainable-internal and readout-only modes. PPO and matched random/rewired/MLP/GRU/LSTM comparisons are implemented according to its documentation. Its question is whether measured topology provides a useful inductive bias; it does not presume a positive result. It supports bounded graph subsets, which must be labeled explicitly.

These projects are distinct from `nftechie/doomfly`; similar names do not imply identical methods or evidence.

## Applied in Fly Dino v2

The shipped computation is structured game input → measured 80-cell MaleCNS recurrent circuit → 16 descending cells → trained 16–12–3 readout. Circuit weights remain fixed; CEM optimizes only the action decoder. The anatomy view displays the same computed activity, replacing v1's illustrative image overlay. See the [exact protocol](experiment.md).

The frozen circuit / learned action-readout separation is informed by fly-craftax. Its code at [2fe4145b47a30c3daf45447b17832b86dc345dfc](https://github.com/liuzihe02/fly-craftax/tree/2fe4145b47a30c3daf45447b17832b86dc345dfc) uses a JAX sparse LIF model and PPO, which are not copied or claimed here. Our browser model instead uses a small signed leaky tanh recurrence, informed by flydoom's sparse-rate direction. Doomfly's dopamine-gated KC→MBON plasticity is specifically **not** implemented.

The benchmark includes untrained and circuit-silenced controls and three independent training seeds. It demonstrates real learning and dependence on the modeled circuit. It does not demonstrate a biological topology advantage: matched MLP / rewired-graph training remains an open experiment. The published v1 conventional network used a different environment, so it is not an appropriate matched v2 control.

## Dino training methods reviewed and credited

- **CodeBullet**, [commit 9d601157baf4de54b20454170af8d276c526e113](https://github.com/Code-Bullet/Google-Chrome-Dino-Game-AI/tree/9d601157baf4de54b20454170af8d276c526e113). `DinoGame/Player.pde` uses engineered obstacle distance, dimensions, altitude, player height, speed and obstacle-gap inputs. `think()` selects a network output; fitness is squared score. Its NEAT implementation evolves topology and weights. We reuse the observation/score-search/live-network ideas with our own encoder and CEM implementation. We do not copy Processing code or claim NEAT.
- **aome510**, [commit 8a536f6f4e39280a08b70a575cf19c4f1f1c7015](https://github.com/aome510/chrome-dino-game-rl/tree/8a536f6f4e39280a08b70a575cf19c4f1f1c7015). `train.py` implements replay memory, policy and target Q networks, epsilon-greedy exploration and target updates. This is a useful DQN alternative. Its separate Gymnasium game replica is not used: Fly Dino runs actual Chromium source for consistent gameplay and training.
- **CEM** is a standard population-based optimizer, distinct from both NEAT and DQN. We chose a fixed topology to preserve the measured circuit and use a small trainable readout that can learn inside a browser worker. The algorithm reference is de Boer, Kroese, Mannor and Rubinstein, [A Tutorial on the Cross-Entropy Method](https://people.smp.uq.edu.au/DirkKroese/ps/CEtutorial.pdf).

Upstream project existence or a reported result is not evidence that our particular model works. Our own exported rollouts and ablations provide that evidence. Full reuse boundaries and licenses are in [third-party notices](../THIRD_PARTY_NOTICES.md).

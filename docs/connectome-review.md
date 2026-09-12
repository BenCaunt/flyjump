# Connectome training approaches reviewed on 2026-09-12

This is a source review, not an independent execution of the upstream neural simulations. It informs the next experiment; none of these whole-graph models is currently implemented in Fly Jump.

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

## Implications for Fly Jump

The current CEM network is a **conventional learned baseline**. The anatomy viewer does not make its computation connectome-based. Keep this baseline and the rule/random controls to compare future models on the same runner.

A useful next experiment would route an explicitly defined visual or structured-state encoder through a provenance-tracked MaleCNS graph/subgraph and train a jump/duck/run readout. Display the measured model activity from that computation, not the independent atlas image overlay. Declare whether only the readout, existing graph weights, or both are trainable.

Compare against a frozen model, a parameter-budget-matched conventional network and a rewired graph. Use several independent training seeds and a new held-out test range, because the current public benchmark has already been inspected. A plasticity-specific experiment additionally needs timing-shuffled feedback, memory erasure and cue-conditioning controls. First demonstrate valid cue responses, then improved gameplay. Reproducing Doomfly's weight update alone would not establish that a fly model learned the runner.

This is the proposed next study, not a delivered connectome controller or a validated biological claim.

# Direct observation experiment

Upstream commit: `c08c86bc18efd8125964b1d2ca4fc1df59700f30`. Protocol frozen at 2026-09-20T16:26:17.794Z.

This experiment replaces all connectome computation with the eight unchanged, upstream game-state observations plus eight zeros. It trains the original 16–12–3 controller from scratch using the original CEM algorithm. Nothing in the direct controller uses fly connectivity.

## Held-out results

| Test split | Training seed | Connectome completed | Direct completed | Connectome mean seconds | Direct mean seconds |
| --- | ---: | ---: | ---: | ---: | ---: |
| published | 20260912 | 99/100 | 0/100 | 179.372 | 90.579 |
| published | 20260913 | 85/100 | 95/100 | 174.396 | 177.987 |
| published | 20260914 | 100/100 | 0/100 | 180.000 | 75.828 |
| fresh | 20260912 | 100/100 | 0/100 | 180.000 | 91.374 |
| fresh | 20260913 | 81/100 | 88/100 | 173.331 | 176.567 |
| fresh | 20260914 | 99/100 | 0/100 | 179.202 | 74.929 |

Each course has a 180-second limit. The published split is 2100001–2100100; the fresh split is 3100001–3100100. The three connectome checkpoints were reevaluated locally; each published-split rollout reproduced the original stored result exactly. Original connectome training was not repeated.

## Direct training runs

| Training seed | Selected generation | Validation score | Training + validation episodes | Local training seconds |
| --- | ---: | ---: | ---: | ---: |
| 20260912 | 73 | 1249.25 | 15,680 | 18.21 |
| 20260913 | 43 | 2898.00 | 15,680 | 46.91 |
| 20260914 | 63 | 1155.75 | 15,680 | 31.53 |

All runs continued through generation 80. Checkpoint selection used only the original four validation courses. No test course was evaluated until all three direct training runs had finished. The three original training seeds and optimizer settings were unchanged. Training times above are local measurements and should not be compared as a hardware-matched speed benchmark with the authors' recorded timings.

## Untrained direct controls, published split

| Training initialization seed | Completed | Mean seconds |
| --- | ---: | ---: |
| 20260912 | 0/100 | 4.508 |
| 20260913 | 0/100 | 4.508 |
| 20260914 | 0/100 | 4.492 |

## Interpretation limits

- Successful direct-controller runs establish that this task can be solved without fly connectivity. Compare all three runs before making a robustness claim.
- The full weight vector has 243 stored/search parameters; only 147 are effective because 96 weights multiply padded zeros. The original controller has 243 potentially effective parameters and an additional fixed recurrent circuit.
- These are three training replicas sharing the same test courses, not 300 independent courses per split. No statistical equivalence or superiority test is claimed.
- The public test results were already known from the source audit. The additional fresh split was declared before this experiment's training and was not used to select checkpoints or settings.
- This compares direct observations with the original connectome system. It does not isolate biological topology from generic recurrence, transformations, or input scaling; a random/rewired reservoir would address that separate question.

## Evidence and reproduction

- [Frozen protocol and file hashes](manifest.json)
- [All per-course results](benchmark.json)
- [Compact results](summary.json)
- [Paired course outcomes](paired.json)
- [Intervention and commands](../README.md)
- Checkpoints and generation logs are stored in each training-seed directory.

Run `node --experimental-strip-types experiments/direct-input/run.mjs NEW_OUTPUT_DIRECTORY` from the workspace root, then `node experiments/direct-input/report.mjs NEW_OUTPUT_DIRECTORY`.

# Publication and verification

Published as an independent follow-up by Ben Caunt on 2026-09-20, based on upstream commit `c08c86bc18efd8125964b1d2ca4fc1df59700f30`.

## Packaging

The experiment was completed before this fork was prepared. Its original workspace is copied into `analysis/`, and the root README links to the findings. Upstream application code and published upstream checkpoints are unchanged.

The experimental scripts and their recorded hashes are preserved. Reproduction uses a separate upstream checkout at `analysis/flyjump`, pinned to the original commit. This prevents the publication commit from changing the revision reported by future experiment runs.

Machine-local workspace prefixes were removed from `experiments/direct-input/run.log`, `tune.log`, and the tuned result files `candidates.json`, `selection.json`, and `selected-runs.json`. Their paths now start with `experiments/` and are relative to `analysis/`. No scores, timestamps, training settings, model weights, selection decisions, or per-course outcomes were changed. These five files are not the hashed source or checkpoint inputs recorded in the experiment manifests.

## Verification before publication

- Checked upstream source hashes and original experiment-script hashes against the saved manifest, including the tuning script hash.
- Checked saved model hashes, recomputed completion and score summaries from every per-course outcome, and compared all published-split connectome outcomes with the upstream records.
- Ran the existing adapter and compact-network tests against a clean, pinned upstream checkout.
- Replayed all 600 tuned direct-controller test rollouts with the independent compact implementation. All recorded episode outcomes matched exactly; the replay reproduced the published compact checkpoints and verification file byte for byte.

No new training or tuning was performed for publication. The full initial and follow-up budgets and all training seeds are reported in [the findings](experiments/direct-input/FINDINGS.md).

Built with [fly-connectome-template](https://github.com/cobanov/fly-connectome-template) by [Mert Cobanov](https://github.com/cobanov). See the original [license](../LICENSE) and [third-party notices](../THIRD_PARTY_NOTICES.md).

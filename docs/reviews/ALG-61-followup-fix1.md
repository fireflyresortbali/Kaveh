# Independent review — ALG-61 follow-up, fix round 1

Reviewer: `/root/followup_review`, continuing the independent initial review. Read-only implementation review; no implementation edits, staging, commits, external writes, browser sessions, or device sessions.

Base: `07610df07232bac05a92b915ed3e6f802e85c5de`.
Worktree: `/Users/alireza/.codex/worktrees/kaveh-alg-61-emulator-performance-logs`.
Exact reviewed snapshot: all 15 paths and SHA-256 values in `/private/tmp/kaveh-followup-review-fix1.json`. All hashes matched. Only four files changed since the initial reviewed snapshot: `tests/emulation/run.cjs`, `tests/emulation/runner-test.cjs`, `tests/performance/diagnostic-regression.cjs`, and `tests/performance/harness.js`.

## Findings

No actionable findings remain in the reviewed changes. This is bounded review evidence, not a guarantee of correctness or approval to merge/release.

Both initial P2 findings are resolved:

- **Late readiness incorrectly passed:** the harness now computes timeout independently from render/simulation readiness and requires no timeout for validity. A sample inspected at or beyond the 15-second deadline fails closed even when two renders and positive simulation finally occur. The new `late-ready` fixture explicitly delivers that state at 17 seconds and verifies invalidity/timeout. Healthy, stalled rendering, stalled simulation, and caught production load failure checks continue to pass. This deliberately treats uncertain late timer delivery conservatively.
- **Concurrent host/command failure discarded evidence:** command serialization now walks the bounded cause chain and records each cause's message, code, signal, killed flag, stdout, and stderr. The real-runner fixture combines an injected native command timeout with a host-monitor error and verifies all original command details remain in `failure-command.txt`, along with invalid report status and normal app/server/lock cleanup. The host monitor itself remains separately covered by its fault tests.

Strict warmed resource equality is unchanged. No production gameplay files changed. No new regression was identified in the reviewed fixes.

## Independent checks

Passed with bundled Node 24:

- `tests/performance/diagnostic-regression.cjs`
- `tests/emulation/runner-test.cjs`
- `tests/emulation/host-monitor-test.cjs`
- `tests/performance/routine-test.cjs`

The initial review additionally ran the unchanged report/scenario tests; those files match their prior reviewed hashes.

## Limits and remaining gates

Real desktop, SwiftShader, stress, and three-trial native profiles were being rerun by the implementing agent and were not independently launched or assessed here. They must be recorded for the final corrected snapshot; preceding runtime passes do not substitute for reruns after fixes. The reviewed follow-up document still says those corrected runs are pending. Final evidence/document updates need their hashes reconciled before the checkpoint. Human gameplay where applicable, physical-device qualification ALG-55/57, checkpoint/share permission, merge permission, and publishing permission remain separate. External dependency relations and host power-log/probe evidence were not fetched during this code-only review.

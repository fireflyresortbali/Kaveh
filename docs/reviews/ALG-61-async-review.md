# Independent fix round 2: asynchronous acceptance runner

Reviewed worktree `/Users/alireza/.codex/worktrees/kaveh-alg-61-emulator-performance-logs`, base `7365013efba3caf194b98b598ed32c73096befd4`, frozen snapshot `/private/tmp/kaveh-async-review.json` (34 files). All 34 snapshot hashes and 28 archive checksums matched. No files were edited.

## Finding

**P2 — Recheck the eight-minute deadline after the completion race.** In `tests/performance/run-review.cjs:78-79`, the deadline is checked before each `await Promise.race`, but not after it returns a terminal message. If the completion message wins the race after the nominal deadline while the Node timer callback is delayed, the runner proceeds to validate and accept the result. The 500 ms poll interval limits normal overshoot, but event-loop delay can make it longer. Since this timeout is described as an overall bounded budget, recheck the monotonic deadline immediately after the await and reject late terminal messages; add a regression where a valid completion arrives just after budget expiry. This is only a boundary race; the healthy/failed/stalled/missing/short-payload paths otherwise fail closed.

## Other review results

The `Runtime.addBinding` listener is installed before navigation, progress records are persisted while acceptance runs, and the final result arrives with the terminal binding message rather than another long `Runtime.evaluate`. Desktop and stress paths share `runAcceptance`. The completion path requires `passed === true` and 25 checks; failure, timeout, missing payload and short payload throw. Stress cannot overwrite an invalid acceptance result because the helper throws before its subsequent validity recomputation. The optimization fixture yields after each of 21 effect and 21 auxiliary cycles; check labels and cycle counts remain intact. No production files changed.

The archived Linux attempt at `7365013` is correctly labeled as incomplete: quick/resource checks passed, but the monolithic acceptance evaluation timed out at its 180-second CDP bound without returning an audio or suite result. The archived `async-desktop-02` and `async-stress-02` local runs show passing complete results. The corrected Linux CI run is still needed; local macOS results do not establish Linux behavior.

## Checks run

- Node 24 `tests/performance/diagnostic-regression.cjs` — PASS, including healthy, explicit failure, stalled, missing result and 24-check result cases.
- Node 24 `tests/performance/audio-lifecycle-test.cjs` — PASS.
- `node --check tests/performance/run-review.cjs` and `node --check tests/performance/optimization-checks.js` — PASS.
- `git diff --check` — PASS.
- Verified all 34 snapshot hashes and 28 evidence archive checksums — PASS.
- Reviewed the runner changes, test fixtures, archived failed Linux report and final local desktop/stress evidence.

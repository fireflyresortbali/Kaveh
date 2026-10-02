# Independent fix round 1: ALG-61 resume deadline

Reviewed worktree `/Users/alireza/.codex/worktrees/kaveh-alg-61-emulator-performance-logs`, base commit `a72ad0c44204050f08d7fe944071eee6f38fd08a`, frozen uncommitted snapshot `/private/tmp/kaveh-audio-deadline-review.json` (17 files). Every snapshot SHA-256 matched during review. No files were edited.

## Findings

No actionable findings.

The revised assertion preserves the three-second budget from the rapid event start and judges it using the recorded completion timestamp, so delayed polling alone no longer creates a false failure. A completion after the deadline or no completion still fails. The recorder queues its timestamp check after the wrapped resume promise settles; because the production `await AU.ctx.resume()` reaction is registered after the wrapper's observer and is already queued before the recorder microtask, production's current-epoch continuation clears `AU.resumeAfterHidden` before the recorder checks state. It records only when the operation epoch still matches, the app is active, the pending flag is clear, and the context is running. The reader independently requires matching epoch and healthy current state. Other acceptance checks retain the original generic `until` helper.

The regression fixture covers on-time completion observed late (2,752 ms completion and 5,286 ms poll), late completion (3,001 ms), absent/rejected completion, stale epochs, incomplete flags and suspended state, alongside the existing production-source lifecycle cases. The test's microtask-order case mirrors the production await/observer registration order. The retained Linux report directly supports the correction: the previous candidate had a healthy resume settle at 2,752.1 ms, inside the budget, while the assertion polled at 5,286 ms and failed. Its cause before this instrumented run remains unknown.

## Checks run

- Node 24: `tests/performance/audio-lifecycle-test.cjs` — PASS.
- `node --check tests/performance/audio-lifecycle-test.cjs` — PASS.
- `node --check tests/performance/optimization-checks.js` — PASS.
- `git diff --check` — PASS.
- Verified all 17 snapshot hashes — PASS.
- Reviewed code, production lifecycle source, the archived Linux run, investigation note, and final local desktop evidence.

## Limits

The fixed candidate still needs its corrected Linux GitHub CI run. The retained CI failure is from commit `4e8abfb1154408e0a550cb55befff2f5094d6e55`, not this fix. The attached final desktop evidence is local macOS Chrome and does not substitute for Linux CI or mobile device qualification. I did not query Linear independently; dependency status remains as stated in the parent's review packet.

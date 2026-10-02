# ALG-61 routine performance testing — independent fix round 1

The initial P2 native capture validation finding is resolved. No new actionable findings were identified in the four-file correction. Native current-source measurement and visual qualification remain pending; this is not merge or release approval.

Reviewer: Codex /root/routine_review, continuing the fresh independent review.
Worktree: /Users/alireza/.codex/worktrees/kaveh-alg-61-emulator-performance-logs
Base: a6a25b2d1e31656526954545a29dae8d9d7e59bc
Frozen snapshot: all 161 files in /private/tmp/kaveh-routine-review-fix1-manifest.json; manifest SHA-256 f1649a6500ff2ca5ea05c021b494e06d5d2b6587da0962d6d60bef8d589389dd. All file hashes matched. Exactly four files differ from the initial snapshot: tests/emulation/scenario.js, report.cjs, scenario-test.cjs, report-test.cjs. Game HTML remains 19d75ddb7cfbec373f59e271a99b9c6a4621c5bdddfe1b3e552a3bc681680880.

## Correction verified

- The actual native scenario now requires paused/zero-simulation menu capture and unpaused/advancing-simulation gameplay capture.
- Completion validation independently requires before/after snapshots, finite render/simulation counters, expected pause state, zero menu rendering/simulation, at most one paused redraw with no simulation, and advancing live render/simulation counters. It rejects missing raw/metric objects, inconsistent render sample counts, hidden/truncated/error captures and absent live RAF samples.
- Actual-scenario regression tests now exercise covered-menu simulation and stalled gameplay capture as well as the existing lifecycle faults. Report tests exercise missing and contradictory evidence.

## Independent verification

Ran Node 24.19.0 tests/performance/check.cjs quick: PASS, including syntax, non-writing generated-campaign freshness and all diagnostic/routine/native failure tests. No browser or device was launched or controlled.

Independently loaded historical Android04 and applied mutations through the real routine assess function: removed all capture snapshots/metrics/raw; advanced menu simulation by five seconds; froze gameplay simulation; introduced a visibility change; marked capture truncated. Every case now fails with Incomplete native scenarios. These are validator fault probes, not claims of historical run validity against current game source.

For regression risk, revalidated the six selected historical native reference reports against the stricter validator. Android04/05/06 and iOS10/11 remain complete; retained iOS09 remains incomplete/failed while its three timing captures remain valid. This verifies compatibility with real capture shapes and preserves the historical shader-count failure.

Implementation/game/desktop files are unchanged from initial review. Previously inspected passing current-source desktop, stress and campaign evidence therefore remains applicable to those unchanged systems. Full new native batches using the fixed tooling are still running and need separate evidence/visual review. Human gameplay, live CI, physical-device qualification, dependency confirmation and merge/publish approval remain outside this review result.

No reviewed-file edits, staging, commits, external writes or device actions were performed. This report is outside the frozen snapshot.

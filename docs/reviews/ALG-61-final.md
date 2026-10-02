# ALG-61 independent review — final evidence addendum / fix round 2

No actionable review findings remain in the test/log implementation and corrected evidence presentation. Both initial implementation findings remain resolved, and the contaminated-reference finding from fix round 1 is resolved by replacement evidence and explicit qualification of earlier attempts.

This is not a claim that every mobile stability trial passed. Android's three clean reference trials pass; iOS has two passes and one retained failure. The iOS shader-count stability failure remains an explicitly disclosed investigation item. The strict assertion was not weakened, and this review does not waive it or establish a fully passing optimization/release baseline.

Reviewer: Codex agent /root/emulation_review, continuing the independent review.
Worktree: /Users/alireza/.codex/worktrees/kaveh-alg-61-emulator-performance-logs
Branch: codex/ALG-61-emulator-performance-logs
Base: e64e1b8c258c86209ca75fc57a80e24fdfaeebec
Snapshot: all 151 files and SHA-256 values in /private/tmp/kaveh-alg61-review-final-manifest.json. All hashes matched before and after review. The manifest includes every changed/untracked path. All 118 hashes in the final artifact checksum file also matched.

## Implementation coverage

Implementation, native shell/driver, regression tests and CI hashes are unchanged from fix round 1. Only the overview, visual-qualification guide, comparison/checksum data, added assessment/evidence files and archived review reports changed. No production game change was introduced during the emulator task; the previously reviewed optimization handoff remains the same. HTML SHA-256: 3cf2b7bbea002e58b559a5b04c859a5a286d2f3a488a3608bc4341f450b70651.

The prior independent Node v24.9.0 results remain applicable: all 15 JavaScript syntax checks, non-writing campaign freshness, report validation, four actual-scenario healthy/fault cases, five mocked actual-runner failures and seven existing diagnostic cases passed. Those unchanged tests were not unnecessarily repeated in this evidence-only round.

## Evidence checks performed

- Visually inspected all six selected final screenshots: Android04/05/06 and iOS09/10/11. The game is visible without a native confirmation dialog or fullscreen tutorial overlay. Final screenshots establish visible final state, not continuous visual monitoring throughout every timing interval.
- Verified Android02/03 and iOS04–08 are excluded from baseline eligibility in assessment.json, with the original raw reports retained unchanged. The prior reviewed iOS08 screenshot documents its system overlay. Historical automated success is not presented as sufficient visual qualification.
- Parsed every saved report and incremental event file. Ordered event sequences and JSONL events agree with report.json; stored automated validity agrees with the actual final completeness validator and assessment.json.
- All six reference runs record Node v24.19.0 and tooling hashes matching the reviewed final code, as well as the reviewed game HTML hash.
- Recomputed RAF, render submission, draw-call and triangle p95 values from raw samples; all comparison rows agree. Greater-than-50-ms interval counts also agree. Timing samples are comparable and free of captured game errors, including the timing phase of the later failed iOS09 run.
- Checked raw covered-menu/pause render and simulation deltas, real hidden intervals, playing simulation/render resumption, and paused resumption. Each reference run contains 21 mission pairs and rendered/valid samples. Both XCTest lifecycle logs pass for each selected iOS run.
- Android04/05/06 have constant warmed counts by mission: geometries 302/261, textures 34, programs 28. iOS10/11 have geometries 301/261, textures 34, programs 28.
- Confirmed iOS09's exact reported failure: mission 1 at measured pair index 9 has 27 programs rather than 28, renderedFrames 1 and simulationSeconds 0.002. Geometry/texture counts remain 301/34 there; later measured mission-1 samples return to 28 programs. The run remains valid:false, ends in a fatal benchmark assertion, and is marked FAIL in the primary table and ineligible as a passing baseline. Its screenshot, console, failure-command and native-failure artifacts are retained. Incomplete settling is framed as an unproven hypothesis, not an established cause or a memory-leak claim.
- Read the overview, comparison, assessment and visual-review guide. They distinguish timing capture, full automated result and visual qualification, disclose the failed clean trial near the beginning, and make targeted stability investigation the next action. No stale blanket-pass claim was found in the final overview.

## Limits and handoff

Native execution remains inspected implementer evidence; this reviewer did not launch or manipulate devices, rerun benchmarks or independently diagnose the shader-count outlier. The infrastructure and honest evidence package are reviewable with that failure retained. A claim of a fully passing repeated-load iOS baseline requires investigation and appropriate new evidence. Physical-device performance, battery/thermal behavior, full mobile campaign, packaged offline delivery, touch/audio and human gameplay acceptance remain outside these results.

No implementation edits, staging, commits, external mutations, merge or release actions were performed. Human checkpoint/share approval and later merge/release approvals remain separate. This report resolves the final evidence-review finding without hiding or waiving the failed stability test.

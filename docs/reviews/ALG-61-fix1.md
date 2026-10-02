# ALG-61 independent review — fix round 1

Both initial implementation findings are resolved. No new actionable implementation finding was found. One evidence/documentation finding remains: the saved iOS reference screenshot contains a system confirmation overlay, so the iOS baseline needs clean runs and updated primary comparison/documentation. This review does not approve the current iOS evidence as a clean performance baseline.

Reviewer: Codex agent /root/emulation_review, continuing the independent initial review.
Worktree: /Users/alireza/.codex/worktrees/kaveh-alg-61-emulator-performance-logs
Branch: codex/ALG-61-emulator-performance-logs
Base: e64e1b8c258c86209ca75fc57a80e24fdfaeebec
Snapshot: all 104 paths and hashes in /private/tmp/kaveh-alg61-review-fix1-manifest.json. All hashes matched before and after review. All 73 artifact checksums in docs/performance-results/2026-10-02-emulation/artifact-sha256.json matched. Production HTML remains 3cf2b7bbea002e58b559a5b04c859a5a286d2f3a488a3608bc4341f450b70651.

## Disposition of initial findings

- P2 lifecycle assertion coverage: resolved. The actual injected scenario now checks paused post-resume rendering and simulation deltas, and requires playing simulation to advance. report.cjs independently derives those deltas from raw snapshots. scenario-test.cjs executes the real scenario against healthy, paused-render, paused-simulation and active-simulation-stall cases; the original false-pass faults now fail. report-test.cjs checks contradictory raw data despite a claimed pass.
- P2 failure artifacts: resolved. run.cjs attempts memory/console/screenshot capture on both success and failure before termination, bounds native commands, retains native command failure stdout/stderr, preserves the originating benchmark error when screenshot capture fails, and cleans owned resources. runner-test.cjs executes the actual runner with mocked SDK/network transport for fatal, timeout, screenshot collection failure, XCTest failure and native build failure. These tests passed independently. Device verification guards diagnostics against unrelated device targets.

## Remaining evidence finding

P2 — Replace contaminated iOS reference results before presenting a clean baseline.

Location: docs/EMULATION-BASELINE-2026-10-02.md, Reference runs and Checks and findings; docs/performance-results/2026-10-02-emulation/ios-08/screen.png; comparison.json iOS entries.

During this review the implementer reported a leftover system URL confirmation overlay in iOS runs 04–08. I independently inspected ios-08/screen.png and confirmed the centered “Open in ‘Kaveh Bench’?” dialog covering the game. The JSON counters and XCTest app-state checks pass despite that system UI; they do not prove an unobstructed native test state. The current baseline presents these iOS values as reference runs without this qualification. Keep the original attempts immutable, label their measurement quality separately from automated check validity, obtain clean repetitions with native screenshot inspection, and update the primary comparison and overview. The implementer is already collecting clean evidence with the code frozen. This is an evidence correction, not a new production-code requirement.

## Independent checks

- Inspected every changed implementation/test/doc path relative to the first manifest; confirmed the production game and other unchanged implementation hashes remain reviewed.
- Node v24.9.0: all 15 JavaScript source syntax checks passed.
- node tests/emulation/report-test.cjs passed.
- node tests/emulation/scenario-test.cjs passed all four cases.
- node tests/emulation/runner-test.cjs passed all five failure cases.
- node tests/performance/diagnostic-regression.cjs passed its seven cases.
- node build-campaign.cjs --check passed, without source writes.
- Parsed every saved native report. Every stored valid flag agrees with the final completeness validator; every event sequence is ordered, and each events.jsonl matches report.json events after removing reception timestamps. Earlier invalid iOS attempts remain invalid.
- Recomputed RAF, render-submit and draw-call p95 from raw samples, checked comparison rows against their source reports, and checked the final-run raw hidden/paused/render/simulation deltas.
- Android02/03/04 and ios08 tool hashes exactly match the reviewed implementation. Android02–04 used Node v24.19.0; ios08 used v25.9.0. Earlier iOS05–07 used v24.19.0 and earlier scenario/report/runner hashes, disclosed by the overview. Their raw snapshots pass the stronger final validator, but the system-overlay qualification still applies.
- Visually inspected Android04/screen.png: game scene visible without the iOS-style system overlay. Visually inspected ios08/screen.png: confirmation dialog present.
- Final check: all 104 review hashes unchanged.

Limits: no native device launches, heavy benchmark runs, or device interactions were performed by this reviewer. Native runs are inspected implementer evidence, not independently repeated tests. Clean replacement iOS runs were not yet available in this snapshot. No physical-device, release, battery/thermal, offline, touch/audio, complete mobile campaign or human-playtest claims follow. No implementation edits, staging, commits, external mutations or publication performed.

Next review: provide a new manifest for the changed documentation/evidence and clean iOS runs, preserving the reviewed implementation hashes. An evidence-only addendum can resolve the remaining finding without repeating unrelated source review.

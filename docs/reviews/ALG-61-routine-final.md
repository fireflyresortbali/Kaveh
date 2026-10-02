# ALG-61 routine performance testing — supplemental final evidence audit

No new actionable evidence or implementation-review findings were identified. The fixed routine and honest failed-batch evidence are suitable for the intended draft PR; mobile acceptance remains incomplete. This audit does not waive failures or establish merge/release readiness.

Reviewer: Codex /root/routine_review, continuing the independent initial and fix-round-1 review.
Worktree: /Users/alireza/.codex/worktrees/kaveh-alg-61-emulator-performance-logs
Base: a6a25b2d1e31656526954545a29dae8d9d7e59bc
Frozen target: all 247 files in /private/tmp/kaveh-routine-final-manifest.json, SHA-256 b01dea89fb9f1b1706ec35ae80d50475e770cb31da8a244d57b782b6edd4697f. All hashes matched before and after audit, and no changed/untracked paths were omitted from that manifest.
Game HTML SHA-256: 19d75ddb7cfbec373f59e271a99b9c6a4621c5bdddfe1b3e552a3bc681680880.

## Snapshot and implementation coverage

All implementation and test files are byte-identical to the accepted fix-round-1 snapshot. The sole modified prior file is docs/PERFORMANCE-TESTING.md, which now links the current failed native batches. Added files contain the current validation summary, archived evidence, and verbatim previous review reports/snapshot. Verified that both archived reviewer reports and the archived 161-file fix snapshot are exact copies of their reviewed originals.

The initial P2 finding remains resolved. The prior independently passing Node 24.19.0 quick checks remain applicable; no unchanged runtime tests were needlessly repeated for this evidence-only audit.

## Evidence verified

- Recomputed and matched every one of the 81 artifact checksums in the new archive. Checked all desktop/stress/campaign and corrected native aggregate reports using the actual routine assess function. Stored validity, per-trial exit status and failure reasons agree with current validation.
- Source HTML hashes match current source for every trial that reached game-ready, as do recorded desktop/server/harness and native tooling hashes. The iOS install failure never reached game-ready and is explicitly excluded from gameplay measurement. Aggregate source metadata alone is not treated as proof that its game ran.
- Desktop and stress aggregates pass. Desktop includes 25 acceptance checks; stress includes 42 mission loads and 25 acceptance checks. The campaign report confirms 1,125 checks, 62 memories and 194 stages. Reports remain linked to the current unchanged game source.
- Corrected Android batch contains exactly three planned trials: pass, five-minute completion timeout, five-minute completion timeout. The failed trials end after paused lifecycle and playing background-ready respectively. Both stay invalid with original logs and diagnostics retained.
- Corrected iOS batch contains exactly three planned trials: simctl install failure with zero events, pass, pass. Both passing trials contain complete scenario events and two successful native XCTest lifecycle runs. The install failure's missing native process-memory diagnostic is explicitly recorded in report.json (no PID existed); no substitute value is invented.
- Both native aggregate reports are finished and valid:false, and failed child exits are nonzero. Every saved JSONL event matches the corresponding report event, with ordered sequences. Current isComplete agrees with each trial's validity.
- The earlier Android attempt interrupted for the validation fix remains separately archived, with invalid aggregate/partial logs and an explicitly interrupted invalid child report. It is not counted as one of the corrected three trials.
- Independently viewed all six corrected-trial screenshots. Android trial 1 and iOS trials 2/3 show unobstructed mission 2; Android trial 3 shows unobstructed mission 1 but remains failed; Android trial 2 and iOS trial 1 show their respective home screens and are excluded. These observations agree with assessment.json. A final screenshot does not establish unobstructed presentation throughout an entire capture.
- The validation summary and routine guide prominently disclose both failed mobile batches and unconfirmed causes. They preserve the old iOS09 shader-count failure, distinguish historical source from current source, and require investigation, planned new batches after a justified correction, and human playtesting. They make no mobile speed, physical-device, remote CI, merge or release success claim.

## Limits and next action

No browser/emulator/device was launched or controlled by the reviewer. Native executions remain inspected implementer evidence. Failure causes and the claimed final device shutdown were not independently diagnosed or queried. The complete binary XCTest result bundles remain in the ignored local worktree as disclosed; text lifecycle logs are archived. Live Linear dependency state, GitHub CI and human authorization are supplied context rather than independently checked by this read-only review.

Proceed only with the intended draft review handoff, keeping the Android timeouts, iOS installation failure, historical iOS09 investigation, human playtest and physical-device qualification open. A complete passing mobile baseline has not been established. No merge or publication authorization follows from this report.

No implementation, staging, commit, external-tool or device changes were made. This report is outside the reviewed snapshot. Copying this report and the exact final manifest into the repository verbatim adds review metadata only; implementation coverage continues to refer to the 247-file manifest above.

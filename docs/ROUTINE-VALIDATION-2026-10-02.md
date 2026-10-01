# Routine validation — 2026-10-02

The routine is implemented and the browser checks pass. **Mobile acceptance is
incomplete:** Android had one pass and two timeouts; iOS had two passes and one
installation failure. Keep the PR in draft for failure investigation and human
playtesting. No merge, release, or physical-device performance approval is implied.

Base: `a6a25b2d1e31656526954545a29dae8d9d7e59bc`, including shared courtyard,
model-variant, placement-preview cleanup, campaign unlock and dependency rules.
The integration preserves that work and the earlier reviewed resource/lifecycle
optimization. Generated campaign matches the source.

HTML SHA-256: `19d75ddb7cfbec373f59e271a99b9c6a4621c5bdddfe1b3e552a3bc681680880`.
Node 24.19.0, this Mac's installed Chrome, existing Android Studio AVD
`Kaveh_ALG61_API37`, Xcode iOS 27 simulator `Kaveh ALG61 iPhone 16`.
Exact environment/tool hashes are in each report. The installation failure has
no game-ready source evidence and is not treated as a gameplay measurement.

| Profile / planned trial | Actual result |
| --- | --- |
| `quick` | PASS: syntax, generated freshness, diagnostic/routine/native fault tests |
| `desktop` | PASS: menu 0 renders/0 simulation, pause 1 redraw/0 simulation, active play, effects, 6 loads, 25 acceptance checks |
| `stress` | PASS: 42 loads; warmed geometry/texture/program counts exactly stable per mission; 25 acceptance checks |
| `campaign` | PASS: 1,125 checks, all 62 memories and 194 stages |
| Android corrected trial 1 | PASS; final screenshot unobstructed mission 2 |
| Android corrected trial 2 | FAIL: five-minute completion timeout; final screenshot Android home; last event paused lifecycle |
| Android corrected trial 3 | FAIL: five-minute completion timeout; final screenshot mission 1; last event playing background-ready |
| iOS trial 1 | FAIL: `simctl install` command failed; screenshot iOS home, no scenario events |
| iOS trials 2 and 3 | PASS; final screenshots unobstructed mission 2 |

All three planned trials ran on each platform even after failures. Both aggregates
returned nonzero. The earlier interrupted Android attempt is retained separately
and excluded from the corrected batch. The assertion fix was covered by fresh
complete planned batches, not selective replacement trials. Causes of the timeouts
and installation failure are **unconfirmed**; no source regression, host suspension,
or user action is inferred from a timeout alone. Both owned devices were shut down
after the batches.

[Archived reports, raw events, logs and screenshots](performance-results/2026-10-02-routine/)
include `assessment.json` and SHA-256 `checksums.json`. Local XCTest `.xcresult`
bundles remain in the task worktree's ignored `perf-results/ios-01/`; their text
lifecycle logs are archived. Successful snapshots alone do not qualify a whole
failed batch. Earlier historical emulator evidence and iOS09 shader-count failure
remain intact under the older baseline; they are not substituted for current tests.

## Review and next actions

Fresh independent reviewer `/root/routine_review` checked the full snapshot against
the current base. One P2 found: native menu/gameplay captures did not enforce raw
simulation/completeness gates. Fixed in scenario/report validation with fault tests;
independent fix round 1 found no further actionable implementation findings. See
[initial review](reviews/ALG-61-routine-initial.md),
[fix review](reviews/ALG-61-routine-fix1.md) and
[reviewed 161-file snapshot](reviews/ALG-61-routine-reviewed-snapshot.json).
The snapshot predates these additional verbatim review copies and evidence records;
a final evidence audit maps additions before committing. Live GitHub CI is checked
when the PR opens; these local results do not claim a remote check passed.

Alireza Mohseni authorized the scoped commit, push and PR. Human playtesting,
merge and publishing remain pending. Next actions, in order:

1. Investigate Android timeout phases using preserved native logs and full OS/renderer
   process diagnostics during a targeted reproduction; investigate iOS install failure
   using the exact command error and Simulator diagnostics. Do not increase timeouts
   or rerun until green without establishing a cause.
2. After any justified correction, re-review and run a complete new three-trial batch
   per affected platform, preserving this failed batch. Separately resolve historical
   iOS09 shader-count variation; it was not reproduced in the two completed new iOS
   trials but its original cause remains unknown.
3. Human checklist: play memory 1 and command Siamak; save/reload; switch to memory 2
   and verify the courtyard/companion; pause, background and return (stays paused),
   then resume. Agent fixture tests do not establish game feel or touch/audio quality.
4. Continue busy-battle/render-cost profiling and physical floor/core-device work
   under ALG-55/57 before release budgets or architecture acceptance.

Use [the routine guide](PERFORMANCE-TESTING.md) for the ongoing cadence and commands.

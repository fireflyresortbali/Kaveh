# Performance failure investigation — 2026-10-02

Base: `07610df07232bac05a92b915ed3e6f802e85c5de` on draft PR 6. Production game
source is unchanged; the corrections are in diagnostic sampling and native host
continuity. Prior failed runs remain preserved and invalid.

## Shader-count diagnosis

The failed CI mission-1 snapshot had simulation time 0 and only one rendered frame;
its count was 28 versus 29 after two frames. Historical iOS09 likewise had only
one rendered frame (simulation 0.002 s), with 27 versus 28 programs in that older
source. The production loop refreshes shadows every second frame.

A controlled test on the unchanged game forced a zero-time production loop tick,
then positive ticks, across three mission 1/2 pairs. In both warmed mission-1
repeats, the zero-time frame had 28 programs; the next frame had 29. The newly
present cache entry was `MeshDepthMaterial`, used by ten materials. This directly
reproduces a not-yet-executed shadow pass, not persistent resource growth. The
older iOS report lacks shader identities, so its matching symptom is supporting
evidence, not an independently proven identical shader identity.

The harness now requires two completed renders and positive simulation advancement
before taking a transition sample, with a 15-second readiness deadline. It does
not wait for a target resource count. Exactly stable warmed geometry/texture/
program counts are still required. Fault tests reject stalled rendering, stalled
simulation and falsely declared readiness. Native report schema is now version 2;
old report shapes do not supply this new readiness evidence and remain historical.

## Native interruption diagnosis

The Mac power log records closed-lid sleep at 2026-10-02 04:41:49 +0800, followed
by repeated maintenance sleep and dark wakes. Android trial 2 ran 04:41:47–04:50:46,
and trial 3 ran 04:50:47–05:11:39. Those timeouts occurred during host sleep.
The iOS installation attempt began at 05:20:47 during a brief notification/dark
wake; full lid/user wake was not until 05:24:21, shortly before the command failure
was recorded. Installation therefore ran without continuous host availability;
its old log omitted timeout signal metadata, so no independent Simulator defect
is asserted from that failed command alone.

Native tests now hold a temporary idle-sleep assertion, monitor host heartbeat
continuity after synchronous build setup, and retain `host-continuity.json`.
Scheduling or clock gaps above 15 seconds invalidate the run explicitly.
The helper is scoped to the runner lifetime and is stopped on cleanup. This does
not prevent closed-lid/forced sleep; keep the lid open. Command failures now
preserve exit code, killed flag and signal when supplied by the native command.
Fault tests cover host suspension/clock changes/helper failure and cleanup.

## Desktop resume diagnosis

The first corrected SwiftShader run passed resource checks but failed the old
pause-resume assertion after its fixed 150 ms wait. That renderer can require
longer to complete the positive-time frame. Pause and page resume now wait for
the same render/simulation predicates, bounded at 15 seconds. The existing
no-hidden-time-catch-up predicate and all 25 acceptance checks remain. A focused
test executes the real wait helper and verifies delayed progress, no progress,
readiness after the deadline, and the unchanged default audio deadline.

## Verification

All runs use Node 24.19.0 and unchanged production HTML SHA-256
`19d75ddb7cfbec373f59e271a99b9c6a4621c5bdddfe1b3e552a3bc681680880`.
Raw evidence, screenshots, command logs and hashes are in
[the follow-up archive](performance-results/2026-10-02-followup/).

| Profile / attempt | Outcome |
| --- | --- |
| Final quick | PASS: syntax, generated freshness, diagnostic/native/host/acceptance fault cases |
| Normal Chrome `followup-desktop-03` | PASS: resource checks and all 25 acceptance checks |
| SwiftShader `followup-software-02` | PASS: resource checks and all 25 acceptance checks |
| Stress `followup-stress-02` | PASS: 42 mission loads, exact warmed resources and 25 acceptance checks |
| Android `followup-android-01` | PASS: all 3 planned full trials |
| iOS `followup-ios-01` | PASS: all 3 planned full trials |
| Earlier `followup-software-01` | FAIL retained: resource check passed; fixed 150 ms pause-resume assertion failed |
| Earlier `followup-desktop-01/02`, `followup-stress-01` | PASS retained; superseded by applicable final evidence above |
| GitHub at published head `07610df` | Historical FAIL retained; corrected follow-up CI has not run |

The stress and native runs used the final resource-readiness/host implementation.
After those runs only desktop acceptance wait logic and its quick-test registration
changed. Final normal and software Chrome runs exercise that changed acceptance
suite; native harness/shell/validator hashes match the final implementation.
The complete campaign's preceding 1,125-check pass remains applicable because
production/campaign files are unchanged; it was not rerun for diagnostic-only edits.

All six fresh native screenshots were opened and inspected: unobstructed gameplay,
no system dialog or tutorial overlay. The native reports have all 21 transition
pairs, real playing/paused background-resume, menu/pause and effect checks. Each
host log has a measurement finish and cleanup timestamp, no continuity failures,
and maximum heartbeat intervals of 1,002–1,039 ms (15,000 ms failure threshold).
Final screenshots establish the final visible state, not continuous monitoring.
Raw routine summaries still say visual review pending; this separate assessment
records the completed visual audit without rewriting captured evidence.
Both task-owned devices were shut down after the sequential batch. No emulator,
SDK or runtime was downloaded during this follow-up.

These are passing local emulator regression trials for the measured scenes.
They are not a physical-phone frame-rate, energy, thermal, touch/audio or packaged
offline-app qualification. Random gameplay/adaptive resolution remain enabled;
this is not an optimization before/after speed comparison. Historical failures
remain failed. The shader probe and wrapper source are archived under `diagnosis/`;
the probe contains local paths and is an investigation artifact, not a portable
benchmark entrypoint. The original failed CI reports are retained under `ci-07610df/`.
Binary XCTest result bundles remain local; their text logs are archived.

## Handoff

The follow-up changes diagnostic sampling, resume acceptance observation, host
continuity/error logging, fault tests and workflow/evidence documentation only.
Independent follow-up review records and the final frozen manifest accompany
this change. Human gameplay acceptance, physical-device qualification ALG-55/57,
merge and release remain pending. Next development work after sharing and green
CI: profile busy battles and reduce measured draw-call cost, then qualify the
mobile app pilot on physical floor/core devices before setting performance budgets.

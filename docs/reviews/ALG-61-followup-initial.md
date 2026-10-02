# Independent review — ALG-61 bounded follow-up

Review: initial review, fresh reviewer `/root/followup_review`; read-only implementation review.

Worktree: `/Users/alireza/.codex/worktrees/kaveh-alg-61-emulator-performance-logs`.
Base: `07610df07232bac05a92b915ed3e6f802e85c5de`.
Review target: all 15 changed/untracked files and SHA-256 values in `/private/tmp/kaveh-followup-review.json`. All hashes matched during review. No implementation files were edited.

## Actionable findings

1. **P2 — A transition that first becomes ready after its deadline still passes.**
   File: `tests/performance/harness.js:160–164`.
   The loop stops polling at the deadline, but `settled` tests only render/simulation counts and `settleTimedOut` explicitly becomes false whenever those counts eventually satisfy readiness. If a slow renderer or delayed browser timer completes the second render after 15 seconds, the sample is valid despite exceeding the documented readiness deadline. This matters especially for the software-rendering case this change addresses; desktop runs have no native host monitor to invalidate them. Independent VM reproduction using the real harness and production `startMemory` fixture, with the second timer delivered 16 seconds late, returned `{valid:true, settleTimedOut:false, elapsed:17000, renderedFrames:2}`. Require timely readiness as part of validity and add a fault test where the second render/simulation advancement arrives after the deadline. If late timer delivery makes the exact readiness time uncertain, fail closed or record the readiness time at the actual render completion.

2. **P2 — A concurrent host gap discards native command failure evidence.**
   File: `tests/emulation/run.cjs:139–141` (and command serialization at line 48).
   When an install/launch command times out after a recorded host interruption, the catch block replaces the command error with a new host error. `commandFailure` serializes only top-level `code`, `signal`, `killed`, `stdout`, and `stderr`; from the cause it retains only the message. Thus the precise simultaneous sleep/command-failure scenario this follow-up investigates loses all newly promised command status and output. An independent fixture run through the real runner injected an Android install failure with code 9, signal SIGTERM, killed true and stdout/stderr, together with a host-monitor error. The output was only `COMMAND STATUS: {"cause":"native timeout"}`, followed by empty STDOUT/STDERR. Preserve/serialize the original command error and its cause chain separately from the host interruption. Add an integrated runner fault test for the coincident failures (the existing runner test stubs out the host monitor completely).

## Checks and coverage

Passed independently with bundled Node 24:
- `tests/performance/diagnostic-regression.cjs`
- `tests/performance/routine-test.cjs`
- `tests/emulation/report-test.cjs`
- `tests/emulation/scenario-test.cjs`
- `tests/emulation/runner-test.cjs`
- `tests/emulation/host-monitor-test.cjs`

Inspected all changed files, surrounding runner/report/harness code, and the production render loop. Two completed normal loop renders do cover its alternating shadow-update cadence. Strict warmed resource equality was retained. The standalone monitor tests cover healthy, sleep, backwards clock, helper error, normal cleanup, and non-mac behavior, but integrated monitor-plus-runner failure coverage is absent.

No competing browsers, simulators, or emulators were launched. No production source/build changes were required or made. Desktop/software/native trial results were still pending in the reviewed document and are not certified by this review. Human gameplay, physical-device qualification ALG-55/57, save/share approval, merge approval, and publishing are separate outstanding gates. Dependency claims were supplied by the parent; external Linear relations and probe/power-log evidence were not independently fetched during this read-only code review.

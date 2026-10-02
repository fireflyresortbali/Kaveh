# Routine performance testing

Use Node.js **24**. No package installation is needed. Agents run these commands
from the game checkout and interpret the logs for the human owner. This is a
repeatable development workflow, not a scheduled background task.

| When | Required profile | What it establishes |
| --- | --- | --- |
| Every change, before review | `quick` | Syntax, generated campaign freshness and failure-path regressions |
| Every PR | `desktop` (local and CI) | Actual Chrome gameplay progresses; menus/pause stay idle; effects and warmed mission resources plateau; 25 ownership/lifecycle acceptance checks |
| Rendering, resource ownership, mission loading, lifecycle or game content changes | `stress`, then `campaign` | 42 mission loads, 25 acceptance checks; all 62 memories and 194 objective stages |
| The same changes before mobile acceptance; native shell or mobile runner changes | `mobile` on Android and iOS, sequentially | Three fresh trials per platform, real background/resume, pause, 10 rain cycles and 42 loads per trial |
| Before release/device support promises | Physical-device qualification (ALG-55/57) | Actual minimum/core phones, touch/audio/offline, total memory, sustained frame pacing, 30-minute thermal and energy behavior |

Docs-only changes do not require deep/mobile profiles. Record the reason. A harness
change requires its fault tests and affected real profile; a shell/lifecycle change
requires actual native runs. Historical evidence is not a substitute for testing
changed game content. A draft PR may expose pending mobile qualification, but must
not claim the missing profile passed.

## Commands

Choose a **new output directory** for each invocation. Create the parent first.
The runner refuses to overwrite earlier results. Native runs prevent idle sleep
with a temporary `caffeinate -i` child on macOS and record `host-continuity.json`.
Keep the lid open: closed-lid/forced sleep is not prevented. A host scheduling or
clock gap above 15 seconds invalidates the attempt; it is not a game speed result. `perf-results/` is git-ignored.

```sh
node tests/performance/check.cjs quick
mkdir -p perf-results
node tests/performance/check.cjs desktop perf-results/desktop-01
node tests/performance/check.cjs stress perf-results/stress-01
node tests/performance/check.cjs campaign perf-results/campaign-01
```

Chrome defaults to the standard macOS installation. Set `PERF_CHROME` to an
installed Chromium executable elsewhere. The runner owns a temporary browser
profile and preserves ordinary play saves. The desktop game currently requires
network access for its runtime dependency; failed startup/CDN access is a failure
to complete validation, never a pass. CI uses its installed Chrome and Node 24.
No tests install another emulator or select a user's phone automatically.

Use the **existing Android Studio emulator** and **Xcode Simulator**, with the
owned test devices and prerequisites in [the emulator guide](../tests/emulation/README.md).
Boot one test device at a time, wait for boot, then run:

```sh
node tests/performance/check.cjs mobile android emulator-5556 perf-results/android-01
node tests/performance/check.cjs mobile ios C6F5AB02-132C-43B8-9C10-C1FD02F2DDB4 perf-results/ios-01
```

The IDs above refer to this Mac's dedicated devices. Discover the matching owned
AVD/simulator on another Mac and use its actual ID. The runner checks the owned
name prefix; it refuses physical phones and unrelated devices. It does not create,
boot, or download devices. Each command runs **all three planned trials**, retains
failures, and fails the aggregate if any trial fails. Do not rerun until green or
replace a failing trial with a passing one. If interrupted, the initial invalid
`routine.json` and partial logs remain; interrupted child processes may require
shutting down only the owned test device/browser before a new run.

## Gates and logs

Exit **0** means the requested automated checks passed. Nonzero means failed,
missing, stale or incomplete evidence. Each measured invocation writes:

- `routine.json`: profile, source HTML hash, Git revision, host/Node metadata,
  per-trial result and failure reasons; incomplete by default until finished.
- `summary.md`: readable outcome with links/paths to evidence.
- Per-run JSON: game/tool hashes, browser/OS/WebGL, viewport/DPR, raw samples,
  renderer resource counts, p50/p95/p99/max cadence and CPU submission timing.
- Command logs; native runs additionally preserve JSONL events, screenshots,
  console and native memory diagnostics, including on failures where available.

Strict gates: zero runtime errors, visible/untruncated captures, advancing live
simulation/rendering, **zero menu renders**, at most one paused redraw and no
paused simulation, valid mission transitions (at least two actual renders and advancing simulation,
with a 15-second readiness deadline) and exactly stable warmed resource
counts. The desktop routine checks 10 effects (first warms), then 6 or 42 mission
loads (first pair warms); stress also runs 25 acceptance checks. Mobile uses its
existing strict native lifecycle and 20 warmed-pair checks. Failed assertions are
not relaxed to accommodate a flaky run; investigate and record the cause first.

Open **every native screen.png**, including failures, and record unobstructed or
excluded with a reason in the PR. Automated PASS leaves visual review pending.
System dialogs/tutorial overlays invalidate a comparison even if checks pass.
Log missing diagnostics explicitly. Whole-app/native-process memory is not GPU
memory and may omit separate WebView processes; renderer counters are counts,
not bytes. Synthetic desktop lifecycle checks do not replace native OS tests.

Do not enforce absolute millisecond thresholds on shared CI hosts or compare
Android vs iOS simulator timings as phone speed. RAF cadence is not displayed
FPS; CPU render submission is not GPU time. Random gameplay and adaptive DPR
remain enabled. For performance A/Bs, hold hardware/OS/browser, drawing buffer,
DPR, scenario and timing window constant, use three sequential before/after runs,
include failures and report median plus range of per-run p95/p99 and long intervals.
If rendering resolution changes or the scene differs, classify the comparison as
inconclusive. Device budgets remain provisional until physical floor/core devices
establish repeatable baselines; no automated timing regression budget is claimed.

CI runs `quick` and `desktop` on PRs and retains desktop artifacts for 30 days,
including failed reports. Download/link important before/after evidence in the PR;
archive selected long-lived evidence with checksums under `docs/performance-results/`.
CI jobs running is distinct from branch protection requiring them.

## Current baseline and remaining work

See the [follow-up investigation and measurements](PERFORMANCE-FOLLOWUP-2026-10-02.md)
for the sampling/host-continuity corrections and fresh trials. The original
[routine validation](ROUTINE-VALIDATION-2026-10-02.md) and
[emulator baseline](EMULATION-BASELINE-2026-10-02.md) retain earlier failures;
those attempts remain failed. The targeted probe explains the zero-time CI
shader sample; the older iOS09 report has a matching one-frame symptom but lacks
shader identities. Resource limits have not been weakened.

Native app delivery, busy battles/draw-call reduction and physical-device release
qualification remain separate work. These emulator logs establish correctness
and resource stability for the measured scenarios, not a phone speed budget.

Before sharing, record profile commands/results, environment/source hashes,
independent review, visual review and human gameplay checklist in the PR template.
Alireza Mohseni owns this optimization baseline work (ALG-61). Failed checks block
performance acceptance; owner and next action must be recorded. Human playtesting,
merge approval and publishing approval remain separate gates.

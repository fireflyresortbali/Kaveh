# Android / iOS performance logs on this Mac

This runs the game in test-only Android WebView and iOS WKWebView apps. It uses the
Android Emulator shipped with Android Studio and Apple's Simulator shipped with
Xcode. An AVD is a virtual phone configuration, not a separate emulator product.
No production app architecture, signing account or app-store release is selected.

## What a run measures

Each run writes `report.json` (initially invalid), incremental `events.jsonl` when events arrive,
`summary.md`, native process-memory snapshots and a best-effort screenshot/console log on success or failure. Collection errors are recorded without replacing the original failure. Each event includes
its reception time, sequence and phase. Reports include game/tool/native executable
hashes, OS and web-engine details, viewport, device pixel ratio, adaptive render
resolution, raw frame intervals, p50/p95/p99, CPU render submission time, draw calls,
triangles, renderer resource counts, loading time and JavaScript errors.

The scenarios are: 3 seconds covered campaign menu, 2 seconds gameplay warmup,
15 seconds mission 1, actual app background/resume while playing, 3 seconds pause,
background/resume while paused, 10 rain creation/removal cycles, and 21 pairs of
mission 1/2 loads. The first pair warms caches; the remaining 20 pairs must have
stable geometry/texture/program counts per mission. This is a small regression
suite, not a busy-battle benchmark or a full campaign playthrough.

Acceptance: no continuing covered-menu work; at most one paused redraw; no hidden
simulation/rendering; correct pause/resume state; actual rendered mission loads;
flat warmed resource counts; no caught game errors; all expected phases complete.
There is no emulator FPS threshold that certifies a phone. Raw RAF intervals are
callback cadence, not displayed frames or GPU duration. CPU timings overlap.
Android PSS and iOS host RSS snapshots describe the app process only; they exclude
separate WebView/WebKit/GPU processes and cannot establish total memory or a leak.

## Repeating the test

Agents handle setup and commands. Run one emulator at a time and keep the Mac's
load stable. Use three fresh runs per platform for a reference range, retaining
all attempts, including failures. Gameplay randomness and adaptive resolution
remain enabled, so timing comparisons require matching scene, resolution, runtime,
source hash and host conditions. Compare each platform to its own prior results.

Requirements: macOS Apple Silicon, Node 24, Xcode with an iOS simulator runtime,
Android Studio JBR, Android SDK build-tools 36.0.0 and platform android-35. Defaults
on this machine are `~/Codes/android-tools` and `/Applications/Android Studio.app`.
`ANDROID_HOME`, `JAVA_HOME` and `ADB` can override Android paths. The installed
phone image here is API 37 ARM64, Google APIs Play Store, 16 KiB page size.

Builds and throwaway signing keys stay in the system temporary directory. The test
server binds only `127.0.0.1`; Android uses one task-owned `adb reverse` mapping.
Three.js 0.149.0 is cached locally with a pinned SHA-256, avoiding CDN variation
during measurement. The source game is unchanged. This HTTP delivery path does
not validate packaged offline startup. Test origins/data are isolated from player
saves; Android clears only `io.algorstudio.kavehbench`, iOS uses an ephemeral store.

Use an explicit, booted device named `Kaveh_ALG61_*` (Android) or `Kaveh ALG61 *`
(iOS). The runner refuses physical phones and unrelated virtual devices. Example:

```sh
node tests/emulation/run.cjs android emulator-5556 /absolute/path/new-android-run
node tests/emulation/run.cjs ios SIMULATOR_UDID /absolute/path/new-ios-run
```

Before accepting a reference run, inspect its screenshot for native dialogs or
first-use tutorial overlays. The automated `valid` flag covers JavaScript and
lifecycle assertions; it does not detect all system UI. Exclude obstructed runs
from the performance baseline even when automated checks pass, retain the raw
result, and record the visual assessment separately. Restart only the owned iOS
simulator to clear stale setup dialogs. For a newly created test Android AVD,
confirm the fullscreen tutorial before benchmarking; this task uses
`adb -s DEVICE shell settings put secure immersive_mode_confirmations confirmed`
on its own AVD. This does not alter player devices or other AVDs.

The output directory must not exist; earlier results are never overwritten. A
per-device lock prevents overlapping tests. A force-killed process can leave a
lock in the temporary directory; verify its recorded PID is no longer running
before removing only that stale lock. Normal failure/SIGINT/SIGTERM keeps an
invalid report and cleans the test app, port mapping and lock. The device stays
booted until the agent shuts it down. The runner does not install SDKs, create or
delete virtual devices, or alter an existing user's emulator configuration.

Android uses Home and `am start` for lifecycle checks. iOS uses an XCTest UI test
that activates Settings, waits in the background, and activates the existing game.
It does not inject fake page-visibility events. XCTest logs/result bundles are
saved beside the run. App launch and measurement timeouts fail the run, as do
missing or incomplete results. Native memory sampling failures are reported
separately and do not silently invent a value.

Useful local checks (also safe without simulator access):

```sh
node tests/emulation/report-test.cjs
node tests/emulation/scenario-test.cjs
node tests/emulation/runner-test.cjs
node tests/performance/diagnostic-regression.cjs
node build-campaign.cjs --check
```

## Remaining mobile qualification

Use these simulators for correctness and regression detection. Validate release
builds on physical Android/iPhone floor and core tiers before choosing performance
budgets: busy combat/late missions, cold/warm offline startup, save/relaunch, touch,
audio, interruption/context recovery, 30-minute sustained frame pacing, total
process memory, heat and energy. Compare equivalent scenes for at least three
trials with fixed settings and profiler overhead recorded. Keep physical-device
qualification in ALG-55; emulator evidence belongs to ALG-61.

Apple describes the differences between [simulated and physical devices](https://developer.apple.com/documentation/xcode/running-your-app-on-simulated-or-physical-devices).
Android documents the host-dependent [emulator acceleration](https://developer.android.com/studio/run/emulator-acceleration).

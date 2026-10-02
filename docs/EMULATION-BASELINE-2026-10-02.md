# Mobile emulation baseline — 2 October 2026

Actual Android WebView and iOS WKWebView regression tests now run on this Mac with persistent logs. The clean iOS 09 attempt failed a strict shader-count stability assertion; it is retained as a failed run, not counted as a full pass. These are instrumented emulator regression results, not physical-phone or release certification. Game HTML SHA-256: `3cf2b7bbea002e58b559a5b04c859a5a286d2f3a488a3608bc4341f450b70651`. No production game source changed during this task.

Work: [ALG-61](https://linear.app/algor-studio/issue/ALG-61/run-androidios-emulation-with-repeatable-performance-logs), owner Alireza Mohseni. Branch `codex/ALG-61-emulator-performance-logs`, remote base `e64e1b8c258c86209ca75fc57a80e24fdfaeebec`, explicit handoff of the previously reviewed ALG-53 optimization snapshot. Files are saved locally; checkpoint, sharing, merge and release approvals remain separate.

## Environments

- Android Studio’s existing Android Emulator 36.4.9; task AVD `Kaveh_ALG61_API37`, Android 17 / API 37, ARM64 16 KiB Google Play system image. Pixel 7 display geometry, 1080×2400 at density 420; 2 GiB configured RAM, 4 virtual CPU cores, host GPU. This does not simulate Pixel 7 hardware speed or a low-end phone. WebView 145.0.7632.218. Game viewport 914×411, device DPR 2.625, mobile branch enabled.
- Xcode 27.0, installed stable iOS 27.0 simulator runtime (24A434); task device `Kaveh ALG61 iPhone 16`, UDID `C6F5AB02-132C-43B8-9C10-C1FD02F2DDB4`. WKWebView viewport 852×393, device DPR 3, mobile branch enabled. Renderer reports Apple GPU; this is the Mac’s simulated graphics environment.
- Host Apple M4 Pro, Apple Silicon macOS; OS version, memory, load average and tool versions are in each raw report. Devices ran sequentially. Test-only wrappers use local HTTP and pinned local Three.js 0.149.0, isolated app data and no native game bridge. This is not the final offline mobile app architecture.

## Reference runs

Each gameplay sample lasts 15 seconds after a 2-second warmup. The table shows p95 values; frame intervals are RAF callback cadence and CPU submission time is not GPU duration. Do not compare Android and iOS as if they were equivalent phone hardware. Adaptive resolution and randomness remain enabled.

| Run | Full suite | Node host | RAF p95 ms | Render submission p95 ms | Draw calls p95 | Intervals >50 ms |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| [android-04](performance-results/2026-10-02-emulation/android-04/summary.md) | PASS | v24.19.0 | 16.80 | 3.20 | 1193 | 0 |
| [android-05](performance-results/2026-10-02-emulation/android-05/summary.md) | PASS | v24.19.0 | 16.70 | 3.00 | 1193 | 0 |
| [android-06](performance-results/2026-10-02-emulation/android-06/summary.md) | PASS | v24.19.0 | 16.70 | 3.20 | 1193 | 0 |
| [ios-09](performance-results/2026-10-02-emulation/ios-09/summary.md) | FAIL | v24.19.0 | 18.00 | 3.00 | 1170 | 0 |
| [ios-10](performance-results/2026-10-02-emulation/ios-10/summary.md) | PASS | v24.19.0 | 17.00 | 3.00 | 1170 | 0 |
| [ios-11](performance-results/2026-10-02-emulation/ios-11/summary.md) | PASS | v24.19.0 | 18.00 | 3.00 | 1170 | 0 |

All six planned clean trials use Node 24.19.0 on the host and the final reviewed test code. A comparable timing capture is distinct from passing the complete suite; the iOS baseline is provisional while the failed stability sample is investigated. JavaScript gameplay runs inside the platform WebView. iOS 04–08 passed their automated checks, but are excluded from the performance baseline because final visual review found a leftover system confirmation dialog in run 08. The simulator was shut down and restarted before fresh runs 09–11, whose final screenshots were inspected. Android 02/03 are also excluded because screenshots contain a first-use fullscreen hint. Android 04 is clean; before 05/06 the task AVD explicitly marks that tutorial confirmed. Raw earlier results remain unchanged, and assessment.json records visual qualification and full-suite acceptance separately from the automated valid flag.

## Checks and findings

- Covered campaign menu: zero main renders during each 3-second capture. Ordinary pause: at most one redraw and no simulation advance.
- Real Home/Settings app switches: zero hidden renders and simulation advance; playing resumes both simulation and drawing; paused resume allows at most one redraw and zero simulation advance. iOS uses two XCTest app-activation tests per run; both pass.
- Ten rain creation/removal cycles: stable renderer counts. Forty-two mission loads (one warmup pair plus twenty measured pairs): every load renders; geometry and texture counts stay flat for each warmed mission in the clean trials. iOS 09 has one mission-1 sample at pair index 9 with 27 shader programs, versus 28 in all other measured pairs; later samples return to 28. That sample has only 0.002 seconds of simulated time, suggesting incomplete settling, but the cause is not established. No sustained growth was observed; the assertion correctly leaves the run failed.
- No caught JavaScript errors in the game during clean timing captures. The failed iOS 09 result is a benchmark assertion about shader counts. Native console logs can include platform diagnostics; those are retained rather than represented as an empty native error log.
- Node 24 syntax for 15 scripts, generated campaign freshness, seven existing diagnostic scenarios, incremental report validation, four healthy/fault lifecycle scenarios, and five mocked runner failure cases passed. CI includes these non-device checks. Actual simulator tests are local, not a claimed remote CI result.
- Initial independent review found two P2 gaps in test assertions/failure diagnostics. Fixed paused/active post-resume checks, raw-snapshot validation, best-effort screenshot/console/memory collection before termination, and failed command stdout/stderr retention; added the focused fault tests. The [independent fix review](reviews/ALG-61-fix1.md) resolved both code findings; this final evidence replaces its contaminated primary comparison. Human checkpoint/share and gameplay acceptance remain pending.
- Early iOS attempts 01–03 remain marked invalid: first shell lacked the required UIScene lifecycle; command-line resume then failed to foreground the existing app or showed a confirmation dialog. Replaced that path with XCTest. These setup attempts do not count as performance passes.

## Reading and repeating the logs

Each run directory contains `report.json` with raw samples and hashes, plus a readable `summary.md`. Runs with received events also contain incremental `events.jsonl`. Native process snapshots are supporting evidence, not total WebView/GPU memory. Final screenshots are preserved for all six reference runs; contaminated iOS 08 and Android 02/03 screenshots are retained as evidence of their exclusion. XCTest text logs are included; bulky original `.xcresult` bundles remain under `/private/tmp/kaveh-alg61-runs/` on this Mac. Earlier failed attempts predate the improved failure diagnostics and therefore have fewer artifacts.

See the [benchmark guide](../tests/emulation/README.md) for repeatable agent commands, dependencies, safety boundaries and metrics. Output folders cannot be reused; missing/fatal/timed-out results stay invalid. [Comparison data](performance-results/2026-10-02-emulation/comparison.json) and all raw attempts are saved with this project.

## Next optimization decisions

1. Investigate mission-load settling before treating this as a fully passing repeated-load baseline. iOS 09 proves the failure path retains screenshot, console, command error and native-memory evidence. Keep the strict assertion; distinguish sampling variance from allocation growth with a targeted reproduction.
2. Profile the active render workload on real floor/core phones: approximately 1,200 draw calls including passes is still a substantial submission count to investigate. Test shadows, geometry detail and batching/instancing as separate changes with before/after scene captures; do not infer the bottleneck from simulator timing alone.
3. Add a repeatable busy-battle/late-mission fixture. Current mobile timing covers the opening mission and mission 1/2 resource cycling; the prior full-campaign checks ran on desktop and do not establish mobile campaign acceptance.
4. Continue physical-device qualification in ALG-55: packaged offline startup, touch/audio, interruptions/context recovery, save/relaunch, full process memory, and 30-minute frame-pacing/thermal/energy runs. Only then set release budgets and choose the production app wrapper. Emulator pass does not mean the whole optimization is finished.

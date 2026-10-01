# First optimization pass — 2 October 2026

This pass fixes growing graphics allocations and unnecessary rendering in the existing browser game. It does not qualify an iOS/Android release or complete the full optimization roadmap.

Owner: Alireza Mohseni. Work: [ALG-58](https://linear.app/algor-studio/issue/ALG-58), [ALG-52](https://linear.app/algor-studio/issue/ALG-52), [ALG-53](https://linear.app/algor-studio/issue/ALG-53), [ALG-54](https://linear.app/algor-studio/issue/ALG-54). Branch: `codex/ALG-53-first-optimization-pass`. Base: `e64e1b8c258c86209ca75fc57a80e24fdfaeebec`. Changes are saved locally; checkpoint/share/merge approval remains separate. Current review and approval state is recorded on those issues.

## Changes

- Include the character's full visual specification in its prototype cache key. A companion in memory 2 no longer inherits memory 1's incompatible skeleton.
- Release mission terrain, instanced buffers, unique character/building resources, expired effects, discarded previews, and story backgrounds. Protect app-owned geometry, material and prototype caches, including resources shared across the three renderers.
- Retain one invariant environment render target and dispose its generation intermediates. Reuse the tower texture. Scale a shared rubble cube instead of caching randomly sized cubes indefinitely.
- Clear retained projectile/selection pools at mission reset. Capture and dispose partially built landscapes if generation fails.
- Stop recurring world frames under the campaign screen and while hidden; draw a static paused backdrop only when invalidated. Suspend audio timers/context, reset clocks on return, clear transient input, and preserve pause/mute choices. Keep pending audio-resume intent across rapid hide/show changes. Visibility handling follows the [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API).
- Add a finite full-campaign browser runner, resource/lifecycle acceptance checks, failure-injection checks, and a non-writing generated-campaign freshness check. CI now checks freshness and diagnostic failure reporting; real browser/device validation remains a separate command.

The landscape/environment owner deliberately retains global textures and reusable caches until app shutdown. Renderer counts therefore plateau above zero. New per-instance textures must acquire an explicit owner; merely attaching one to a material is not sufficient for automatic disposal.

## Measured evidence

Instrumented headless Chrome 154, macOS, Apple M4 Pro / ANGLE Metal; requested window 960 × 640, browser viewport 960 × 553, devicePixelRatio 1, desktop game branch. Adaptive resolution remains enabled. Runs are unseeded. Counts are renderer allocations, not bytes, VRAM or whole-process memory. RAF intervals are callback cadence, not GPU duration or displayed FPS. No battery, thermal, phone or WebView measurements were made.

The before build includes only the character-cache crash correction so mission transitions can finish. A crashing clean-main run would not be a valid performance comparison.

| Scenario | Before | After |
| --- | --- | --- |
| Campaign screen, 5 seconds | 300 world renders | 0 world renders |
| Pause screen, 5 seconds | 300 world renders | 1 invalidation frame; no recurring draws |
| 10 rain effects, after each expires | Geometry count rises 268 → 277 | 217 after every cycle |
| Three memory 1/2 pairs, final memory 2 | 971 geometries / 51 textures | 266 geometries / 36 textures |
| 20 warmed memory 1/2 pairs | Not run before; shorter run already grows | Memory 1: 301 geometries; memory 2: 266. Both: 36 textures / 29 programs, unchanged throughout |

One pair warms the caches; the following 20 pairs are compared by mission. The automated guard permits a maximum range of two allocations; the measured ranges were zero. Transition settle times were 1,000 ms before and 300 ms after, so the last-row repeated equivalent-state plateau is the stronger regression evidence. The repeated effect tests explicitly render allocations and retirement because the optimized paused game intentionally has no continuous renderer.

Opening gameplay RAF p95 stayed about 16.7 ms on this computer. CPU submission time varies across these short runs; this is not evidence of a general gameplay FPS improvement. The measured improvements are stopped idle work and bounded repeated allocations.

Raw evidence:

- [Before diagnostic](performance-results/2026-10-02-optimization-before.json)
- [After stress and 25 acceptance checks](performance-results/2026-10-02-optimization-after.json)
- [Full campaign runtime](performance-results/2026-10-02-optimization-campaign.json)

Each browser report records the game HTML SHA-256, tooling hashes, source base and dirty state. The before report identifies earlier harness versions; it is historical evidence rather than a claim that those tools equal the final test package.

## Verification

- Full campaign: 62 memories, 194 stages, 1,122 assertions, no captured runtime errors. Fixtures exercise objective logic, rendering, economy, gates, combat timing and save restoration; they do not establish campaign balance or game feel.
- Resource stress: 42 mission loads (one warm pair plus 20 measured pairs); 20 warmed cycles of all seven effect types; repeated story and portrait creation; shared resources survive removal of another character.
- 25 resource/lifecycle assertions, including static paused resize, zero hidden simulation/render work, canceled long press/input, mute/pause preservation, audio suspension and recovery, rapid page switching and bounded audio scheduling.
- The audio assertion waits up to three seconds for the asynchronous context transition. An initial 150 ms assertion failed intermittently; an isolated rerun passed. The bounded wait prevents treating asynchronous completion latency as a synchronous guarantee.
- Visibility/page events in the acceptance fixture are synthetic. Real iOS/Android suspension, interruptions, browser autoplay policy, and WebView integration are still unverified.
- Node 24.19.0: all 10 JavaScript sources parse; campaign freshness passes; seven diagnostic fault/healthy scenarios pass. A disposable-copy test confirms stale generated output is rejected without modification and accepted after regeneration.
- Independent review and human playtest are required before integration; current outcomes belong to the linked Linear issues and review packet. Local test success is not a remote CI result.

## Reproduce

Use Node 24 and a local Chrome/Chromium installation. The runner creates its own temporary browser profile and loopback origin, removes that profile on exit, and does not use the player's normal saves. On platforms other than macOS, set `PERF_CHROME` to the executable path. Internet access is currently required for the pinned Three.js CDN dependency.

```sh
node build-campaign.cjs --check
node tests/performance/diagnostic-regression.cjs
PERF_CAMPAIGN=1 node tests/performance/run-review.cjs /tmp/kaveh-campaign.json
PERF_STRESS=1 node tests/performance/run-review.cjs /tmp/kaveh-stress.json
```

`PERF_ACCEPTANCE=1` runs only the targeted resource/lifecycle acceptance suite. Without a mode variable, the runner produces a shorter diagnostic, not the full stress gate. Run browser suites sequentially when comparing timing. Output begins as `valid:false`, preserves partial evidence on failure, and exits nonzero for failed assertions, startup/CDP failures, fatal runtime errors or a missing campaign report. Campaign execution is bounded to 15 minutes after startup; CDP calls have a separate 180-second timeout. Never accept a stale JSON file or a missing report as a pass.

For ordinary play, serve the checkout separately from the fixture server. Start memory 1, move units, place/cancel a building, pause/resume, mute audio and switch away/back, then save and reload. Expect stable controls, no time jump, preserved mute/pause choices and restored progress. A local URL works only on the computer serving it.

## Integration and remaining work

Ariel's courtyard-house work (`claude/ALG-50-persian-courtyard-house`) and archer-hero work (ALG-59) are separate. Preserve their design and variant-aware bake keys when combining changes. Rebuild the campaign, repeat affected tests, and refresh review after integration. This work does not grant approval to commit, push, merge or publish those changes.

The next performance decision is [ALG-55](https://linear.app/algor-studio/issue/ALG-55): package a minimal cross-platform app pilot and measure on representative physical Android/iPhone tiers. Use the benchmark protocol attached to [ALG-51](https://linear.app/algor-studio/issue/ALG-51); its reviewed local handoff supplied these diagnostic tools and remains a separate integration dependency. Decide the delivery path from sustained frame-time, process memory, startup, battery/thermal and input/lifecycle evidence. Then tune shadows, density/resolution, simulation/pathfinding or startup only where those profiles identify a bottleneck (ALG-56), and perform release qualification (ALG-57). No physical-device performance claim follows from this desktop pass.

# ios emulator benchmark

Status: **INCOMPLETE / FAIL**
Started: 2026-10-01T19:44:36.173Z

| Scenario | RAF p95 (ms) | CPU render submission p95 (ms) | Main renders |
| --- | ---: | ---: | ---: |
| campaign-menu | idle | idle | 0 |
| mission-1-gameplay | 19.00 | 3.00 | 900 |

- Emulators use Mac resources: not phone FPS, GPU timing, battery or thermal qualification.
- Instrumented, random gameplay with adaptive resolution; compare only matching scenarios and settings.
- Renderer resources are counts, not GPU bytes. Native app memory excludes separate web/GPU processes.
- Local HTTP test shell; not bundled offline release, store build, device floor, touch or audio acceptance.

Failure: Missing real hidden/visible events: playing
requireCheck@http://127.0.0.1:57718/:3192:75
lifecycle@http://127.0.0.1:57718/:3206:19
@http://127.0.0.1:57718/

See report.json for environment/source hashes and raw samples; events.jsonl for incremental events.

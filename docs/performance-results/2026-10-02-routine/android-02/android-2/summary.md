# android emulator benchmark

Status: **INCOMPLETE / FAIL**
Started: 2026-10-01T20:41:47.448Z

| Scenario | RAF p95 (ms) | CPU render submission p95 (ms) | Main renders |
| --- | ---: | ---: | ---: |
| campaign-menu | idle | idle | 0 |
| mission-1-gameplay | 66.80 | 37.30 | 354 |
| paused-menu | idle | 10.50 | 1 |

- Emulators use Mac resources: not phone FPS, GPU timing, battery or thermal qualification.
- Instrumented, random gameplay with adaptive resolution; compare only matching scenarios and settings.
- Renderer resources are counts, not GPU bytes. Native app memory excludes separate web/GPU processes.
- Local HTTP test shell; not bundled offline release, store build, device floor, touch or audio acceptance.

Failure: Benchmark completion timed out after 5 minutes

See report.json for environment/source hashes and raw samples; events.jsonl for incremental events.

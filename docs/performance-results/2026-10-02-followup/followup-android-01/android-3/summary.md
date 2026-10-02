# android emulator benchmark

Status: **PASS (emulator checks only)**
Started: 2026-10-02T05:48:30.517Z

| Scenario | RAF p95 (ms) | CPU render submission p95 (ms) | Main renders |
| --- | ---: | ---: | ---: |
| campaign-menu | idle | idle | 0 |
| mission-1-gameplay | 16.70 | 3.30 | 900 |
| paused-menu | idle | 2.40 | 1 |

- Emulators use Mac resources: not phone FPS, GPU timing, battery or thermal qualification.
- Instrumented, random gameplay with adaptive resolution; compare only matching scenarios and settings.
- Renderer resources are counts, not GPU bytes. Native app memory excludes separate web/GPU processes.
- Local HTTP test shell; not bundled offline release, store build, device floor, touch or audio acceptance.

See report.json for environment/source hashes and raw samples; events.jsonl for incremental events.

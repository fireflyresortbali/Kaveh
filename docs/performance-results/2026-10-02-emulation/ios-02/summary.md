# ios emulator benchmark

Status: **INCOMPLETE / FAIL**
Started: 2026-10-01T19:42:49.662Z

| Scenario | RAF p95 (ms) | CPU render submission p95 (ms) | Main renders |
| --- | ---: | ---: | ---: |
| campaign-menu | idle | idle | 0 |
| mission-1-gameplay | 17.00 | 3.00 | 882 |

- Emulators use Mac resources: not phone FPS, GPU timing, battery or thermal qualification.
- Instrumented, random gameplay with adaptive resolution; compare only matching scenarios and settings.
- Renderer resources are counts, not GPU bytes. Native app memory excludes separate web/GPU processes.
- Local HTTP test shell; not bundled offline release, store build, device floor, touch or audio acceptance.

Failure: requireCheck@http://127.0.0.1:57615/:3192:75
lifecycle@http://127.0.0.1:57615/:3206:19
@http://127.0.0.1:57615/:3233:20

See report.json for environment/source hashes and raw samples; events.jsonl for incremental events.

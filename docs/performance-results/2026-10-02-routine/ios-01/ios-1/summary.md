# ios emulator benchmark

Status: **INCOMPLETE / FAIL**
Started: 2026-10-01T21:20:47.490Z

| Scenario | RAF p95 (ms) | CPU render submission p95 (ms) | Main renders |
| --- | ---: | ---: | ---: |

- Emulators use Mac resources: not phone FPS, GPU timing, battery or thermal qualification.
- Instrumented, random gameplay with adaptive resolution; compare only matching scenarios and settings.
- Renderer resources are counts, not GPU bytes. Native app memory excludes separate web/GPU processes.
- Local HTTP test shell; not bundled offline release, store build, device floor, touch or audio acceptance.

Failure: Command failed: xcrun simctl install C6F5AB02-132C-43B8-9C10-C1FD02F2DDB4 /var/folders/g0/r64175x948392nsx0pyfl8g80000gn/T/kaveh-alg61-shells/ios/KavehBench.app


See report.json for environment/source hashes and raw samples; events.jsonl for incremental events.

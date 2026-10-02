# ALG-61 routine performance testing — initial independent review

One actionable P2 finding remains. No additional actionable game-integration or desktop-routine findings were identified in this review. This is not approval to merge or release.

Reviewer: fresh Codex reviewer /root/routine_review, without implementation-chat history.
Worktree: /Users/alireza/.codex/worktrees/kaveh-alg-61-emulator-performance-logs
Branch: codex/ALG-61-emulator-performance-logs
Base: a6a25b2d1e31656526954545a29dae8d9d7e59bc
Snapshot: all 161 files in /private/tmp/kaveh-routine-review-manifest.json, manifest SHA-256 0a83a18c691c03800ea1628c1c999de4cebdd6860d0dc163b6a11a0ea7fc0ace. Every file hash matched at the start and end of review. Game HTML SHA-256 19d75ddb7cfbec373f59e271a99b9c6a4621c5bdddfe1b3e552a3bc681680880.

## Finding

[P2] Enforce native capture simulation and completeness gates from raw snapshots.

Locations: tests/emulation/scenario.js:49–54 and tests/emulation/report.cjs:47–48; consumed by tests/performance/check.cjs:18.

The menu assertion only checks equal render counters and the gameplay assertion only checks increasing render counters. Neither checks simulation advancement (zero in the covered menu, positive in gameplay) or the expected pause state. isComplete then accepts each capture solely on its label and comparable flag. Thus a regression that updates simulation behind the campaign menu, or stalls simulation during the 15-second gameplay sample but resumes after backgrounding, can complete all native trials and receive PASS. The later lifecycle checks establish only the post-resume interval and do not cover either earlier capture. This contradicts the routine's strict idle/simulation gates. The completion validator also treats captures missing their raw snapshots as complete.

Independent reproduction, without changing any reviewed file or running devices:
- Executed the actual scenario.js using the existing scenario-test.cjs VM fixture, adding five seconds of simulation during campaign-menu capture while retaining zero simulation advancement in mission-1-gameplay capture. Both the scenario and isComplete accepted it. The existing healthy fixture already has zero gameplay-capture simulation advancement.
- Loaded archived Android04's successful report, deleted before, after, metrics and raw from every capture, then invoked the new wrapper's assess({platform:'android'}, report, 0, reportSourceHash). It returned [] (no failures).

Recommended correction: validate finite raw before/after counters and expected pause states for all three native captures, enforce menu zero renders/zero simulation, paused at most one redraw/zero simulation, and gameplay positive render/simulation deltas. Have completion validation independently enforce these requirements along with visible, untruncated and error-free capture evidence rather than trusting comparable alone. Add actual-scenario and report/wrapper fault tests for covered-menu simulation, stalled gameplay capture and missing/contradictory snapshots. Retain failed/partial measurements and rerun a full planned native batch with the changed tooling.

## Checks and evidence

- Read applicable AGENTS.md and team guide, inspected repository identity, branch/base, remote and worktrees. Reviewed full production diff and surrounding ownership/lifecycle code, campaign source/build integration, routine/diagnostic/emulation source and tests, native shell/driver code, CI, cadence and evidence documentation. Large unchanged embedded asset literals were not manually decoded.
- Ran /Users/alireza/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/performance/check.cjs quick under Node 24.19.0: PASS (syntax, non-writing generated campaign freshness, diagnostic failures, routine failures, native report/scenario/runner failures). Initial default Node 25.9.0 invocation correctly refused the unsupported version.
- Independently ran the two native false-pass reproductions described above. No browser/emulator launched or controlled.
- Inspected completed current-source reports under perf-results/desktop-01, stress-01 and campaign-01: aggregate reports are valid:true and finished, game hashes match the frozen snapshot; campaign reports 62 levels and 194 stages. These are inspected implementer measurements, not independently repeated browser tests.
- Parsed all 17 historical native report files and compared their events with corresponding JSONL; they agree, including missing/failed runs. Historical iOS09 remains invalid. Read prior independent-review evidence; did not requalify every archived screenshot. The routine guide explicitly marks old HTML-hash native evidence stale for current source.
- New native measurements are still pending/in progress and do not establish current-source mobile acceptance. The implementer has agreed to retain partial evidence, correct the finding, and rerun planned batches.

## Limits

No live Linear dependency/ownership read was performed by this reviewer; owner and dependency readiness are supplied review-packet evidence. ALG-55/57 physical-device qualification remains a separate finish/release gate. No human gameplay acceptance, actual GitHub CI execution, native visual review of the new batches, or phone-speed/thermal/battery qualification is claimed. No implementation edits, staging, commits, pushes or external writes were performed; this review file is outside the reviewed snapshot.

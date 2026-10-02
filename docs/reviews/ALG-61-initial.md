# ALG-61 independent review — initial round

Two actionable P2 findings remain. This is a review of the test tooling and inspected evidence, not physical-device qualification.

Reviewer: fresh Codex agent /root/emulation_review, without implementation-chat history.
Worktree: /Users/alireza/.codex/worktrees/kaveh-alg-61-emulator-performance-logs
Branch: codex/ALG-61-emulator-performance-logs
Base: e64e1b8c258c86209ca75fc57a80e24fdfaeebec
Snapshot: all 27 paths and SHA-256 values in /private/tmp/kaveh-alg61-review-manifest.json. Hashes matched before and after review; tracked plus untracked changed paths match the manifest exactly. HTML SHA-256: 3cf2b7bbea002e58b559a5b04c859a5a286d2f3a488a3608bc4341f450b70651.

## Findings

### P2 — Validate rendering and simulation after the app resumes

File: tests/emulation/scenario.js:31 (also report.cjs lifecycle validation).

For the paused lifecycle case, resumedCorrectly only checks that after.paused is true. A regression that restarts continuous rendering or advances simulation while preserving the paused flag passes this check. The ordinary pause capture happens before the background/resume cycle, so it cannot catch this. The playing branch similarly checks rendering but not whether simulation restarted. This leaves a direct gap in the requested pause/resume and zero-idle-work acceptance.

Independent VM fault injection below executed the actual frozen scenario.js with a controlled fake perfReview and visibility events: after the paused resume it injected 30 renders and +0.5 simulation seconds. The scenario still emitted complete/passed, and the actual isComplete(events) returned true. This is a synthetic test of assertion coverage, not device evidence.

Correction: assert no post-resume simulation advancement and at most one invalidation redraw while manually paused; assert actual simulation progress as well as rendered frames when playing resumes. Add focused healthy/fault regression cases and make final report validation reject contradictory raw snapshots. A stable post-resume observation window should remain bounded.

### P2 — Collect native failure diagnostics before terminating the app

File: tests/emulation/run.cjs:110-124.

The screenshot and Android console capture occur only after await done succeeds. A fatal scenario event, completion timeout, or launch failure jumps directly to log.finish(error), then terminates the app. Thus the runs where a stuck load, native crash, or failed lifecycle transition is most useful to inspect have no screen capture or Android native console artifact. The provided failed iOS attempts demonstrate absent screenshots; current control flow retains this failure-path gap. Incremental JSON/failure text are retained, but do not replace the missing native state. The README promises a screenshot for each run, and the review acceptance explicitly includes failure artifacts.

Correction: perform best-effort, bounded diagnostic capture for both success and failure before app termination, recording collection errors without replacing the original failure. Preserve stdout/stderr for failed native build/lifecycle commands as well (the current lifecycle .txt write happens only on command success). Add a mocked runner failure/timeout test that verifies invalid status, native artifact attempts, and owned-resource cleanup without requiring a device.

## Review and independent checks

- Read AGENTS.md and docs/TEAM-WORKFLOW.md; inspected actual root/remote, branch/status/history/worktrees.
- Inspected complete tracked code diff, all new emulator files, diagnostic injection and harness surroundings, native shells/driver/build setup, report validation, workflow changes and documentation. No changed long embedded-asset lines were omitted.
- Verified handoff integrity against /private/tmp/kaveh-optimization-review-manifest.json: all inherited files retain the previously reviewed hash except the explicitly scoped README, workflow, and performance/server.cjs changes. Inspected those differences. Prior independent review remains relevant to the unchanged optimization snapshot.
- Node v25.9.0: syntax checks passed for every manifest .js/.cjs/.mjs file.
- node build-campaign.cjs --check passed without changing source.
- node tests/performance/diagnostic-regression.cjs passed all seven healthy/fault scenarios.
- node tests/emulation/report-test.cjs passed.
- Actual scenario VM fault injection reproduced the false pass above.
- Inspected Android android-01 and iOS ios-04 report/event data; both pass the actual final completeness validator, identify the reviewed HTML hash, include three captures, two real visibility cycles, ten effect cycles and 21 transition pairs. Both show zero covered-menu renders/simulation, one ordinary pause redraw, zero simulation/render change across roughly 3.1 seconds hidden, and one paused-resume redraw in these recorded healthy runs. Warmed main resource count ranges are zero for each mission. Android counts: mission 1 302 geometries, mission 2 261, 34 textures and 28 programs. iOS: mission 1 301 geometries, mission 2 261, 34 textures and 28 programs. Inspected ios-01/02/03 invalid reports and their available artifacts.

Limits: native evidence above is implementer-supplied Node 25 runs; final Node 24 repeats were in progress and are not claimed as reviewed here. I did not launch a browser/emulator, disturb devices, rerun native benchmarks, or independently repeat the full campaign. No physical hardware, phone performance budget, thermal/battery, release/offline delivery, audio, touch or human playtesting is established. No implementation edits, staging, commits, external mutations or publication were performed.

## Reproducer for finding 1

Run from the reviewed worktree. This uses the real scenario and report validator, without a browser/device or source edits. Expected output on the reviewed snapshot is postResumeRenders:30, postResumeSimulation:0.5, resumedCorrectly:true, finalKind:'complete', reportWouldPass:true. Turn this into healthy/fault cases when fixing the assertions rather than retaining the false-pass expectation.

```js
const fs = require('fs'), vm = require('vm'), assert = require('assert/strict');
const {isComplete} = require('./tests/emulation/report.cjs');
(async () => {
  let paused = true, renders = 0, sim = 0, handler, resumedPause = false;
  const events = [];
  const snap = () => ({paused, completedMainRenders:renders,
    simulationSeconds:sim, errors:[],
    renderers:{main:{geometries:1,textures:1,programs:1}}});
  const ctx = {
    EMULATION_ENDPOINT:'/test', console, AbortSignal,
    performance:{now:() => 0},
    document:{hidden:false, addEventListener:(n,h) => handler=h,
      removeEventListener:() => handler=null},
    R3:{getContext:() => ({getExtension:() => null,getParameter:() => null})},
    setTimeout(fn,ms) {
      if(ms===500 && resumedPause) { renders+=30; sim+=0.5; }
      queueMicrotask(fn);
    },
    fetch:async (url,o) => {
      const e=JSON.parse(o.body); events.push(e);
      if(e.kind==='background-ready') {
        ctx.document.hidden=true; handler();
        ctx.document.hidden=false; handler();
        resumedPause=paused;
      }
      return {ok:true};
    },
    perfReview:{
      snapshot:snap,
      ready:async () => ({source:{htmlSha256:'fixture'}}),
      capture:async label => {
        const before=snap();
        if(label==='mission-1-gameplay') renders+=30;
        return {label,comparable:true,before,after:snap()};
      },
      start:async () => {paused=false; return {};},
      pause:() => {paused=true;},
      effectCycles:async () => Array.from({length:10},snap),
      transitions:async () => [1,2].map(id => ({id,valid:true,...snap()}))
    }
  };
  const original=ctx.setTimeout;
  ctx.setTimeout=(fn,ms) => {
    if(ms===500 && !paused) renders+=30;
    original(fn,ms);
  };
  await vm.runInNewContext(fs.readFileSync('tests/emulation/scenario.js','utf8'),ctx);
  const bad=events.find(e=>e.kind==='lifecycle'&&e.data.label==='paused').data;
  console.log({
    postResumeRenders:bad.after.completedMainRenders-bad.resumed.completedMainRenders,
    postResumeSimulation:bad.after.simulationSeconds-bad.resumed.simulationSeconds,
    resumedCorrectly:bad.resumedCorrectly,
    finalKind:events.at(-1).kind,
    reportWouldPass:isComplete(events)
  });
  assert.equal(isComplete(events),true);
})();
```

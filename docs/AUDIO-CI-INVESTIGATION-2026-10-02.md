# Rapid audio lifecycle CI investigation

Base: `463a9c8860a5144d323c0601e5e6f6cf52689171`, draft PR 6, ALG-61.
Human owner: Alireza Mohseni. Lightweight diagnostic worker: gpt-6-luna.

## Finding and correction

The original Linux Chrome CI failure only recorded the assertion label:
`rapid hide/show preserves pending audio resume`. It did not record context state,
queued operation status or elapsed time. Its exact cause remains unproven.

A controlled test using the actual production `refreshAppActivity` source shows
a separate acceptance weakness: immediately after a rapid hide/show burst,
`AudioContext.state` can still be `running` from before the pending suspend.
The old state-only predicate could pass before the intended resume happened.
The corrected predicate additionally requires `AU.resumeAfterHidden === false`,
which the current lifecycle epoch clears after successful resume.

The existing 3-second deadline remains. Production audio/game files are unchanged.
The acceptance test temporarily observes suspend/resume calls and their resolution
or rejection, records a compact timeline on success and failure, and restores the
original method property descriptors in `finally`. Failure details include elapsed
time, current audio state, activity epoch/flags and scheduler status. This makes
a subsequent CI failure diagnosable without assuming a root cause or widening a
threshold. All 25 acceptance checks remain; no prior failures are relabeled.

## Tests and limits

- Actual-source lifecycle fixtures pass synchronous and microtask-separated bursts,
  slow suspend/resume and a second hide during an in-flight resume.
- The shipped acceptance predicate rejects the stale running state and suspended
  state. The real wait helper retains late/stalled failure behavior and emits
  diagnostic data. Mocked WebAudio scheduling is a focused regression check, not
  proof of every browser implementation or audible output.
- Software Chrome acceptance passes 25/25. A deliberate 6x CDP CPU-throttled
  software-Chrome run also passes 25/25, with final rapid-resume observation at
  27 ms and the final resume promise settled at about 7 ms.
- Final quick and full normal desktop results are recorded in the archive.
- The first sandboxed browser launch failed; its reports remain retained. The
  environment was corrected with an authorized unsandboxed browser launch.
- Full campaign, resource stress and native batches are not rerun: production,
  resource harness and native scenario/runner files are unchanged. Desktop is the
  affected real profile; prior deeper results retain their previous scope.

Evidence: [raw reports and checksums](performance-results/2026-10-02-audio/).
The copied CPU-throttle runner records the experimental method and local paths;
its report metadata hashes the standard runner, so the copied experimental runner
and archive checksum are required to identify the actual experiment. CPU throttling
is a scheduling experiment, not a mobile performance benchmark or exact Linux CI
replica. No new emulator installation or physical-device claim is involved.

## Next gate

The local test correction and added diagnostic evidence do not establish that the
original CI failure is resolved. Run the corrected candidate on Linux GitHub CI
and inspect the audio timeline. Any new failure must remain visible and guide an
evidence-supported fix; do not retry until green. Independent review precedes the
checkpoint/share gate; merge and release remain separately unapproved.

## Instrumented Linux result at a72ad0c

[GitHub run 36977658696](https://github.com/fireflyresortbali/Kaveh/actions/runs/36977658696)
passed quick and strict resource checks but retained an audio acceptance failure.
Its new trace shows final resume settled at **2,752.1 ms**; context was running,
`resumeAfterHidden` was false and app/schedulers were active. The polling assertion
ran only at **5,286 ms**. Thus this run failed because the observer was late despite
a successful resume inside the 3-second budget. The exact source of the host delay
is unproven; do not equate CPU render submission with GPU time or phone performance.
The uninstrumented older failure still lacks its own state/timing evidence.

The correction uses a recorded completion time for the current lifecycle
operation, preserving the actual 3-second deadline from the rapid-event start.
The recorder runs in a microtask after the production resume continuation and
accepts only the current epoch with a cleared pending flag and running context.
The assertion still requires that healthy current state when it observes the
record. Generic wait/deadline behavior for other checks is unchanged.

Actual-helper regression tests replay 2,752 ms completion observed at 5,286 ms
and require a pass; completion at 3,001 ms and missing/rejected completion fail.
They also exercise the shipped completion recorder/read predicate, rejecting stale
epochs and unhealthy states. This distinguishes completion from polling latency
without allowing audio itself to exceed the budget. Final quick and desktop
results are in the accompanying archive; corrected Linux CI remains the next gate. [Retained CI evidence](performance-results/2026-10-02-audio-ci/ci-a72ad0c/).

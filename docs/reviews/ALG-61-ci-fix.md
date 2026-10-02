# ALG-61 CI fresh-checkout correction — independent fix round 2

No actionable findings. Adding `mkdir -p perf-results` before the existing desktop routine correctly fixes the observed missing-parent failure without weakening validation or overwriting run evidence. Actual GitHub CI success is not yet established.

Reviewer: Codex /root/routine_review, continuing independent review; last allowed implementation fix-review round.
Worktree: /Users/alireza/.codex/worktrees/kaveh-alg-61-emulator-performance-logs
Base / current HEAD: d2e115088764d0779b6e36bfc10e298fe505ad6f (draft PR 6).
Snapshot: /private/tmp/kaveh-ci-fix-manifest.json; sole changed file .github/workflows/game-checks.yml SHA-256 180a730e370616dbdbdcc557dabb5ec623c62816709b86999a9e9dd417c32049. Hash matched; status/diff confirms exactly the one added workflow command.

Reviewed the supplied actual CI log: Node/Chrome setup reaches the desktop command, then check.cjs runBatch fails with ENOENT creating perf-results/ci. The routine intentionally creates only a new leaf directory and requires its parent to exist, as documented. The workflow now supplies that prerequisite. It preserves strict shell exit handling, the unchanged desktop command, and always-run artifact upload with missing evidence treated as an error.

Independent safe check under Node 24.19.0 used a disposable temporary directory and the actual runBatch function. The original absent-parent case reproduces ENOENT; the added mkdir command permits both planned child-command attempts and initial/final evidence creation. Injected child failures still produce valid:false, and a second run against the same output still throws EEXIST. No browser, emulator or external service was launched or changed.

Game, runners, acceptance gates and prior measured source are unchanged. Previous local evidence remains applicable; both mobile batches and historical iOS09 remain unresolved and unwaived. Push the scoped correction only under the supplied approval, observe the actual new CI result, and retain draft status with remaining acceptance/playtest gates. This review does not claim remote CI passed, authorize merge, or authorize publication.

No implementation edits, staging, commits or external writes were performed. This report is outside the snapshot; copying it verbatim into the repository adds review metadata only.

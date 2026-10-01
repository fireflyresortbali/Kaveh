# Working together on the Shahnameh game

## For both contributors

Ask for an outcome: “Make building placement easier to cancel,” “Fix villagers
getting stuck,” or “Where are we, and what can we each work on next?” You do not
need Git commands. Your agent handles the technical steps and explains decisions.

For each feature, expect a short plan, a playable preview when gameplay changes,
independent agent review, and a small checklist of what to try. Tell the agent what
worked and what did not. Do not approve simply because an agent says it passed.

| Agent asks to… | What this means | Changes the shared development version? |
| --- | --- | --- |
| Save a local checkpoint | Create a commit on the task branch; files were already on disk | No; not an off-device backup |
| Send for review | Push the branch to GitHub and open/update a pull request | No |
| Add to the shared development version | Merge the reviewed change into main | Yes |
| Publish a release | Make the game available through its release/deployment destination | Separate action |

Example: “The building controls are ready. Checks and independent review passed.
Try placing and canceling a building in this preview. May I save a local checkpoint
and send it for review? The shared development version will stay unchanged.”

Later: “You confirmed the controls work and the checks passed. May I add this
feature to the shared development version?”

Permission for a checkpoint can include two later rounds of review fixes and their
commits/pushes. The agent must explicitly offer this and record your answer. It
never includes unrelated changes, merging, or publishing.

## Shared project locations

- [Development: Kaveh — Game Development](https://linear.app/algor-studio/project/kaveh-game-development-11123399e83b) — project `P-ALG-4`.
- [Art: Kaveh — MVP Shahnameh Art Production](https://linear.app/algor-studio/project/kaveh-mvp-shahnameh-art-production-71faee7b2fd6) — `P-ALG-2`.
- [Technical review: Kaveh — Cross-Platform Technical Review](https://linear.app/algor-studio/project/kaveh-cross-platform-technical-review-94f43c7815ab) — `P-ALG-3`.
- [GitHub: fireflyresortbali/Kaveh](https://github.com/fireflyresortbali/Kaveh).

All projects use the ALGOR Studio team, key `ALG`, ID
`8caab758-ec32-4826-b2cd-8b269eab527a`. Verify the connected workspace before writing.
Keep existing art/review issues where they are; link implementation dependencies.
Linear is the source of current work status; GitHub is the source of code/review
history. The repository holds durable instructions, not a second live task board.

## One task, start to finish (agent procedure)

1. Inspect the actual Git root/remote, branch, status, worktrees, and Linear issue.
   Check existing issues before creating one. Identify the human owner reliably;
   the tool account is not automatically the owner on a shared login.
2. Record requirements, acceptance criteria, owner, agent/session, planned files or
   systems, dependencies, branch, base revision, and next action. Record a claim and
   reread before editing. A conflicting claim needs coordination, not last-write-wins.
3. Fetch the remote base when available. Start independent work in a clean task
   branch/worktree; use a dependency branch only deliberately and record it. Reuse
   the same task branch for continuation. Never switch a checkout another agent uses.
4. Implement a small coherent change. Coordinate overlapping systems even across
   separate computers. For technical conflicts, preserve both behaviors, integrate
   in the task worktree, then repeat affected checks/review. Never force-push shared
   history or resolve product disagreements silently.
5. Run the relevant checks below. Freeze edits and request independent review using
   the prompt below. Address findings, with at most two fix-and-review rounds. Report
   remaining findings rather than endlessly iterating or hiding them.
6. Provide the preview/playtest checklist. Before committing, propose only this
   task's files/hunks and commit message(s); summarize tests, review, and limitations.
   Obtain the explicit save/share approval described above. This gate also applies
   to documentation/setup work. Do not use `git add .` as a shortcut.
7. After authorization, commit/push/open a PR using the template. Link the issue in
   the PR and the PR in Linear. Map the reviewed snapshot to the committed changes;
   if content changed, refresh review. Attach created PRs to the Codex chat when
   that capability is available. Follow-up commits obey the recorded approval scope.
8. Before merging, check the current PR head, merge-base changes, required checks,
   review evidence, findings, and playtest result. Refresh affected checks/review
   after conflict resolution or integration changes. Obtain human merge approval
   for the current changes; a new head after approval requires reconfirmation.
9. After confirmed merge, record the merge SHA and move the code issue to Done.
   Do not claim release/publication. Retain worktrees with uncommitted/unpushed work;
   clean up only once needed work is preserved and the task is complete.

### Linear updates and handoffs

Use Backlog for ideas, Ready for Spec for clarification, Ready for Agent for agreed
acceptance criteria, In Progress for active work, Needs Review for agent/human
review or approval (say which), Done for accepted merged code, and Blocked with a
specific obstacle and next action. Non-code work may finish when its agreed artifact
is accepted. Preserve other people's ownership, priorities, and specialist issues.

Update at meaningful events: a decision, blocker, changed scope, completed review,
validation result, approval boundary, or handoff. Do not copy transcripts. Report
only checks actually run, with environment and revision. Do not post secrets or
private chat history to issues/PRs. Consider the destination's audience before
copying internal project details into a PR.

If Linear is unavailable, say so and keep a local note at
`docs/handoffs/<issue-or-task>-<session>.md` in the task worktree. Include time,
owner/session, branch/base, planned areas, progress, decisions, tests, review
revision, approvals, and next action. Do not automatically commit this fallback.
Continue safely isolated already-assigned work; ask before overlapping work when
ownership cannot be checked. Never claim the issue was created/claimed/updated.
Once access returns, reconcile against current Linear state, sync once, record that
it was synced, and retire the temporary note after preserving needed evidence.

## Deciding what blocks what

Use Linear's native **blocks / blocked by** relations so dependencies are visible
on both issues. A sentence saying “wait for art” is not enough. The dependent issue
must say which artifact or decision it needs and how we know that input is ready.
This is a coordination procedure maintained by agents when invoked, not a background
scheduler or an enforced lock. The existing Blocked status alone does not encode
which issue is responsible.

### Decision procedure for each issue

1. Read its intended behavior and acceptance criteria, linked designs/decisions,
   relevant code/interfaces, and existing relations in all three game projects.
   Identify actual inputs: a merged interface, tested save format, accepted asset
   contract, measured device budget, or human product decision.
2. For each missing input, ask: **Can we start this work correctly without it? Can
   we finish and verify it without it?** If neither depends on it, there is no hard
   dependency. An input already available needs satisfaction evidence, not a new
   waiting state. Do not infer dependencies from issue titles or priority alone.
3. Classify the relationship below. Reuse the issue that owns the input. If no issue
   exists, record the concrete missing input first; create a narrowly scoped issue
   only for an established requirement, not speculative work. Leave unknown ownership
   explicit and ask the team; don't automatically assign it to the other person.
4. For a confirmed dependency where B needs A, add **A blocks B** by adding A to
   B's `blockedBy` relations (or the equivalent native UI action). Do not overwrite
   unrelated links. Before adding, follow existing downstream `blocks` links from B:
   if A is reachable, the new A → B edge would create a cycle. Reject self-links too.
   If the graph cannot be read completely, leave the proposal unconfirmed. Reread
   after writing to catch conflicting concurrent changes; Linear is not a lock.
5. Add the dependency table to B's description using a targeted update, preserving
   other content. Record output, gate, evidence, unblock condition, and next action.
   Link directly to the upstream issue; its assignee remains the owner of that work.
6. Check whether B has agreed useful work independent of this missing input. If so,
   name the boundary or split a useful independent subtask and continue only there.
   Otherwise mark your own assigned issue Blocked, state the next action, and suggest
   another ready task. Do not change another agent's active status without agreement.

| Classification | What the agent records | Can work proceed? |
| --- | --- | --- |
| Confirmed: blocks starting | Native blocking relation + start gate and evidence | Only independently agreed work outside the gate |
| Confirmed: blocks finishing | Native blocking relation + finish gate and evidence | Independent work can proceed; completion/integration waits |
| Suspected | “Needs dependency clarification” note, evidence gap and question; no confirmed blocking relation | Investigate or do independent work; don't build on the uncertain assumption |
| Coordination only | Related link and agreed interface/file coordination | Yes, in separate worktrees within agreed boundaries |

Start/finish gates and evidence are description fields, not invented Linear custom
statuses. Both confirmed kinds use native blocking relations. Ready for Agent means
acceptance criteria and start gates are settled; it may still have a documented
finish gate. In Progress means useful agreed work is happening. Needs Review can
describe an intermediate artifact, but must explicitly say when completion is still
blocked. No completion or merge-readiness claim while required finish gates are open.

### Dependency record template

Keep one row per direct prerequisite on the dependent issue. Use “None confirmed;
checked <date>” when appropriate rather than leaving dependency review implicit.

| Prerequisite | Required output and reason | Gate | Evidence and unblock condition | State / next action |
| --- | --- | --- | --- | --- |
| <issue link and current upstream owner, or owner unknown> | <what this issue consumes and why> | <start / finish> | <requirement/code/decision link; exact artifact and acceptance needed> | <waiting / satisfied / needs clarification; evidence link or owner action> |

Record suspected dependencies separately with the question that would confirm or
rule them out. A priority, a shared parent, the same file, or a similar subject is
not evidence of a hard prerequisite. A missing human decision can be tracked as a
decision issue with a clear owner and question, rather than disguised as code work.

### Examples for this game

- **Save migration → loading old saves:** if loading requires the new agreed format,
  record the format/migration issue as a prerequisite. The unblock condition names
  the merged format contract and passing old-save compatibility fixture, not just
  “save task Done.”
- **Character art → final character integration:** a documented placeholder may
  permit movement work now. Accepted model/animation files and the import contract
  block final visual integration, not every part of the character system. Without
  an agreed interface/placeholder, ask before assuming that parallel work is safe.
- **Sound settings and building placement:** shared UI files may require coordination,
  but do not create a blocking link if neither feature needs the other's output.
- **Technical roadmap:** ALG-46 currently lists ALG-39 through ALG-45 as prerequisites.
  The coordinator must inspect their deliverables and roadmap acceptance criteria
  before saying the roadmap is complete. Drafting a roadmap can still be useful.
  This observed example does not authorize changing those existing links/statuses.

### Recheck, unblock, and recommend next work

The implementing agent checks its issue at planning/start, handoff, review, and
merge. When completing or changing an upstream deliverable, inspect its downstream
links and record what output changed and where to find it. The downstream owner
verifies the exact unblock condition; status alone is not enough. For code, normally
verify the required revision is merged into the downstream base and relevant tests
pass. For design/art/decisions, verify the accepted version is available and matches
the agreed contract. A deliberate dependency branch needs an explicit handoff and
verification before final integration.

Mark the row satisfied with evidence and retain true native dependency links for
traceability. Satisfaction may occur before a broad upstream issue is Done; in that
case link the accepted partial output and note why the remaining upstream work is
irrelevant. If this makes the graph misleading, propose a smaller prerequisite issue
rather than pretending all upstream work finished. Recheck satisfied rows if an
upstream issue is reopened or its delivered contract changes. Canceled or Duplicate
does not satisfy an input: resolve the replacement or an explicit scope decision.

If all blockers clear, the owner can move its paused issue to Ready for Agent, or
In Progress when actually resuming. Don't automatically launch work or change
another person's status. Remove an erroneous/superseded relation only with recorded
evidence and agreement if another owner set or disputes it. Circular dependencies
need a proposed shared prerequisite, smaller tasks, or a human design decision;
never quietly delete an edge to make the graph look ready.

The coordinator reports: **Ready to start**, **Can progress but cannot finish**, and
**Waiting**, with issue links, required outputs, owners/unknown owners, and next
actions. Show stale or inconsistent records explicitly. Recommend existing agreed
priorities first; among equally prioritized ready tasks, prefer one that unblocks
more direct dependents, then the older ready task. An unset priority is unknown,
not automatically urgent. These are recommendations, not automatic reprioritization
or assignments. Ask humans when product urgency or scope is unresolved.

## Build, runtime checks, and previews

The game has no package-manager install step. Use Node.js 24 for the baseline CI.

- `campaign-data.json`: ordered campaign data; `campaign.js`: campaign behavior.
- `build-campaign.cjs`: embeds those sources and specific local assets into the
  campaign block in `index.html`, validates 62 ordered memories, and parses inline
  scripts. It **writes the tracked HTML file**. Run only in your task worktree or
  a disposable copy; inspect and include intended generated changes.
- The rest of `index.html` includes authored engine/UI code. Never regenerate or
  discard the whole file assuming it is entirely generated. Backup files are
  historical references, not active sources. Preserve local Figma-derived assets;
  never add runtime Figma URLs.

Baseline commands for agents:

```sh
node --check campaign.js
node --check build-campaign.cjs
node --check tests/runtime-server.cjs
node --check tests/campaign-runtime.js
node build-campaign.cjs
```

CI checks every tracked `.js`, `.cjs`, and `.mjs` file, then runs the campaign build
in its disposable checkout. It does not enforce generated-file freshness or run a
browser. A passing CI check is syntax/build evidence only.

For gameplay changes, start `node tests/runtime-server.cjs` in the task checkout.
Open `http://127.0.0.1:8779/` in a disposable browser profile, separate from normal
play saves. Wait for the visible result and the server's `/report` output; record
`passed`, check/level/stage counts, and any error. Missing reports or missing CDN
dependencies are failures to complete validation, not passes. The fixed port means
only one runtime server at a time per machine; coordinate, never kill another
agent's server. Fixtures control game state and do not prove balance or game feel.

For normal human playtesting, serve the task checkout separately, for example
`python3 -m http.server 8780 --bind 127.0.0.1` if Python is available. Select a free
port; the agent starts the server and opens the preview. Do not use the automated
fixture URL for ordinary play. State that localhost works only on this computer.
For the other person's computer, prepare the same branch there after authorized
sharing; do not publish or expose a server just to make a preview reachable.

A gameplay checklist should name 2–5 relevant actions and expected results: changed
behavior, one failure/cancel case, and a regression check such as save/reload or
mission progression. Performance-sensitive work needs measured frame-time evidence
on stated hardware/browser. Do not treat desktop results as mobile validation.
Workflow/docs-only changes can mark gameplay preview/playtesting not applicable
with a reason. Do not change the game just to demonstrate this setup.

## Reusable independent reviewer prompt

Start a fresh Codex reviewer (Claude optional) with no implementation chat history.
Use a read-only agent role or read-only tooling when available. Do not provide the
implementer's reasoning transcript. The implementer prepares this packet:

```text
Independently review this task. Read AGENTS.md and docs/TEAM-WORKFLOW.md first.
Repository/worktree: <absolute path; no other checkout may be edited>
Issue and intended behavior: <link plus sufficient requirement text>
Acceptance criteria: <criteria>
Dependencies: <native links, start/finish gates, required outputs and readiness evidence>
Base revision: <SHA>
Review target: <head SHA, or base SHA + list and SHA-256 of every changed file>
Changed paths: <tracked modifications/deletions and relevant untracked files>
Checks already run: <commands, results, environment, revision; evidence, not proof>
Review round: <initial / fix round 1 / fix round 2>

Inspect the full diff and surrounding code; inspect listed untracked files too.
Check behavior, regressions, acceptance criteria, source/build consistency, and
missing meaningful tests. Independently validate claims where practical. You may
also check dependency direction, evidence, cycles and claimed readiness; report
missing upstream evidence rather than accepting a Done label as proof. You may
run checks that do not change reviewed files (use a disposable copy for builds).
Do not edit, stage, commit, push, message other chats, or write to Linear/GitHub.
Report each actionable finding with severity, file/line, failure scenario, and
recommended correction. Separate findings from questions and unverified limits.
State the exact reviewed revision/snapshot, checks you ran, and coverage gaps.
If no actionable findings remain, say so without claiming guaranteed correctness.
For fix rounds, verify the corrections and check for regressions introduced by them.
```

Freeze edits during review. Hash every included changed file for an uncommitted
snapshot; list deletions explicitly. Verify hashes again after review and before
committing. Any mismatch needs affected re-review; never reuse a stale approval.
The PR records reviewer identity/session, revision, findings and dispositions, and
checks. This evidence is not a GitHub-enforced independent-review status check.

## Reusable on-demand coordinator prompt

Use in a separate session or explicitly switch to coordination only. No schedule or
background service is needed. The coordinator cannot see unpublished changes on
someone else's computer; identify them as unknown instead of guessing.

```text
Act as the on-demand coordinator for the Shahnameh game. Read AGENTS.md and this
guide. Read the development, art, and technical-review projects linked above and
the game's GitHub PRs/checks/recent merges. Verify the connected workspace/repo.
Report: what is merged, what each person is working on, blockers, overlapping
systems, review/playtest readiness, and up to three recommended next actions.
Use current source evidence and links. State missing/stale evidence; an In Progress
label alone does not prove an agent is running. Check reviewed/tested revisions
against PR heads. Distinguish uncommitted, pushed, merged, and published work.
Audit native dependency links across all three projects using the dependency
procedure in this guide. Separate ready-to-start work, work that can progress but
cannot finish, and waiting work. For each blocker show the required output, owner
or unknown owner, unblock condition, and next action. Flag cycles, missing evidence,
and stale/suspected links. Recommend dependency corrections to the owners; do not
silently rewrite links or statuses. Recommend next work using agreed priorities
and direct-unblock impact, without changing priorities or assignments.
Publish one concise dated update in the development project if there is a meaningful
change; otherwise report no material change in chat. Do not rewrite others' updates.
Do not launch agents, reassign work, change priorities, edit game files, commit,
merge, publish, or message another chat. Offer choices for product conflicts.
If a connector is unavailable, report incomplete visibility and do not fabricate
status or successful writes. Do not infer release readiness from merged code alone.
```

## One-time setup and administrator checklist

Each contributor uses their own clone, GitHub identity, and Linear connection.
An agent verifies access to the locations above; users complete only necessary
sign-in/consent screens. Never share tokens or commit credentials. Codex can use
the connected Linear plugin. Claude can use Linear's official MCP connection;
the agent performs setup and asks the person to complete authentication.

After these files are shared, start fresh Codex and Claude sessions in the game
root. Ask each to explain the four approval boundaries and identify the shared
instructions it loaded. For Claude, confirm `CLAUDE.md` imports `AGENTS.md`; use
`/context` when available to inspect loaded memory. A file existing alone is not
proof the client loaded it. Record which clients were actually checked.

A GitHub administrator must complete the following (the agent prepares the choices
and can assist; neither contributor needs Git commands):

1. Allow GitHub Actions and open the setup PR after save/share approval. Verify the
   real check named **Syntax and campaign build** from **Game checks** succeeds.
2. Protect `main` with a ruleset requiring a pull request, this observed status
   check on an up-to-date branch, and resolved review conversations. Block force
   pushes and deletion; avoid routine bypass access. Do not require a second human
   approving review: either contributor may authorize integration under this policy.
3. Keep automatic merging off initially. Agent review remains a documented process,
   not a machine-enforced approval. Never claim branch protection enforces it.
4. Inspect any existing main-branch deployment automation. If merging would publish,
   separate deployment into a manual approved action before using the promised
   merge/publish distinction. Do not silently modify unrelated deployment settings.
5. Verify settings with an actual PR. Record enforcement as pending until verified.

The setup issue is the first workflow exercise. Documentation changes need no game
playtest. Complete its PR/merge only after the required approvals. The first real
gameplay task must additionally exercise preview access and the human checklist.
Do not report this end-to-end rollout complete until those steps happen.

## Workflow acceptance scenarios

| Scenario | Expected behavior |
| --- | --- |
| Nontechnical request | Agent handles Git; requester sees outcome, preview and clear approvals |
| Dirty main checkout | Task uses isolated worktree; unrelated files stay untouched |
| Two concurrent tasks | Separate worktrees; owners/areas checked for overlap |
| Conflicting claims | Stop overlapping edits and resolve ownership; Linear is not a lock |
| Failed test or absent browser report | Report failed/incomplete validation; no ready-to-merge claim |
| Reviewer unavailable | Mark review pending and arrange independent session |
| Change after review | Invalidate affected evidence and re-review |
| Linear unavailable | Local handoff, sync pending, no claimed remote reservation |
| Local save approved only | No push, PR, merge, or publication |
| Two review-fix rounds exhausted | Summarize unresolved issues and ask; do not loop indefinitely |
| Merge approved | Integrate current approved revision; do not publish implicitly |
| Local preview for partner | Explain limitation and arrange their own checkout or approved sharing |
| B requires A's output | A blocks B; B records the output, gate, evidence and unblock condition |
| Same file, independent outcomes | Related/coordination note; no invented hard dependency |
| Finish gate with agreed independent work | Continue only that work; completion/integration still waits |
| Upstream says Done, output missing | Dependency stays unsatisfied; report evidence gap |
| Proposed circular or unreadable dependency graph | Leave relation unconfirmed; resolve cycle/visibility first |
| Upstream canceled, duplicated or reopened | Recheck replacement/output; do not automatically unblock |

## References

- [Codex best practices](https://learn.chatgpt.com/guides/best-practices)
- [Sharing instructions with Claude](https://code.claude.com/docs/en/memory#share-one-file-with-other-coding-tools)
- [Linear MCP setup](https://linear.app/docs/mcp)
- [Linear GitHub integration](https://linear.app/docs/github) is optional; issue/PR
  links and agent updates work without enabling workspace-wide status automation.

# Shared agent instructions

These instructions govern the Shahnameh game repository for both Codex and Claude.
This is a two-person software project, independent of any surrounding studio vault.
Keep its work and coordination inside this repository, its GitHub repository, and
the Linear projects linked in [the team guide](docs/TEAM-WORKFLOW.md). Do not apply
unrelated studio administration, canvas, or personal-accountability routines here.

## Communicate for people who do not use Git

- Lead with the outcome, what works, remaining problems, and the next decision.
  Use short, plain-language messages; put technical evidence in the issue or PR.
- Agents handle Git and tool setup. Never require the requester to run Git commands.
- Distinguish **saving a local checkpoint** (commit), **sending for review**
  (push and PR), **adding to the shared development version** (merge), and
  **publishing a release** (deployment). Approval for one does not imply another.
  Files can already be saved on disk before a checkpoint; do not imply uncommitted
  work has been backed up or shared.
- For gameplay changes, provide a working preview and a short checklist of actions
  and expected results. Say whether the preview is local to this computer. Never
  present a localhost URL as accessible to the other contributor.
- Explain uncertain results, unavailable reviews, and incomplete tests honestly.

## Before editing

1. Read this file and the team guide. Identify the actual game Git root and remote;
   do not mistake a surrounding repository for this one.
2. Inspect status, branch, recent history, and worktrees. Inspect the relevant Linear
   issue and related active work for ownership, dependencies, and overlapping areas.
3. Reuse an issue or create one for a coherent feature/fix. Record intended behavior,
   acceptance criteria, human owner, agent/session, branch, dependencies, and a short
   plan. Infer the owner only from reliable session/issue evidence; ask if ambiguous.
4. Create or reuse the task branch before editing: `codex/ALG-123-description` or
   `claude/ALG-123-description`. Never implement directly on `main`. Each person
   uses their own clone; concurrent editing agents use separate worktrees.
5. Start independent work from a verified current remote base when reachable; fetch
   without switching or merging another checkout. Record the base commit. If offline,
   disclose the cached base and reconcile before review/merge. If the task depends
   on unpublished work, arrange a handoff rather than silently copying it.
6. Record ownership before starting and reread the issue. Linear is not an atomic
   lock: a competing owner/session means resolve ownership before overlapping edits.
   Worktrees isolate files, not product conflicts. Sequence overlapping changes.

## Dependencies and ready work

- Before selecting or starting work, read acceptance criteria and native Linear
  `blocks`/`blockedBy` relations across the three projects. Ask: which concrete
  output is missing, and can this task start or finish correctly without it?
- A confirmed hard dependency uses a native relation: if B needs A, **A blocks B**
  (`B.blockedBy = A`). Record the required output, start/finish gate, evidence,
  exact unblock condition, and upstream owner/next action in B's dependency table.
  Add only the needed relation; preserve existing relations and reread after writing.
- Similar subject matter, higher priority, parent/subtask structure, and shared
  files alone do not prove a blocker. Use `relatedTo` and a coordination note for
  independent work; record uncertain dependencies as suspected, not confirmed links.
  If uncertainty affects correctness, resolve it before dependent implementation.
- Recheck dependencies before work, at handoff, before review/merge, and when upstream
  scope/status changes. Verify the actual required artifact, decision, or merged
  code; a Done label alone is not sufficient. Do not delete true relations simply
  because they are satisfied. Record satisfaction evidence in the dependency table.
- Only recommend Ready for Agent when scope is agreed and start prerequisites are
  satisfied. A finish dependency may allow a clearly bounded independent part to
  proceed; record that boundary. Never claim completion/merge readiness while the
  required input remains missing. Blocked means no agreed useful work can proceed.
- Detect self-links and cycles before adding relations; do not create them. Propose
  splitting out a shared prerequisite or clarify the product decision with a human.
  Missing relation visibility means the graph is unverified, not cycle-free.
- Maintain confirmed dependencies involving the assigned issue automatically; ask
  before removing/changing another owner's disputed relation or changing their
  status, ownership, priority, or scope. Never waive a requirement just to unblock.
  The coordinator audits and recommends; it does not silently rewrite the graph.
- Follow the dependency decision procedure and examples in the team guide. Include
  dependency reasoning and satisfaction evidence in the independent review packet.

## Implement and verify

- Never silently stash, reset, overwrite, clean, or commit someone else's work.
  Stage only reviewed files/hunks belonging to this task; avoid blanket staging.
- Resolve routine technical conflicts only when both intended behaviors can be
  preserved. Ask humans to choose competing product behaviors in ordinary language.
- Keep changes small. Request an architecture review before multiplayer, save-format
  changes, substantial combat rewrites, or similarly cross-cutting systems.
- `campaign.js` and `campaign-data.json` are campaign sources. Run
  `node build-campaign.cjs` after changing them or their embedded assets, and include
  the intended generated `index.html` changes. Do not hand-edit the campaign block
  between `// BEGIN ARIEL CAMPAIGN` and `// END ARIEL CAMPAIGN`. Other application
  code in `index.html` is authored source; the whole HTML file is not disposable.
- Follow [the routine performance checks](docs/PERFORMANCE-TESTING.md): run `quick`
  for every change, `desktop` before sharing a PR, and the deeper profiles required
  by the changed systems. Keep failed evidence and record the profile/results in the PR.
- Run relevant syntax/build checks and behavior tests (commands in the team guide).
  Gameplay changes also need browser runtime checks and human playtesting. A server
  starting, a build passing, or agents agreeing is not proof of gameplay correctness.
- Never embed or ship direct Figma asset URLs. Implement designs as local code or
  local assets instead of Figma-hosted runtime assets.

## Independent review and approval

- Delegate review to a fresh reviewer agent without implementation-chat history.
  Use the guide's reviewer prompt. Default to Codex; Claude is optional. This
  authorizes a review subagent for the assigned task, not unrelated parallel work.
- Supply requirements, base revision, complete changes (including relevant untracked
  files), and test evidence. The reviewer reads surrounding code and can run safe
  checks, but does not edit implementation, stage, commit, or update external tools.
- Freeze edits during review. Identify the reviewed commit or uncommitted snapshot
  in the evidence. New changes invalidate affected review/test evidence.
- Fix confirmed findings and explain disagreements. Allow up to two fix-and-review
  rounds after initial review, then surface unresolved findings. Never silently waive
  findings. If independent review is unavailable, mark it pending and provide the
  next step yourself; do not pretend self-review is independent review.
- Before committing, explain the result, proposed files/commit scope, tests, review,
  and limitations. Ask permission to save a local checkpoint; explicitly say whether
  pushing and opening a PR are also requested. Wait for approval. A request to build
  a feature alone is not commit approval.
- At that checkpoint, optionally offer permission for up to two later review-fix
  rounds on the same PR, including scoped commits and pushes. Record what was granted.
  If not granted, ask at each subsequent commit checkpoint. Scope expansion or more
  rounds needs renewed approval. Previously granted scoped approval remains valid.
- Before merging, confirm latest revision, review coverage, passing required checks,
  resolved findings, and human playtest evidence (or justified not-applicable).
  Ask either person explicitly to add the feature to the shared development version.
  If approval names a revision, later changes require renewed merge approval.
  Publishing always needs separate authorization.

## Keep the team informed

- Maintain Linear automatically within assigned work: meaningful decisions, blockers,
  scope changes, validation, review outcomes, and handoffs. Reuse issues; no tool-call
  transcripts or duplicate tickets. Ask before changing others' ownership/priorities.
- Use existing statuses: Backlog, Ready for Spec, Ready for Agent, In Progress,
  Needs Review, Done; Blocked includes the obstacle and next action. State whether
  Needs Review means agent review, human playtest, or save/share/merge approval.
- Mark code work Done only after accepted changes merge; deployment is separate.
- If Linear is unavailable, use the guide's local handoff fallback, report sync
  pending, and never claim ownership was reserved. Do not steal already-owned work.
- At handoff, record exact next action, branch/worktree, reviewed revision, checks,
  approvals granted, and pending steps. Do not remove a worktree with uncommitted
  or unpushed work. The coordinator is on-demand; follow its prompt in the guide.

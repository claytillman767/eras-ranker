---
name: shipper
description: Ships a finished feature branch to production for The Eras Ranker. Bumps version in package.json, writes the CHANGELOG entry, commits on the feature branch, then either merges to main + pushes (local mode) or pushes the feature branch and hands off to the main agent to open a PR (sandbox/web mode). Use when the user says "ship it" / "merge to main" / "push it live" after a change has been implemented and the build is verified clean.
tools: Bash, Read, Edit
model: haiku
---

You ship finished work for The Eras Ranker. This is a mechanical workflow — follow it exactly. Vercel auto-deploys on every push to `main`, so a successful run of these steps puts the change live within ~1 minute.

## Inputs the main agent provides

- **Bump type** — `patch` (0.0.x), `minor` (0.x.0), or `major` (x.0.0). Skip the version bump entirely if the change is purely internal (no user-visible effect — e.g. agent files, CLAUDE.md edits, dev tooling).
- **One-line description** of the change.
- **Optional changelog body.** If omitted, derive one from `git diff main...HEAD --stat` and the most recent commits on the feature branch. Keep it plain-English and user-facing per CLAUDE.md.

If the bump type is unclear, ask the main agent before proceeding.

## Environment detection (RUN FIRST)

The user works from two environments and they need different shipping flows.

Run: `git rev-parse --show-toplevel` and inspect the result.

- **Local mode** — toplevel path contains `.claude/worktrees/` (running inside a Claude Code worktree on the user's Windows computer). Direct push to `main` works. Use the full merge-and-push flow below.
- **Sandbox/web mode** — toplevel path does NOT contain `.claude/worktrees/` (typically `/home/user/eras-ranker` on Claude Code on the web/mobile). Direct push to `main` is blocked by the proxy. Push the feature branch only, then hand off to the main agent to open a PR.

Stash this mode for the rest of the run. If detection is ambiguous, default to sandbox mode — it's the safer fallback (stops short instead of stranding a local merge commit).

## Worktree paths (local mode only)

- **Feature worktree** (where you commit): typically `C:/Users/clayt/dev/eras-ranker/.claude/worktrees/<name>`
- **Parent worktree** (where you merge to main): `C:/Users/clayt/dev/eras-ranker`

Verify with `git rev-parse --show-toplevel` and `git branch --show-current` if unsure.

## Steps (run in order, stop on first error)

### Always (both modes)

1. **Verify the build is green.** Run `npm run build` from the feature worktree. If it fails, abort and report the error — do NOT try to fix the build, that's the main agent's job. Skip this if `npm run build` cannot run in the current environment (e.g. Vite not installed in sandbox); note this in the final report so the main agent knows.
2. **Read current version** in `package.json`. Compute the new version per the bump type. Update `package.json` (skip if internal-only).
3. **Read current `CHANGELOG.md`.** Insert a new section directly under the `Newest entries go at the top.` line:
   - Header: `## <new-version> — YYYY-MM-DD` (today's date — get with `date +%Y-%m-%d`)
   - Group changes under `### Added`, `### Changed`, `### Fixed`, or `### Removed`
   - Plain-English, user-facing tone. Skip purely internal refactors per CLAUDE.md
   - Skip the version bump section entirely if internal-only — instead leave a brief note in commit message and SKIP CHANGELOG editing
4. **Stage files and commit on the feature branch** with a HEREDOC commit message:

```
git commit -m "$(cat <<'EOF'
<one-line subject in imperative mood>

<body — what changed and why, 1-3 sentences>
EOF
)"
```

Stage by name (`package.json CHANGELOG.md src/...`), not `git add -A`, to avoid sweeping in `.env` or stray files.

5. **Push the feature branch:** `git push -u origin <branch>`.

### Local mode only — continue with the merge

6. **From the parent worktree, pull main:**
   `git -C C:/Users/clayt/dev/eras-ranker pull origin main`
   If pull surfaces an in-progress merge or unrelated conflicts, STOP and report — do not try to clean up someone else's mid-merge state.
7. **Merge into main from the parent worktree:**
   `git -C C:/Users/clayt/dev/eras-ranker merge --no-ff <branch> -m "Merge: <subject> (v<version>)"`
   Resolve trivial conflicts (version bumps, changelog entries) by combining cleanly. Escalate logic conflicts to the main agent.
8. **Push main:** `git -C C:/Users/clayt/dev/eras-ranker push origin main`.
9. **Delete the remote feature branch:** `git push origin --delete <branch>`.

### Sandbox/web mode — STOP after the push

After step 5, do NOT attempt to merge or push to `main` — the proxy will reject it and leave a stranded local merge commit. Output the handoff report (see below) and exit. The main agent will use the GitHub MCP tools to open a PR for the user to merge manually.

## Safety rails

- **NEVER** `git reset --hard`, `git push --force`, or skip hooks (`--no-verify`) without explicit user permission.
- **NEVER** `git add -A` or `git add .` — always stage by name.
- **NEVER** commit `.env`, credentials, files containing API keys, or anything starting with `eras_` (those are localStorage keys, not source files).
- **NEVER** attempt to push to `main` in sandbox/web mode — even if step 8 looks tempting, the proxy will fail it and you'll leave a stranded merge commit that the main agent has to clean up with `git reset --hard`.
- If the build fails at step 1, abort. The main agent has the context to fix.
- If a merge conflict touches application logic (anything beyond `package.json` version and `CHANGELOG.md` ordering), abort and let the main agent resolve.
- Do NOT amend commits. If a step fails after committing, fix forward with a new commit.

## Output

### Local mode success
```
Shipped v<version> to main as `<sha>`.
Vercel deploy is in flight — should be live in ~60 seconds.
```

### Sandbox/web mode success (handoff)
```
Pushed v<version> on branch `<branch>` to origin.
Main agent: please open a PR via mcp__github__create_pull_request
  (head=<branch>, base=main, title=<subject>, body=summary).
The user will merge the PR on GitHub; Vercel deploys automatically afterward.
```

If anything aborts, report the failed step, the exact error, and what the main agent needs to do to recover.

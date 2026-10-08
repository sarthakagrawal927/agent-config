---
name: vaultwealth
description: Route Vault Wealth work to its workspace or repository skill. Use only for explicitly named Vault Wealth work or a checkout under ~/Desktop/vaultwealth; skip other projects.
---

# Vault Wealth skill routing

Confirm the repository and read its AGENTS.md first. Workspace skills live at
`~/Desktop/vaultwealth/.agents/skills`; load only the entry needed for the task.

| Requested work | Entry |
| --- | --- |
| Cross-repository PR triage | `pr-triage/SKILL.md` |
| Missing Linear coverage | `linear-gaps/SKILL.md` |
| Vault web/native screenshot batch | `screen-triage/SKILL.md` |
| Worktree cleanup | Explicit-only `worktree-sweep`; ask the user to invoke it in the Vault workspace if the runtime blocks manual skills. |
| Local Lean demo stack | Explicit-only `lean-demo-stack`; ask the user to invoke it in the Vault workspace if the runtime blocks manual skills. |

For webapp work, use the current checkout's `.claude/skills` and repository rules:
`setup-worktree`, `browser-smoke`, `blast-radius`, `analytics-gap`, `audit-ux`,
`ui-parity`, `deslop-diff`, `write-spec`, `generate-storybook`, `raise-pr`,
`pr-screenshots`, `link-linear`, or `merge-hygiene`, only as the task requires.
Do not load all of them. Keep IBKR BigQuery procedures in ibkr-connector.

Worktree copies belong to their branch and must not be symlinked to another
branch's definitions. If a required tool is unavailable, report that boundary;
do not invent an equivalent receipt. Skill availability is not mutation approval.

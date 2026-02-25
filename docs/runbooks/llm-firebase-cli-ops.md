# LLM-Assisted Firebase CLI Ops

## Scope

- Use LLM to plan and sequence Firebase CLI commands.
- Human/agent executes commands in terminal and feeds outputs back to LLM.

## Mandatory guardrails

- Always run `bash scripts/firebase/check-project.sh` before any mutating command.
- Default to emulator-first commands (`emulators:start`, `emulators:exec`) before real deploy paths.
- Never run `firebase deploy` (any target) without explicit user instruction in the active thread.
- Always include `--project <id>` for non-emulator commands.
- Log each session using `docs/runbooks/firebase-cli-session-template.md`.

## Prompt template for LLM

Use this prompt before execution:

> "You are helping operate Firebase CLI for project `hero-stack-local`.  
> Goal: <goal>.  
> Constraints: emulator-first, no deploy unless explicitly approved, explain risk per command.  
> Return a step-by-step command plan in this format: command, purpose, risk, rollback."

## Execution loop

1. Ask LLM for next 1-3 commands only.
2. Execute with `bun run firebase ...` (or wrapper scripts).
3. Paste output back to LLM and request next step.
4. Stop immediately on auth/project mismatch or destructive command suggestion.

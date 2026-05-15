# Fluid Super-App — Documentation Index

This directory is the canonical spec for the Fluid super-app platform — the agent-native framework reorganised into a single shell hosting many composable mini-apps. Every document here is load-bearing; future sessions (human or AI) should be able to pick up this branch with full context by reading these in order.

## How to read this

If you have **5 minutes**, read:
- [`PLAN.md`](../PLAN.md) at repo root — phased delivery summary with pivot triggers
- [`architecture/00-overview.md`](architecture/00-overview.md) — the system in one page

If you have **30 minutes**, read additionally:
- [`requirements/BRD.md`](requirements/BRD.md), [`PRD.md`](requirements/PRD.md), [`TRD.md`](requirements/TRD.md)
- The six [ADRs](decisions/) — every load-bearing architectural decision and its reasoning
- The eight [delivery phases](delivery/) — concrete tasks per phase with acceptance criteria

If you're **picking up implementation work** on a specific phase, also read:
- The phase doc you're working on
- All [`apps/`](apps/) specs for mini-apps that phase touches
- The relevant [`architecture/`](architecture/) subsystem doc
- [`testing/`](testing/) — test strategy per layer

## Directory map

| Path | Purpose |
| --- | --- |
| `architecture/` | How the system is built. Subsystems, boundaries, contracts. |
| `requirements/` | Business, product, technical, and functional requirements. The "what + why". |
| `decisions/` | Architecture Decision Records (ADRs) — irreversible-ish decisions and their reasoning. New ADRs go here. |
| `delivery/` | Phase-by-phase delivery plan with deliverables, tasks, acceptance criteria, pivot triggers. |
| `apps/` | One spec per mini-app: data model, capabilities, UI surface, inter-app deps, test plan. |
| `testing/` | Unit, integration, e2e test strategy + operational QA runbook. |
| `onboarding/` | How a new mini-app gets created and registered with the super-app. |

## Source-of-truth ordering

When documents conflict (and they will, eventually), the precedence order is:

1. **The codebase itself** — running code is the final answer
2. **ADRs** (`decisions/`) — formal architectural decisions, including supersedes/superseded-by links
3. **TRD** (`requirements/TRD.md`) — current technical contracts
4. **Architecture subsystem docs** (`architecture/`)
5. **Delivery phase docs** (`delivery/`) — what was scoped at the time
6. **Per-app specs** (`apps/`)
7. **BRD / PRD** — slowest-moving; if these conflict with implementation, raise it

`CLAUDE.md` at repo root contains the project-wide instructions for AI agents and links to this directory for architectural detail.

## Conventions

- **ADRs are numbered sequentially.** Never renumber. Supersede with a new ADR that links back.
- **Phase docs are sequential too** but can be reordered if a phase is split/merged. Always preserve the phase numbers in commit messages.
- **Spec drift** — when implementation deviates from spec, update the spec in the same PR. Stale specs are worse than no specs.
- **Add to the index** — if you create a new doc, link it from `README.md`.

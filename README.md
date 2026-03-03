# collab-pipelines-official

Official pipeline registry for [collab](https://github.com/BrettHamlin/collab).

## Pipelines

| Name | Description |
|------|-------------|
| clarify | Orchestrator-compatible spec clarification using structured question emission. |
| specify | Create or update the feature specification from a natural language description. |
| plan | Execute the implementation planning workflow to generate design artifacts. |
| tasks | Generate an actionable, dependency-ordered tasks.md from design artifacts. |
| analyze | Perform cross-artifact consistency and quality analysis across spec, plan, and tasks. |
| implement | Execute the implementation plan by processing all tasks defined in tasks.md. |
| blindqa | Blind QA verification against the spec with deterministic signal emission. |
| spec-critique | Adversarial specification analysis to find gaps and ambiguities before implementation. |
| checklist | Generate a custom checklist for the current feature based on user requirements. |
| code-review | Structured code review against spec and implementation standards. |
| tasks-to-issues | Convert tasks.md into actionable, dependency-ordered GitHub issues. |
| ios-build | Compile and install the iOS app on simulator, emit BUILD_COMPLETE or BUILD_FAILED signal. |
| ios-verify | Navigate iOS simulator to verify spec criteria, emit VERIFY_PASS/FAIL/BLOCKED/QUESTION signal. |

## Packs

| Name | Pipelines | Description |
|------|-----------|-------------|
| specfactory | clarify, specify, plan, tasks, analyze, implement, blindqa, spec-critique, checklist, code-review, tasks-to-issues | Complete specfactory workflow. |
| ios | ios-build, ios-verify | iOS development workflow. |

## Installation

```bash
/pipelines install specfactory
```

## Development

```bash
bun test tests/
```

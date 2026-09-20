---
name: open-code-review
description: Delegation mode for Alibaba OpenCodeReview (ocr). Uses OCR's deterministic file filtering and rule resolution to perform in-IDE code reviews without external LLM keys.
---

# Open Code Review — Delegation Mode

A workflow for performing AI code review where Alibaba's `ocr` CLI provides deterministic engineering (file filtering, rule resolution, diff grouping) and the AI agent performs the review directly.

## Workflow

### 1. Preview
Determine reviewable files using:
```bash
ocr delegate preview --format json
```
Or for a specific branch or commit:
```bash
ocr delegate preview --from main --to feature-branch --format json
ocr delegate preview -c <commit-hash> --format json
```

### 2. Rule Resolution
Fetch review rules for target reviewable files:
```bash
ocr delegate rule <path1> <path2> ...
```

### 3. Diff Inspection & Review
Read the diff using git:
- Workspace: `git diff HEAD -- <path>` (or view file directly if newly added)
- Range: `git diff <merge_base>..<to> -- <path>`
- Commit: `git show <commit> -- <path>`

Evaluate against the matched rules:
- **Correctness & Edge Cases**: Concurrency, null pointer safety, state synchronization.
- **Security**: Injection, XSS, Turnstile bot validation, rate limiting, authentication & authorization.
- **Performance & Memory**: Unused large payloads, stream handling, database indexing.
- **Project Standards**: Strict TypeScript types, no nested ternaries, proper error handling and logging.

### 4. Report Findings & Suggest Fixes
Present each finding clearly with:
- Target file path & line numbers
- Category (`security`, `bug`, `performance`, `maintainability`, `style`)
- Explanation of why it's an issue
- Exact remediation code diff

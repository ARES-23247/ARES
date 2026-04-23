---
name: aresweb-pr-workflow
description: Automates creating GitHub Pull Requests for ARESWEB using the GitHub CLI, ensuring correct branching, commits, and PR formatting without user intervention.
---

# ARESWEB PR Automation Workflow

This skill defines the standard procedure for opening Pull Requests in the ARESWEB repository.

## When to Use This Skill
Use this skill whenever the user explicitly requests to "make a pull request," "push these changes to a PR," or "start the PR workflow."

## Workflow Execution Steps

1. **Verify Git Status**
   Check if there are any uncommitted changes using `git status`. If there are, stage them using `git add .`.

2. **Branch Creation**
   If you are currently on `master`, create a new branch using `git checkout -b feature/<descriptive-name>`. 
   If you are already on a feature branch, skip this step.

3. **Commit Changes**
   Commit the staged changes using a descriptive commit message:
   `git commit -m "<Action>: <Brief description>"`
   *Note: If there are no uncommitted changes, skip steps 1 and 3.*

4. **Push to Remote**
   Push the branch to the remote repository and set the upstream branch:
   `git push -u origin HEAD`

5. **Create the Pull Request (Using GitHub CLI)**
   Use the `gh` CLI to create the pull request. Ensure the title is clear and the body provides a summary of the changes.
   `gh pr create --title "[Feature/Fix] <Title>" --body "<Summary of changes and impact>"`

6. **Verify and Report**
   Capture the URL of the newly created Pull Request from the `gh pr create` output, and present it to the user so they can review and merge it.

## Rules & Constraints
- NEVER force push (`-f`) without explicit permission.
- Always ensure `gh` CLI is authenticated. If a `gh` command fails due to auth, stop and inform the user.
- PR titles should follow the `[Type] Title` format (e.g., `[Feature] Add sponsor page`, `[Fix] Resolve linting errors`).

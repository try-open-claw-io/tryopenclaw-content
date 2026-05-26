# Code Review Assistant

Parses pull-request diffs, runs heuristic checks for common bug patterns, security smells, and house-style. Each comment cites the relevant rule or precedent in the codebase.

## How to use

Point the skill at a PR URL. It checks out the diff, runs the rule pack, and posts comments inline.

```bash
review_pr("https://github.com/org/repo/pull/123")
```

### Steps

| Step | Command |
| --- | --- |
| Fetch diff | `git fetch + parse` |
| Run rule pack | `rules.run(diff)` |
| Post comments | `review.post(comments)` |

## Tutorials

- Review PR #142 and flag concurrency issues
- Run the security rule pack on this branch

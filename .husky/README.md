# Git Hooks (Husky)

Ye project Husky v9 use karta hai automatic quality checks ke liye.

## Hooks

### pre-commit

Sirf staged files pe chalta hai (lint-staged ke through):

- **Web `.ts/.tsx`** — ESLint auto-fix
- **API `.ts`** — ESLint auto-fix
- **Sab files** — Prettier auto-format

### commit-msg

Conventional Commit format enforce karta hai:

```
type(scope): short description
```

Valid types: `feat | fix | chore | docs | style | refactor | test | perf | ci | build | revert`

Examples:

```
feat(auth): add Google OAuth login
fix(web): resolve batch thumbnail not showing
chore: update dependencies
```

### pre-push

Push se pehle ye sab check karta hai — agar koi fail ho toh push block ho jaata hai:

1. TypeScript type-check (web)
2. TypeScript type-check (api)
3. Next.js build (web)
4. NestJS build (api)

## Husky skip karna (emergency only)

```bash
# Sirf pre-commit skip
git commit --no-verify -m "fix: hotfix"

# Sirf pre-push skip
git push --no-verify
```

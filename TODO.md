# Settings UI & Fixes Todo

## Fixes to Implement

- [x] 1. Fix `memeberSince` → `memberSince` typo in 3 files:
       - features/settings/types/index.ts
       - features/settings/server/get-settings.ts
       - features/dashboard/components/settings-content.tsx

- [x] 2. Fix `gtihubReposInfiniteQuery` → `githubReposInfiniteQuery` typo in 2 files:
       - features/github/lib/repos-query.ts (export)
       - features/dashboard/components/repo-list.tsx (import)

- [x] 3. Fix `githunInstallation` → `githubInstallation` typo in prisma schema

- [x] 4. Fix invalid `nativeButton={false}` prop in repos/page.tsx

- [x] 5. Add missing `subscriptionRenewsAt` field to Prisma schema + create migration


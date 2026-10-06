# Security Specification

## 1. Data Invariants
- User Profile: Only the authenticated owner (`request.auth.uid == userId`) can read or write their own `/users/{userId}` profile.
- Beer Tastings: Only the authenticated owner (`request.auth.uid == userId`) can read, list, create, update, or delete tastings within `/users/{userId}/tastings/{tastingId}`.
- Foreign User Isolation: No user can access or write to another user's profile or tastings. Unauthenticated users cannot read or write any documents.
- Document IDs must match valid identifier constraints (`isValidId`).

## 2. The "Dirty Dozen" Payloads
1. Unauthenticated read of `/users/{userId}` -> PERMISSION_DENIED
2. Unauthenticated write to `/users/{userId}` -> PERMISSION_DENIED
3. User A attempting to read User B's `/users/userB` -> PERMISSION_DENIED
4. User A attempting to write User B's `/users/userB` -> PERMISSION_DENIED
5. User A attempting to read User B's `/users/userB/tastings/tasting1` -> PERMISSION_DENIED
6. User A attempting to create a tasting in User B's `/users/userB/tastings/tasting1` -> PERMISSION_DENIED
7. User A attempting to list tastings from User B's subcollection -> PERMISSION_DENIED
8. User A creating tasting with mismatched `userId` field -> PERMISSION_DENIED
9. Malicious path variable attack (oversized id > 128 chars) -> PERMISSION_DENIED
10. Unauthenticated list of `/users` collection -> PERMISSION_DENIED
11. Updating a tasting with unverified email or modified `id`/`userId` -> PERMISSION_DENIED
12. Attempt to write to arbitrary root collection (e.g. `/system_data`) -> PERMISSION_DENIED

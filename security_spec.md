# Famral Navigator — Firestore Security Specification

## 1. Data Invariants
1. **Default Deny**: No document in any unspecified collection can be read or written.
2. **PII Isolation**: `/users/{userId}` contains private email and student exam details and is strictly readable/writable only by `request.auth.uid == userId` (verified) or an authenticated verified Admin. Blanket `list` on `/users` is denied for students.
3. **Admin Gate**: Public catalog collections (`/institutions`, `/programmes`, `/cutoffs`, `/schedules`, `/notices`, `/contentItems`) are read-only for published records and writable strictly by verified Admins (`/admins/{uid}` or bootstrapped verified admin email).
4. **Row-Level Ownership**: `/savedColleges`, `/comparisons`, `/choiceLists`, `/savedPredictions`, `/userTracking`, and `/notifications` strictly enforce `resource.data.userId == request.auth.uid` on `get`, `list`, `update`, and `delete`, and `request.resource.data.userId == request.auth.uid` on `create`.
5. **Unguessable Share Links**: `/sharedLists/{shareToken}` allows `get` by exact token (`size >= 16`) and explicitly denies `list` so tokens cannot be enumerated. Only the `ownerId` or Admin may create, update, or revoke (delete) a shared snapshot.
6. **Immutable Ownership & Timestamps**: `userId`/`ownerId`/`reporterUid` and `createdAt` cannot be modified after creation. `createdAt` and `updatedAt` are bound to `request.time`.
7. **Data Report Queue Integrity**: Students can create reports only for themselves with `status == 'open'`, read only their own reports, and cannot alter `status` or `adminNote`. Only Admins can list all reports and resolve them.

## 2. The "Dirty Dozen" Adversarial Payloads (All Must Return PERMISSION_DENIED)
1. **Cross-User Profile Read**: Student A attempts `get(/users/studentB)`.
2. **Cross-User Choice List Read/Update**: Student A attempts `update(/choiceLists/listOwnedByB)`.
3. **Privilege Escalation**: Student A attempts `create(/admins/studentA, { role: 'admin' })`.
4. **Shadow Field Injection**: Student A creates `/users/studentA` with extra ghost key `isAdmin: true`.
5. **Unverified Admin Email Spoof**: User with `email: 'connectwithman@gmail.com'` and `email_verified: false` writes to `/cutoffs/c1`.
6. **Student Cutoff Tampering**: Verified Student A attempts `create(/cutoffs/fake, ...)`.
7. **ID Poisoning**: Authenticated user attempts to write `/savedColleges/${'a'.repeat(300)}` or path with invalid characters.
8. **List Scraping on Private Collection**: Student A runs unfiltered `list(/choiceLists)` without matching `userId == studentA`.
9. **Shared List Enumeration**: Anonymous or authenticated user attempts `list(/sharedLists)` to harvest share tokens.
10. **Tampering with Report Status**: Student A updates their own `/dataReports/r1` to set `status: 'resolved'`.
11. **Backdated Timestamp Forgery**: Student A creates `/choiceLists/l1` with a client-forged `createdAt` instead of `request.time`.
12. **Oversized Array / Denial of Wallet**: Student A writes `/choiceLists/l1` with 500 items (exceeding max 150) or 10KB title string.

# Campus Market - Project Workflow Document

## 1) Team Collaboration Workflow

1. Product requirements are discussed and written as GitHub Issues.
2. Tasks are grouped into weekly sprints.
3. Each developer picks assigned issues.
4. A feature branch is created per issue.
5. Code is pushed and PR is opened to `develop`.
6. Team members review code and request changes if needed.
7. Approved PRs are merged into `develop`.
8. At milestone completion, `develop` is merged into `main`.

---

## 2) Weekly Sprint Flow

- **Monday:** Sprint planning and task assignment
- **Tuesday–Thursday:** Development + daily sync
- **Friday:** Testing, bug fixes, PR merges, sprint review

---

## 3) API Development Flow

1. Define endpoint requirement from feature issue
2. Design request/response schema
3. Create route + controller + service logic
4. Add validation and auth checks
5. Test using Postman
6. Document endpoint in `docs/API_SPEC.md`
7. Open PR and request review

---

## 4) Frontend Development Flow

1. Review UI wireframe and user flow
2. Build XML layouts / Java activities or fragments
3. Create adapters/models/repository classes
4. Integrate API endpoints
5. Add loading/error/empty states
6. Test screen behavior and navigation
7. Open PR with screenshots

---

## 5) Database Development Flow

1. Define entity and relationships
2. Create MongoDB model schema
3. Add validation rules
4. Add indexes for search/performance
5. Insert sample seed data (optional)
6. Verify query performance with real scenarios

---

## 6) Branch & Merge Flow

- `main` = stable release
- `develop` = active integration
- `feature/*` = new features
- `fix/*` = bug fixes
- `hotfix/*` = urgent production fixes

Merge order:
`feature/* -> develop -> main`

---

## 7) Code Review Checklist

Before approving a PR, confirm:
- Code works as expected
- No broken functionality
- Naming and structure are clean
- No hardcoded secrets
- Error handling exists
- Docs are updated
- UI screenshot included (if UI PR)

---

## 8) Quality and Testing Flow

- Unit tests for important backend logic
- Manual testing for mobile user flows
- API endpoint tests before frontend integration
- Regression test before release

Critical user flows to test:
- Signup/Login
- Create store
- Upload product
- Add to cart
- Place order
- View purchase history

---

## 9) Release Flow

1. Freeze new features on sprint end
2. Fix final bugs in `develop`
3. Create release branch `release/vX.Y.Z`
4. Final testing on release branch
5. Merge to `main`
6. Tag release on GitHub
7. Deploy backend and publish app build

---

## 10) Team Communication Rules

- Use GitHub Issues for tasks
- Use PR comments for code discussion
- Use clear status updates in daily sync
- Ask for help early when blocked
- Keep documentation updated after major changes

---

## 11) Definition of Done (DoD)

A task is complete only if:
- Feature is implemented
- Code reviewed and approved
- Tests done and passing
- No major bugs found
- Documentation updated
- Merged into `develop`

---

## 12) Risk Management

Common risks and actions:
- **API delay:** Use mock data on frontend temporarily
- **Merge conflicts:** Pull/rebase daily
- **Scope too large:** Split issue into smaller tasks
- **Unclear requirements:** Clarify in sprint planning before coding

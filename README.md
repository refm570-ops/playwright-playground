# Fish of Fortune E2E Tests

## How to Run

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```env
BASE_URL=<your-api-url>
```

3. Run tests:
```bash
npx playwright test
to run it via ui: npx playwright test --ui
```

## Test Flow
**Login Validation**: Verify new user login returns valid response structure (accessToken, balance, accountCreated).

**Basic Test**: Create user, spin once, verify balance updates and persists after relogin.

**Bonus Test 1 - Scripted Wheel**: Two users spin until energy is empty. Compare their spin sequences to prove the wheel is deterministic.

**Bonus Test 2 - Energy Validation**: 10th spin bonus energy (RewardResourceType 3), when energy is over - checking status is -3 (NotEnoughResources).

## Assumptions

- **DeviceId**: `candidate_test_{uuid}` - auto-generated for each test
- **Rewards**: Two types exist - direct coins (type 1) and collection rewards (type 6). Collections have nested coins in `FeedResponse.Rewards`
- **Energy**: Observed that energy may regenerate (20 spins from 10 starting energy). Added test to flag this behavior * after review- its a feature not a bug, user will get 10 more energy after the first 10.
- **Scripted Wheel**: All new users get identical spin sequences

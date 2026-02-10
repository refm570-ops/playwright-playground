# Fish of Fortune E2E Tests

## How to Run

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```env
BASE_URL=<your-api-url>
TEST_PHONE=<your-phone-number>
```

3. Run tests:
```bash
npx playwright test
```

## Test Flow

**Basic Test**: Create user, spin once, verify balance updates and persists after relogin.

**Bonus Test 1 - Scripted Wheel**: Two users spin until energy is empty. Compare their spin sequences to prove the wheel is deterministic.

**Bonus Test 2 - Energy Validation**: Verify that energy doesn't regenerate during gameplay. Total spins should not exceed starting energy.

## Assumptions

- **DeviceId**: `candidate_test_{uuid}` - auto-generated for each test
- **LoginSource**: `test_{phone}` - from TEST_PHONE env variable
- **Rewards**: Two types exist - direct coins (type 1) and collection rewards (type 6). Collections have nested coins in `FeedResponse.Rewards`
- **Energy**: Observed that energy may regenerate (20 spins from 10 starting energy). Added test to flag this behavior
- **Scripted Wheel**: All new users get identical spin sequences

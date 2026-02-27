import { test, expect } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';
import { LoginApi } from '../modals/LoginApi';
import { WheelApi } from '../modals/WheelApi';
import { SpinReward } from '../types/types';
import { spinScriptedStart, getCoinAmount, INITIAL_ENERGY } from '../utils/wheel-helpers';

test.describe.configure({ mode: 'serial' });

test.describe('Wheel of Fortune E2E Scenarios', () => {
  let loginApi: LoginApi;
  let wheelApi: WheelApi;

  test.beforeEach(async ({ request }) => {
    loginApi = new LoginApi(request);
    wheelApi = new WheelApi(request);
  });

  test.describe('login', () => {
    test('new user should return valid response structure', async () => {
      const uuid = uuidv4();
      const loginResult = await loginApi.login(uuid, 'login_validation');

      expect(loginResult.accessToken, 'access token should exist').toBeTruthy();
      expect(loginResult.accountCreated, 'should be first login').toBe(true);
      expect(loginResult.balance.coins, 'starting coins should be positive').toBeGreaterThan(0);
      expect(loginResult.balance.energy, 'starting energy should be positive').toBeGreaterThan(0);
      expect(loginResult.balance.gems, 'gems should be defined').toBeGreaterThanOrEqual(0);

      console.log(`login validated - coins: ${loginResult.balance.coins}, energy: ${loginResult.balance.energy}, gems: ${loginResult.balance.gems}`);
    });
  });

  test.describe('basic happy flow', () => {
    test('should apply reward and persist state after relogin', async () => {
      const uuid = uuidv4();
      console.log(`--- basic test started ---`);

      const loginResponse = await test.step('create user and login', async () => {
        const res = await loginApi.login(uuid, 'basic_flow');
        await loginApi.validateAccountCreation(res, true);
        console.log(`user created - uuid: ${uuid}`);
        return res;
      });

      const { accessToken, balance: startBalance } = loginResponse;
      console.log(`starting balance - coins: ${startBalance.coins}, energy: ${startBalance.energy}, gems: ${startBalance.gems}`);

      const spinResult = await test.step('spin the wheel', async () => {
        const response = await wheelApi.spin(accessToken) as SpinReward;

        const coinsWon = getCoinAmount(response.rewards);
        console.log(`spin completed - landed on index: ${response.selectedIndex}, coins won: ${coinsWon}`);
        console.log(`new balance - coins: ${response.balance.coins}, energy: ${response.balance.energy}`);

        expect(response.balance.energy).toBe(startBalance.energy - 1);
        expect(response.balance.coins).toBe(startBalance.coins + coinsWon);

        return response;
      });

      await test.step('verify state persists after relogin', async () => {
        const secondLogin = await loginApi.login(uuid, 'basic_flow');
        await loginApi.validateAccountCreation(secondLogin, false);
        console.log(`relogin successful - balance persisted: coins ${secondLogin.balance.coins}, energy ${secondLogin.balance.energy}`);

        expect(secondLogin.balance.coins).toBe(spinResult.balance.coins);
        expect(secondLogin.balance.energy).toBe(spinResult.balance.energy);
      });

      console.log(`--- basic test passed ---`);
    });
  });

  test.describe('advanced logic(Bonus)', () => {
    test('wheel should give same results for all new users', async () => {
      console.log(`--- bonus test: scripted wheel validation ---`);
      const uuid1 = uuidv4();

      const user1 = await test.step('spin until empty for user 1', async () => {
        console.log('testing user 1...');
        const login1 = await loginApi.login(uuid1, 'scripted_wheel');
        console.log(`user 1 initial balance - coins: ${login1.balance.coins}, energy: ${login1.balance.energy}, gems: ${login1.balance.gems}`);
        const result = await spinScriptedStart(login1.accessToken, login1.balance, wheelApi);
        console.log('no more spins available');
        return result;
      });

      const uuid2 = uuidv4();
      const user2 = await test.step('spin until empty for user 2', async () => {
        console.log('testing user 2...');
        const login2 = await loginApi.login(uuid2, 'scripted_wheel');
        const result = await spinScriptedStart(login2.accessToken, login2.balance, wheelApi);
        console.log('no more spins available');
        return result;
      });

      await test.step('compare spin sequences', async () => {
        console.log(`comparing sequences:`);
        console.log(`user 1 spins: [${user1.spinResults}]`);
        console.log(`user 2 spins: [${user2.spinResults}]`);

        const sequencesMatch = JSON.stringify(user1.spinResults) === JSON.stringify(user2.spinResults);
        console.log(`sequences identical: ${sequencesMatch}`);

        expect(user1.spinResults).toEqual(user2.spinResults);
      });

      await test.step('verify final balance persists all fields', async () => {
        console.log(`verifying persistence after relogin...`);
        const { balance } = await loginApi.login(uuid1, 'scripted_wheel');
        console.log(`final balance - coins: ${balance.coins}, energy: ${balance.energy}, gems: ${balance.gems}`);

        expect(balance.coins, 'coins should persist').toBe(user1.lastBalance.coins);
        expect(balance.energy, 'energy should persist').toBe(user1.lastBalance.energy);
        expect(balance.gems, 'gems should persist').toBe(user1.lastBalance.gems);
      });

      console.log(`--- scripted wheel test passed ---`);
    });

    test('10th spin should grant bonus energy via rewardResourceType 3', async () => {
      const uuid = uuidv4();
      const { accessToken, balance: startBalance } = await loginApi.login(uuid, 'bonus_energy');
      console.log(`starting energy: ${startBalance.energy}`);

      let lastResult!: SpinReward;
      for (let i = 1; i <= INITIAL_ENERGY; i++) {
        lastResult = await wheelApi.spin(accessToken) as SpinReward;
        console.log(`spin ${i} - energy: ${lastResult.balance.energy}, rewardResourceType: ${lastResult.rewards[0].rewardResourceType}`);
      }

      const bonusReward = lastResult.rewards.find((r) => r.rewardResourceType === 3);
      expect(bonusReward, '10th spin should contain RewardResourceType 3').toBeTruthy();
      expect(bonusReward!.amount, 'bonus should grant 10 spins').toBe(10);
      expect(lastResult.balance.energy, 'energy should be 10 after bonus').toBe(10);
      console.log(`bonus reward received: ${bonusReward!.amount} extra spins`);
    });

    test('should return status -3(NotEnoughResources) after all spins are done', async () => {
      const uuid = uuidv4();
      const { accessToken, balance } = await loginApi.login(uuid, 'spin_exhausted');

      const result = await spinScriptedStart(accessToken, balance, wheelApi);
      console.log(`total spins performed: ${result.spinResults.length}`);
      console.log('no more spins available');

      const finalSpin = await wheelApi.spin(accessToken);
      expect(finalSpin.status, 'should get status -3 when no spins remain').toBe(-3);

      if (finalSpin.status === -3) {
        console.log(`final spin status: ${finalSpin.status}, response: ${finalSpin.response}`);
        expect(finalSpin.response, 'response should indicate not enough resources').toBe('NotEnoughResources');
      }
    });
  });
});

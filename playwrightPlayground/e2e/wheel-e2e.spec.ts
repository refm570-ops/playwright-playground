import { test, expect } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';
import { LoginApi } from '../modals/LoginApi';
import { WheelApi } from '../modals/WheelApi';
import { spinUntilEmpty, getCoinAmount } from '../utils/wheel-helpers';

test.describe.configure({ mode: 'serial' });

test.describe('Wheel of Fortune E2E Scenarios', () => {
  let loginApi: LoginApi;
  let wheelApi: WheelApi;
  const phone = process.env.TEST_PHONE || 'candidate';

  test.beforeEach(async ({ request }) => {
    loginApi = new LoginApi(request);
    wheelApi = new WheelApi(request);
  });

  test.describe('basic happy flow', () => {
    test('should apply reward and persist state after relogin', async () => {
      const uuid = uuidv4();
      console.log(`--- basic test started ---`);

      const loginResponse = await test.step('create user and login', async () => {
        const res = await loginApi.login(uuid, phone);
        await loginApi.validateAccountCreation(res, true);
        console.log(`user created - uuid: ${uuid}`);
        return res;
      });

      const { accessToken, balance: startBalance } = loginResponse;
      console.log(`starting balance - coins: ${startBalance.coins}, energy: ${startBalance.energy}, gems: ${startBalance.gems}`);

      const spinResult = await test.step('spin the wheel', async () => {
        const response = await wheelApi.spin(accessToken);

        const coinsWon = getCoinAmount(response.rewards);
        console.log(`spin completed - landed on index: ${response.selectedIndex}, coins won: ${coinsWon}`);
        console.log(`new balance - coins: ${response.balance.coins}, energy: ${response.balance.energy}`);

        expect(response.balance.energy).toBe(startBalance.energy - 1);
        expect(response.balance.coins).toBe(startBalance.coins + coinsWon);

        return response;
      });

      await test.step('verify state persists after relogin', async () => {
        const secondLogin = await loginApi.login(uuid, phone);
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

      let initialLogin: any;
      const user1 = await test.step('spin until empty for user 1', async () => {
        console.log('testing user 1...');
        initialLogin = await loginApi.login(uuid1, phone);

        // validate initial login response structure
        expect(initialLogin.accessToken, 'access token should exist').toBeTruthy();
        expect(initialLogin.accountCreated, 'should be first login').toBe(true);
        expect(initialLogin.balance.coins, 'starting coins should be positive').toBeGreaterThan(0);
        expect(initialLogin.balance.energy, 'starting energy should be positive').toBeGreaterThan(0);
        expect(initialLogin.balance.gems, 'gems should be defined').toBeGreaterThanOrEqual(0);

        console.log(`user 1 initial balance - coins: ${initialLogin.balance.coins}, energy: ${initialLogin.balance.energy}, gems: ${initialLogin.balance.gems}`);
        return await spinUntilEmpty(uuid1, phone, loginApi, wheelApi);
      });

      const uuid2 = uuidv4();
      const user2 = await test.step('spin until empty for user 2', async () => {
        console.log('testing user 2...');
        return await spinUntilEmpty(uuid2, phone, loginApi, wheelApi);
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
        const { balance } = await loginApi.login(uuid1, phone);
        console.log(`final balance - coins: ${balance.coins}, energy: ${balance.energy}, gems: ${balance.gems}`);

        expect(balance.coins, 'coins should persist').toBe(user1.lastBalance.coins);
        expect(balance.energy, 'energy should persist').toBe(user1.lastBalance.energy);
        expect(balance.gems, 'gems should persist').toBe(user1.lastBalance.gems);
      });

      console.log(`--- scripted wheel test passed ---`);
    });

    test('energy should not regenerate during gameplay', async () => {
      console.log(`--- bonus test: energy consumption validation ---`);
      const uuid = uuidv4();

      const initialLogin = await loginApi.login(uuid, phone);
      const initialEnergy = initialLogin.balance.energy;
      console.log(`starting energy: ${initialEnergy}`);

      const result = await spinUntilEmpty(uuid, phone, loginApi, wheelApi);
      const totalSpins = result.spinResults.length;

      console.log(`energy analysis:`);
      console.log(`initial energy: ${initialEnergy}`);
      console.log(`total spins performed: ${totalSpins}`);

      if (totalSpins > initialEnergy) {
        console.log(`⚠️  energy regeneration detected: performed ${totalSpins} spins with only ${initialEnergy} starting energy`);
      }

      expect(totalSpins, 'spins should not exceed initial energy').toBeLessThanOrEqual(initialEnergy);
      console.log(`--- energy validation test passed ---`);
    });
  });
});

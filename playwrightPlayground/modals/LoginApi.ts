import { expect } from '@playwright/test';
import { BaseApi } from './BaseApi';
import { LoginResult } from '../types/types';

export class LoginApi extends BaseApi {
  async login(uuid: string, testName: string) {
    const body = await this.post('/login/v4/login', {
      DeviceId: `candidate_test_${uuid}`,
      LoginSource: `test_${testName}`,
    }) as any;

    const loginResponse = body.response?.LoginResponse;

    expect(loginResponse?.AccessToken, 'AccessToken should be present').toBeTruthy();
    expect(loginResponse?.UserBalance, 'UserBalance should be present').toBeDefined();

    return {
      accessToken: loginResponse.AccessToken,
      balance: {
        coins: loginResponse.UserBalance.Coins,
        energy: loginResponse.UserBalance.Energy,
        gems: loginResponse.UserBalance.Gems,
      },
      accountCreated: loginResponse.AccountCreated ?? false,
    } as LoginResult;
  }
  validateAccountCreation(result: LoginResult, expected: boolean) {
    expect(result.accountCreated, `AccountCreated should be ${expected}`).toBe(expected);
  }
}
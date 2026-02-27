import { expect } from '@playwright/test';
import { BaseApi } from './BaseApi';
import { SpinResponse } from '../types/types';

export class WheelApi extends BaseApi {
  async spin(token: string): Promise<SpinResponse> {
    const body = await this.post(
      '/wheel/v1',
      { multiplier: 1 },
      { accessToken: token }
    );

    if (body.status === -3) {
      return { status: -3, response: body.response };
    }

    const { Rewards, UserBalance } = body.response.SpinResult;

    expect(Rewards.length, 'spin should return at least one reward').toBeGreaterThan(0);
    return {
      status: 0,
      rewards: Rewards.map((reward: any) => ({
        rewardDefinitionType: reward.RewardDefinitionType,
        trackingId: reward.TrackingId,
        rewardResourceType: reward.RewardResourceType,
        amount: reward.Amount,
        multiplier: reward.Multiplier,
        feedResponse: reward.FeedResponse ? {
          rewards: reward.FeedResponse.Rewards,
        } : undefined,
      })),
      balance: {
        coins: UserBalance.Coins,
        energy: UserBalance.Energy,
        gems: UserBalance.Gems,
      },
      selectedIndex: body.response.SelectedIndex,
    };
  }
}

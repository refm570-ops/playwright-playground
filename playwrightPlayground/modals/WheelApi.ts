import { expect } from '@playwright/test';
import { BaseApi } from './BaseApi';

export class WheelApi extends BaseApi {
  async spin(token: string) {
    const body = await this.post(
      '/wheel/v1',
      { multiplier: 1 },
      { accessToken: token }
    ) as any;

    const { Rewards, UserBalance } = body.response.SpinResult;

    expect(Rewards.length, 'spin should return at least one reward').toBeGreaterThan(0);
    return {
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

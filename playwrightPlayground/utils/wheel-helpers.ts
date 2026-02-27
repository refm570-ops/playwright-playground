import { WheelApi } from '../modals/WheelApi';
import { Balance, Reward } from '../types/types';

export const INITIAL_ENERGY = 10;
export const BONUS_SPINS = 10;
export const TOTAL_SCRIPTED_SPINS = INITIAL_ENERGY + BONUS_SPINS;

export async function spinScriptedStart(
  accessToken: string,
  initialBalance: Balance,
  wheelApi: WheelApi
) {

  const spinResults: number[] = [];
  let lastBalance: Balance = initialBalance;
  let totalCoinsEarned = 0;

  for (let i = 0; i < TOTAL_SCRIPTED_SPINS; i++) {
    const result = await wheelApi.spin(accessToken);

    if (result.status === -3) 
      break;

    const coinsFromThisSpin = getCoinAmount(result.rewards);
    totalCoinsEarned += coinsFromThisSpin;

    spinResults.push(result.selectedIndex);
    lastBalance = result.balance;
  }

  console.log(`total coins earned from all spins: ${totalCoinsEarned}`);
  return { lastBalance, spinResults, totalCoinsEarned };
}

export function getCoinAmount(rewards: Reward[]): number {
  let totalCoins = 0;

  for (const reward of rewards) {
    // direct coin rewards (RewardResourceType: 1)
    if (reward.rewardResourceType === 1) {
      totalCoins += reward.amount;
    }

    // collection rewards with nested coins (RewardDefinitionType: 6)
    if (reward.rewardDefinitionType === 6 && reward.feedResponse?.rewards) {
      for (const feedRewards of Object.values(reward.feedResponse.rewards)) {
        for (const nestedReward of feedRewards) {
          if (nestedReward.rewardResourceType === 1) {
            totalCoins += nestedReward.amount;
          }
        }
      }
    }
  }
  return totalCoins;
}

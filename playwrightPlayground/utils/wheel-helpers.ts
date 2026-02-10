import { LoginApi } from '../modals/LoginApi';
import { WheelApi } from '../modals/WheelApi';

export async function spinUntilEmpty(
  uuid: string,
  phone: string,
  loginApi: LoginApi,
  wheelApi: WheelApi
) {
  const { accessToken, balance: initialBalance } = await loginApi.login(uuid, phone);

  const spinResults: number[] = [];
  let currentEnergy = initialBalance.energy;
  let lastBalance = initialBalance;
  let totalCoinsEarned = 0;

  let safetyCounter = 0; // if the energy is infinite. we don't want to loop forever

  while (currentEnergy > 0 && safetyCounter < 50) {
    const result = await wheelApi.spin(accessToken);

    const coinsFromThisSpin = getCoinAmount(result.rewards);
    totalCoinsEarned += coinsFromThisSpin;

    spinResults.push(result.selectedIndex);
    currentEnergy = result.balance.energy;
    lastBalance = result.balance;

    safetyCounter++;
  }

  console.log(`total coins earned from all spins: ${totalCoinsEarned}`);
  return { lastBalance, spinResults, totalCoinsEarned };
}

export function getCoinAmount(rewards: any[]): number {
  let totalCoins = 0;

  for (const reward of rewards) {
    // direct coin rewards (RewardResourceType: 1)
    if (reward.rewardResourceType === 1) {
      totalCoins += reward.amount;
    }

    // collection rewards with nested coins (RewardDefinitionType: 6)
    if (reward.rewardDefinitionType === 6 && reward.feedResponse?.rewards) {
      for (const feedRewards of Object.values(reward.feedResponse.rewards)) {
        for (const nestedReward of feedRewards as any[]) {
          if (nestedReward.rewardResourceType === 1) {
            totalCoins += nestedReward.amount;
          }
        }
      }
    }
  }
  return totalCoins;
}
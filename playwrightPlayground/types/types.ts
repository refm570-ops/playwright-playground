export interface UserBalance {
  coins: number;
  gems: number;
  energy: number;
  energyExpirationTS: number;
  energyExpirationSeconds: number;
  lastUpdateTS: number;
  shieldsAmount: number;
  maxEnergyCapacity: number;
}

export interface Reward {
  rewardDefinitionType: number;
  trackingId: string;
  rewardResourceType: number;
  amount: number;
  multiplier: number;
}

export interface SpinResult {
  selectedIndex: number;
  rewards: Reward[];
  userBalance: UserBalance;
}

export interface LoginResult {
  accessToken: string;
  balance: UserBalance;
  accountCreated: boolean;
}

export interface SpinOutcome {
  rewards: Reward[];
  balance: UserBalance;
  selectedIndex: number;
}

export interface Balance {
  coins: number;
  energy: number;
  gems: number;
}

export interface Reward {
  rewardDefinitionType: number;
  trackingId: string;
  rewardResourceType: number;
  amount: number;
  multiplier: number;
  feedResponse?: {
    rewards: Record<string, Reward[]>;
  };
}

export interface LoginResult {
  accessToken: string;
  balance: Balance;
  accountCreated: boolean;
}

export interface SpinReward {
  status: 0;
  rewards: Reward[];
  balance: Balance;
  selectedIndex: number;
}

export interface SpinExhausted {
  status: -3;
  response: string;
}

export type SpinResponse = SpinReward | SpinExhausted;

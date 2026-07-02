export type Role = 'user' | 'admin';

export interface User {
  id: string; // Will align with Firebase UID
  email: string;
  username: string;
  phone: string;
  role: Role;
  balance: number;
  balances?: Record<string, number>;
  totalEarnings: number;
  vipLevel: number;
  trc20Address: string;
  referrerId: string | null;
  createdAt: number;
  lastMiningDate: number | null;
  isBlocked?: boolean;
  password?: string;
  withdrawPassword?: string;
  faceIdData?: string; // Base64 of the face photo
  avatar?: string;
  ipAddress?: string;
  kycStatus?: "unverified" | "pending" | "approved" | "rejected";
  kycIdNumber?: string;
  kycPhoto?: string;
  lastCheckInTimestamp?: number;
  checkInStreak?: number;
  nftMultiplier?: number;
}

export interface VIPLevel {
  level: number;
  name: string;
  price: number;
  dailyIncome: number;
  validityDays: number;
  maxTasks: number;
}

export type TransactionType = 'deposit' | 'withdraw' | 'mining' | 'reward' | 'purchase' | 'shop_order' | 'stake' | 'stake_reward' | 'refund' | 'transfer' | 'nft_sale' | 'nft_fee' | 'nft_bid' | 'nft_bid_refund';
export type TransactionStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface NFTItem {
  id: string;
  creatorId: string;
  ownerId: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  status: 'sale' | 'auction' | 'not_for_sale';
  auctionEndTime?: number;
  highestBid?: number;
  highestBidderId?: string;
  createdAt: number;
}

export interface NFTBid {
  id: string;
  nftId: string;
  bidderId: string;
  amount: number;
  timestamp: number;
  status: 'active' | 'accepted' | 'rejected' | 'refunded';
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  timestamp: number;
  description?: string;
  address?: string; // For withdrawals
}

export interface StakeRecord {
  id: string;
  userId: string;
  amount: number;
  currency?: string;
  durationMonths: number;
  interestRate: number;
  expectedReturn: number;
  startDate: number;
  endDate: number;
  status: 'active' | 'completed';
}

export interface Notice {
  id: string;
  text: string;
  isActive: boolean;
  timestamp: number;
}

export interface Product {
  id: string;
  name: string;
  hash: string;
  price: number;
  img: string;
}

export interface OrderItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  shippingAddress: string;
  status: 'pending' | 'shipped' | 'delivered';
  timestamp: number;
}

export interface PaymentMethod {
  id: string;
  name: string; // e.g., 'Binance', 'Bybit', 'Trust Wallet'
  network: string; // e.g., 'TRC20'
  address: string;
}

export interface BetSelection {
  matchId: string;
  matchName: string;
  marketName: string;
  selectionId: string;
  selectionLabel: string;
  odds: number;
}

export interface BetRecord {
  id: string;
  userId: string;
  amount: number;
  potentialWin: number;
  totalOdds: number;
  selections: BetSelection[];
  status: 'pending' | 'won' | 'lost' | 'cashed_out';
  timestamp: number;
}

export interface AppState {
  users: User[];
  transactions: Transaction[];
  notices: Notice[];
  systemBalance: number; // Total platform deposits
  products: Product[];
  orders: Order[];
  supportLink?: string;
  vipLevels?: VIPLevel[];
  paymentMethods?: PaymentMethod[];
  stakes?: StakeRecord[];
  bets?: BetRecord[];
  stakeSettings?: { interestRate: number; minStake: number; maxStake: number };
  banners?: string[];
  billboardText?: string;
  billboardEnabled?: boolean;
  referralBonusText?: string;
  depositBonusText?: string;
  referralSystemEnabled?: boolean;
  referralLevel1Rate?: number;
  referralLevel2Rate?: number;
  referralLevel3Rate?: number;
  news?: any[];
  dailyRewards?: number[];
  gameCrashWinRate?: number;
  gameRocketWinRate?: number;
  gameCoinWinRate?: number;
  gameDiceWinRate?: number;
  gameSlotsWinRate?: number;
  gameFishWinRate?: number;
  gameCoinFlipEnabled?: boolean;
  gameDiceRollEnabled?: boolean;
  gameCrashEnabled?: boolean;
  gameSlotsEnabled?: boolean;
  gameFishEnabled?: boolean;
  gameWheelEnabled?: boolean;
  gameMinesEnabled?: boolean;
  gamePlinkoEnabled?: boolean;
  gameTowerEnabled?: boolean;
  nfts?: NFTItem[];
  nftBids?: NFTBid[];
}

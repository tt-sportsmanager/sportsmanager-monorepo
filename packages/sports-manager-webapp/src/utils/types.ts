import { BigNumber, BigNumberish } from '@ethersproject/bignumber';

export interface BidEvent {
  sportsManagerId: BigNumberish;
  sender: string;
  value: BigNumberish;
  extended: boolean;
  transactionHash: string;
  timestamp: BigNumberish;
}

export interface AuctionCreateEvent {
  sportsManagerId: BigNumberish;
  startTime: BigNumberish;
  endTime: BigNumberish;
  settled: boolean;
}

export interface AuctionSettledEvent {
  sportsManagerId: BigNumberish;
  winner: string;
  amount: BigNumberish;
}

export interface AuctionExtendedEvent {
  sportsManagerId: BigNumberish;
  endTime: BigNumberish;
}

export interface Bid {
  sportsManagerId: BigNumber;
  sender: string;
  value: BigNumber;
  extended: boolean;
  transactionHash: string;
  timestamp: BigNumber;
}

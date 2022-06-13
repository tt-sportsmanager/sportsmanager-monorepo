import { useContractCall } from '@usedapp/core';
import { BigNumber as EthersBN, utils } from 'ethers';
import { SportsManagerAuctionHouseABI } from '@sports-manager/sdk';
import config from '../config';
import BigNumber from 'bignumber.js';
import { isFounderSportsManager } from '../utils/founderSportsManager';
import { useAppSelector } from '../hooks';
import { AuctionState } from '../state/slices/auction';

export enum AuctionHouseContractFunction {
  auction = 'auction',
  duration = 'duration',
  minBidIncrementPercentage = 'minBidIncrementPercentage',
  sportsManagers = 'sportsManagers',
  createBid = 'createBid',
  settleCurrentAndCreateNewAuction = 'settleCurrentAndCreateNewAuction',
}

export interface Auction {
  amount: EthersBN;
  bidder: string;
  endTime: EthersBN;
  startTime: EthersBN;
  sportsManagerId: EthersBN;
  settled: boolean;
}

const abi = new utils.Interface(SportsManagerAuctionHouseABI.abi);

export const useAuction = (auctionHouseProxyAddress: string) => {
  const auction = useContractCall<Auction>({
    abi,
    address: auctionHouseProxyAddress,
    method: 'auction',
    args: [],
  });
  return auction as Auction;
};

export const useAuctionMinBidIncPercentage = () => {
  const minBidIncrement = useContractCall({
    abi,
    address: config.addresses.sportsManagerAuctionHouseProxy,
    method: 'minBidIncrementPercentage',
    args: [],
  });

  if (!minBidIncrement) {
    return;
  }

  return new BigNumber(minBidIncrement[0]);
};

/**
 * Computes timestamp after which a SportsManager could vote
 * @param nounId TokenId of SportsManager
 * @returns Unix timestamp after which SportsManager could vote
 */
export const useSportsManagerCanVoteTimestamp = (nounId: number) => {
  const nextSportsManagerId = nounId + 1;

  const nextSportsManagerIdForQuery = isFounderSportsManager(EthersBN.from(nextSportsManagerId)) ? nextSportsManagerId + 1 : nextSportsManagerId;

  const pastAuctions = useAppSelector(state => state.pastAuctions.pastAuctions);

  const maybeNounCanVoteTimestamp = pastAuctions.find((auction: AuctionState, i: number) => {
    const maybeNounId = auction.activeAuction?.sportsManagerId;
    return maybeNounId ? EthersBN.from(maybeNounId).eq(EthersBN.from(nextSportsManagerIdForQuery)) : false;
  })?.activeAuction?.startTime;

  if (!maybeNounCanVoteTimestamp) {
    // This state only occurs during loading flashes
    return EthersBN.from(0);
  }

  return EthersBN.from(maybeNounCanVoteTimestamp);
};

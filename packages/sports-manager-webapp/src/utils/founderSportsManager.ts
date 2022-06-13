import { Auction } from '../wrappers/sportsManagerAuction';
import { AuctionState } from '../state/slices/auction';
import { BigNumber } from '@ethersproject/bignumber';

export const isFounderSportsManager = (nounId: BigNumber) => {
  return nounId.mod(10).eq(0) || nounId.eq(0);
};

const emptyFounderAuction = (onDisplayAuctionId: number): Auction => {
  return {
    amount: BigNumber.from(0).toJSON(),
    bidder: '',
    startTime: BigNumber.from(0).toJSON(),
    endTime: BigNumber.from(0).toJSON(),
    sportsManagerId: BigNumber.from(onDisplayAuctionId).toJSON(),
    settled: false,
  };
};

const findAuction = (id: BigNumber, auctions: AuctionState[]): Auction | undefined => {
  return auctions.find(auction => {
    return BigNumber.from(auction.activeAuction?.sportsManagerId).eq(id);
  })?.activeAuction;
};

/**
 *
 * @param nounId
 * @param pastAuctions
 * @returns empty `Auction` object with `startTime` set to auction after param `nounId`
 */
export const generateEmptyFounderAuction = (
  nounId: BigNumber,
  pastAuctions: AuctionState[],
): Auction => {
  const founderAuction = emptyFounderAuction(nounId.toNumber());
  // use founderAuction.nounId + 1 to get mint time
  const auctionAbove = findAuction(nounId.add(1), pastAuctions);
  const auctionAboveStartTime = auctionAbove && BigNumber.from(auctionAbove.startTime);
  if (auctionAboveStartTime) founderAuction.startTime = auctionAboveStartTime.toJSON();

  return founderAuction;
};

import { BigNumber } from '@ethersproject/bignumber';
import { useAppSelector } from '../hooks';
import { generateEmptyFounderAuction, isFounderSportsManager } from '../utils/founderSportsManager';
import { Bid, BidEvent } from '../utils/types';
import { Auction } from './sportsManagerAuction';

const deserializeAuction = (reduxSafeAuction: Auction): Auction => {
  return {
    amount: BigNumber.from(reduxSafeAuction.amount),
    bidder: reduxSafeAuction.bidder,
    startTime: BigNumber.from(reduxSafeAuction.startTime),
    endTime: BigNumber.from(reduxSafeAuction.endTime),
    sportsManagerId: BigNumber.from(reduxSafeAuction.sportsManagerId),
    settled: false,
  };
};

const deserializeBid = (reduxSafeBid: BidEvent): Bid => {
  return {
    sportsManagerId: BigNumber.from(reduxSafeBid.sportsManagerId),
    sender: reduxSafeBid.sender,
    value: BigNumber.from(reduxSafeBid.value),
    extended: reduxSafeBid.extended,
    transactionHash: reduxSafeBid.transactionHash,
    timestamp: BigNumber.from(reduxSafeBid.timestamp),
  };
};
const deserializeBids = (reduxSafeBids: BidEvent[]): Bid[] => {
  return reduxSafeBids
    .map(bid => deserializeBid(bid))
    .sort((a: Bid, b: Bid) => {
      return b.timestamp.toNumber() - a.timestamp.toNumber();
    });
};

const useOnDisplayAuction = (): Auction | undefined => {
  const lastAuctionSportsManagerId = useAppSelector(state => state.auction.activeAuction?.sportsManagerId);
  const onDisplayAuctionSportsManagerId = useAppSelector(
    state => state.onDisplayAuction.onDisplayAuctionSportsManagerId,
  );
  const currentAuction = useAppSelector(state => state.auction.activeAuction);
  const pastAuctions = useAppSelector(state => state.pastAuctions.pastAuctions);

  if (
    onDisplayAuctionSportsManagerId === undefined ||
    lastAuctionSportsManagerId === undefined ||
    currentAuction === undefined ||
    !pastAuctions
  )
    return undefined;

  // current auction
  if (BigNumber.from(onDisplayAuctionSportsManagerId).eq(lastAuctionSportsManagerId)) {
    return deserializeAuction(currentAuction);
  }

  // nounder auction
  if (isFounderSportsManager(BigNumber.from(onDisplayAuctionSportsManagerId))) {
    const emptySportsManagerderAuction = generateEmptyFounderAuction(
      BigNumber.from(onDisplayAuctionSportsManagerId),
      pastAuctions,
    );

    return deserializeAuction(emptySportsManagerderAuction);
  }

  // past auction
  const reduxSafeAuction: Auction | undefined = pastAuctions.find(auction => {
    const sportsManagerId = auction.activeAuction && BigNumber.from(auction.activeAuction.sportsManagerId);
    return sportsManagerId && sportsManagerId.toNumber() === onDisplayAuctionSportsManagerId;
  })?.activeAuction;

  return reduxSafeAuction ? deserializeAuction(reduxSafeAuction) : undefined;
};

export const useAuctionBids = (auctionSportsManagerId: BigNumber): Bid[] | undefined => {
  const lastAuctionSportsManagerId = useAppSelector(state => state.onDisplayAuction.lastAuctionSportsManagerId);
  const lastAuctionBids = useAppSelector(state => state.auction.bids);
  const pastAuctions = useAppSelector(state => state.pastAuctions.pastAuctions);

  // auction requested is active auction
  if (lastAuctionSportsManagerId === auctionSportsManagerId.toNumber()) {
    return deserializeBids(lastAuctionBids);
  } else {
    // find bids for past auction requested
    const bidEvents: BidEvent[] | undefined = pastAuctions.find(auction => {
      const sportsManagerId = auction.activeAuction && BigNumber.from(auction.activeAuction.sportsManagerId);
      return sportsManagerId && sportsManagerId.eq(auctionSportsManagerId);
    })?.bids;

    return bidEvents && deserializeBids(bidEvents);
  }
};

export default useOnDisplayAuction;

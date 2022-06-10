import { BigNumber } from '@ethersproject/bignumber';
import { useAppSelector } from '../hooks';
import { generateEmptyNounderAuction, isNounderNoun } from '../utils/nounderNoun';
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
  const lastAuctionNounId = useAppSelector(state => state.auction.activeAuction?.sportsManagerId);
  const onDisplayAuctionNounId = useAppSelector(
    state => state.onDisplayAuction.onDisplayAuctionNounId,
  );
  const currentAuction = useAppSelector(state => state.auction.activeAuction);
  const pastAuctions = useAppSelector(state => state.pastAuctions.pastAuctions);

  if (
    onDisplayAuctionNounId === undefined ||
    lastAuctionNounId === undefined ||
    currentAuction === undefined ||
    !pastAuctions
  )
    return undefined;

  // current auction
  if (BigNumber.from(onDisplayAuctionNounId).eq(lastAuctionNounId)) {
    return deserializeAuction(currentAuction);
  }

  // nounder auction
  if (isNounderNoun(BigNumber.from(onDisplayAuctionNounId))) {
    const emptyNounderAuction = generateEmptyNounderAuction(
      BigNumber.from(onDisplayAuctionNounId),
      pastAuctions,
    );

    return deserializeAuction(emptyNounderAuction);
  }

  // past auction
  const reduxSafeAuction: Auction | undefined = pastAuctions.find(auction => {
    const sportsManagerId = auction.activeAuction && BigNumber.from(auction.activeAuction.sportsManagerId);
    return sportsManagerId && sportsManagerId.toNumber() === onDisplayAuctionNounId;
  })?.activeAuction;

  return reduxSafeAuction ? deserializeAuction(reduxSafeAuction) : undefined;
};

export const useAuctionBids = (auctionNounId: BigNumber): Bid[] | undefined => {
  const lastAuctionNounId = useAppSelector(state => state.onDisplayAuction.lastAuctionNounId);
  const lastAuctionBids = useAppSelector(state => state.auction.bids);
  const pastAuctions = useAppSelector(state => state.pastAuctions.pastAuctions);

  // auction requested is active auction
  if (lastAuctionNounId === auctionNounId.toNumber()) {
    return deserializeBids(lastAuctionBids);
  } else {
    // find bids for past auction requested
    const bidEvents: BidEvent[] | undefined = pastAuctions.find(auction => {
      const sportsManagerId = auction.activeAuction && BigNumber.from(auction.activeAuction.sportsManagerId);
      return sportsManagerId && sportsManagerId.eq(auctionNounId);
    })?.bids;

    return bidEvents && deserializeBids(bidEvents);
  }
};

export default useOnDisplayAuction;

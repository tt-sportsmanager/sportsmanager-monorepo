import { Col, Row } from 'react-bootstrap';
import { BigNumber } from 'ethers';
import AuctionActivityWrapper from '../AuctionActivityWrapper';
import AuctionNavigation from '../AuctionNavigation';
import AuctionActivitySportsManagerTitle from '../AuctionActivitySportsManagerTitle';
import AuctionActivityDateHeadline from '../AuctionActivityDateHeadline';
import AuctionTitleAndNavWrapper from '../AuctionTitleAndNavWrapper';
import { Link } from 'react-router-dom';
import sportsManagerContentClasses from './SportsManagerFounderNounContent.module.css';
import auctionBidClasses from '../AuctionActivity/BidHistory.module.css';
import bidBtnClasses from '../BidHistoryBtn/BidHistoryBtn.module.css';
import auctionActivityClasses from '../AuctionActivity/AuctionActivity.module.css';
import CurrentBid, { BID_N_A } from '../CurrentBid';
import Winner from '../Winner';
import { Trans } from '@lingui/macro';

import { useAppSelector } from '../../hooks';

const SportsManagerFounderNounContent: React.FC<{
  mintTimestamp: BigNumber;
  sportsManagerId: BigNumber;
  isFirstAuction: boolean;
  isLastAuction: boolean;
  onPrevAuctionClick: () => void;
  onNextAuctionClick: () => void;
}> = props => {
  const {
    mintTimestamp,
    sportsManagerId,
    isFirstAuction,
    isLastAuction,
    onPrevAuctionClick,
    onNextAuctionClick,
  } = props;

  const isCool = useAppSelector(state => state.application.isCoolBackground);

  return (
    <AuctionActivityWrapper>
      <div className={auctionActivityClasses.informationRow}>
        <Row className={auctionActivityClasses.activityRow}>
          <AuctionTitleAndNavWrapper>
            <AuctionNavigation
              isFirstAuction={isFirstAuction}
              isLastAuction={isLastAuction}
              onNextAuctionClick={onNextAuctionClick}
              onPrevAuctionClick={onPrevAuctionClick}
            />
            <AuctionActivityDateHeadline startTime={mintTimestamp} />
          </AuctionTitleAndNavWrapper>
          <Col lg={12}>
            <AuctionActivitySportsManagerTitle sportsManagerId={sportsManagerId} />
          </Col>
        </Row>
        <Row className={auctionActivityClasses.activityRow}>
          <Col lg={4} className={auctionActivityClasses.currentBidCol}>
            <CurrentBid currentBid={BID_N_A} auctionEnded={true} />
          </Col>
          <Col
            lg={5}
            className={`${auctionActivityClasses.currentBidCol} ${sportsManagerContentClasses.currentBidCol} ${auctionActivityClasses.auctionTimerCol}`}
          >
            <div className={auctionActivityClasses.section}>
              <Winner winner={''} isSportsManagerFounder={true} />
            </div>
          </Col>
        </Row>
      </div>
      <Row className={auctionActivityClasses.activityRow}>
        <Col lg={12}>
          <ul className={auctionBidClasses.bidCollection}>
            <li
              className={
                (isCool ? `${auctionBidClasses.bidRowCool}` : `${auctionBidClasses.bidRowWarm}`) +
                ` ${sportsManagerContentClasses.bidRow}`
              }
            >
              <Trans>All Sports Manager auction proceeds are sent to the</Trans>{' '}
              <Link to="/vote" className={sportsManagerContentClasses.link}>
                <Trans>SportsManager DAO</Trans>
              </Link>
              .{' '}
              <Trans>
                For this reason, we, the project's founders (‘Founders’) have chosen to compensate
                ourselves with SportsManager. Every 10th SportsManager for the first 5 years of the project will be
                sent to our multisig (5/10), where it will be vested and distributed to individual
                SportsManagerFounders.
              </Trans>
            </li>
          </ul>
          <div
            className={
              isCool ? bidBtnClasses.bidHistoryWrapperCool : bidBtnClasses.bidHistoryWrapperWarm
            }
          >
            <Link
              to="/nounders"
              className={isCool ? bidBtnClasses.bidHistoryCool : bidBtnClasses.bidHistoryWarm}
            >
              <Trans>Learn more</Trans> →
            </Link>
          </div>
        </Col>
      </Row>
    </AuctionActivityWrapper>
  );
};
export default SportsManagerFounderNounContent;

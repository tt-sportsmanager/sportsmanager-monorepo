import { Col } from 'react-bootstrap';
import { StandaloneSportsManagerWithSeed } from '../StandaloneSportsManager';
import AuctionActivity from '../AuctionActivity';
import { Row, Container } from 'react-bootstrap';
import { setStateBackgroundColor } from '../../state/slices/application';
import { LoadingSportsManager } from '../SportsManager';
import { Auction as IAuction } from '../../wrappers/sportsManagerAuction';
import classes from './Auction.module.css';
import { ISportsManagerSeed } from '../../wrappers/sportsManagerToken';
import SportsManagerFounderNounContent from '../SportsManagerFounderNounContent';
import { useHistory } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { isFounderSportsManager } from '../../utils/founderSportsManager';
import {
  setNextOnDisplayAuctionSportsManagerId,
  setPrevOnDisplayAuctionSportsManagerId,
} from '../../state/slices/onDisplayAuction';
import { beige, grey } from '../../utils/sportsManagerBgColors';

interface AuctionProps {
  auction?: IAuction;
}

const Auction: React.FC<AuctionProps> = props => {
  const { auction: currentAuction } = props;

  const history = useHistory();
  const dispatch = useAppDispatch();
  let stateBgColor = useAppSelector(state => state.application.stateBackgroundColor);
  const lastSportsManagerId = useAppSelector(state => state.onDisplayAuction.lastAuctionSportsManagerId);

  const loadedSportsManagerHandler = (seed: ISportsManagerSeed) => {
    dispatch(setStateBackgroundColor(seed.background === 0 ? grey : beige));
  };

  const prevAuctionHandler = () => {
    dispatch(setPrevOnDisplayAuctionSportsManagerId());
    currentAuction && history.push(`/noun/${currentAuction.sportsManagerId.toNumber() - 1}`);
  };
  const nextAuctionHandler = () => {
    dispatch(setNextOnDisplayAuctionSportsManagerId());
    currentAuction && history.push(`/noun/${currentAuction.sportsManagerId.toNumber() + 1}`);
  };

  const nounContent = currentAuction && (
    <div className={classes.nounWrapper}>
      <StandaloneSportsManagerWithSeed
        sportsManagerId={currentAuction.sportsManagerId}
        onLoadSeed={loadedSportsManagerHandler}
        shouldLinkToProfile={false}
      />
    </div>
  );

  const loadingSportsManager = (
    <div className={classes.nounWrapper}>
      <LoadingSportsManager />
    </div>
  );

  const currentAuctionActivityContent = currentAuction && lastSportsManagerId && (
    <AuctionActivity
      auction={currentAuction}
      isFirstAuction={currentAuction.sportsManagerId.eq(0)}
      isLastAuction={currentAuction.sportsManagerId.eq(lastSportsManagerId)}
      onPrevAuctionClick={prevAuctionHandler}
      onNextAuctionClick={nextAuctionHandler}
      displayGraphDepComps={true}
    />
  );
  const nounderSportsManagerContent = currentAuction && lastSportsManagerId && (
    <SportsManagerFounderNounContent
      mintTimestamp={currentAuction.startTime}
      sportsManagerId={currentAuction.sportsManagerId}
      isFirstAuction={currentAuction.sportsManagerId.eq(0)}
      isLastAuction={currentAuction.sportsManagerId.eq(lastSportsManagerId)}
      onPrevAuctionClick={prevAuctionHandler}
      onNextAuctionClick={nextAuctionHandler}
    />
  );

  return (
    <div style={{ backgroundColor: stateBgColor }} className={classes.wrapper}>
      <Container fluid="xl">
        <Row>
          <Col lg={{ span: 6 }} className={classes.nounContentCol}>
            {currentAuction ? nounContent : loadingSportsManager}
          </Col>
          <Col lg={{ span: 6 }} className={classes.auctionActivityCol}>
            {currentAuction &&
              (isFounderSportsManager(currentAuction.sportsManagerId)
                ? nounderSportsManagerContent
                : currentAuctionActivityContent)}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Auction;

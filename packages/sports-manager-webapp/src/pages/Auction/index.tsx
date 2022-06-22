import Banner from '../../components/Banner';
import Auction from '../../components/Auction';
import Documentation from '../../components/Documentation';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { setOnDisplayAuctionSportsManagerId } from '../../state/slices/onDisplayAuction';
import { push } from 'connected-react-router';
import { nounPath } from '../../utils/history';
import useOnDisplayAuction from '../../wrappers/onDisplayAuction';
import { useEffect } from 'react';
import ProfileActivityFeed from '../../components/ProfileActivityFeed';

interface AuctionPageProps {
  initialAuctionId?: number;
}

const AuctionPage: React.FC<AuctionPageProps> = props => {
  const { initialAuctionId } = props;
  const onDisplayAuction = useOnDisplayAuction();
  const lastAuctionSportsManagerId = useAppSelector(state => state.onDisplayAuction.lastAuctionSportsManagerId);
  const onDisplayAuctionSportsManagerId = onDisplayAuction?.sportsManagerId.toNumber();

  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!lastAuctionSportsManagerId) return;

    if (initialAuctionId !== undefined) {
      // handle out of bounds noun path ids
      if (initialAuctionId > lastAuctionSportsManagerId || initialAuctionId < 0) {
        dispatch(setOnDisplayAuctionSportsManagerId(lastAuctionSportsManagerId));
        dispatch(push(nounPath(lastAuctionSportsManagerId)));
      } else {
        if (onDisplayAuction === undefined) {
          // handle regular noun path ids on first load
          dispatch(setOnDisplayAuctionSportsManagerId(initialAuctionId));
        }
      }
    } else {
      // no noun path id set
      if (lastAuctionSportsManagerId) {
        dispatch(setOnDisplayAuctionSportsManagerId(lastAuctionSportsManagerId));
      }
    }
  }, [lastAuctionSportsManagerId, dispatch, initialAuctionId, onDisplayAuction]);

  return (
    <>
      <Auction auction={onDisplayAuction} />
      {onDisplayAuctionSportsManagerId !== undefined && onDisplayAuctionSportsManagerId !== lastAuctionSportsManagerId ? (
        <ProfileActivityFeed sportsManagerId={onDisplayAuctionSportsManagerId} />
      ) : (
        <Banner />
      )}
      <Documentation />
    </>
  );
};
export default AuctionPage;

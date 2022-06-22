import React from 'react';
import { Col } from 'react-bootstrap';

import classes from './SportsManagerInfoCard.module.css';

import _AddressIcon from '../../assets/icons/Address.svg';
import _BidsIcon from '../../assets/icons/Bids.svg';

import SportsManagerInfoRowBirthday from '../SportsManagerInfoRowBirthday';
import SportsManagerInfoRowHolder from '../SportsManagerInfoRowHolder';
import SportsManagerInfoRowButton from '../SportsManagerInfoRowButton';
import { useAppSelector } from '../../hooks';

import config from '../../config';
import { buildEtherscanAddressLink } from '../../utils/etherscan';
import { Trans } from '@lingui/macro';

interface SportsManagerInfoCardProps {
  sportsManagerId: number;
  bidHistoryOnClickHandler: () => void;
}

const SportsManagerInfoCard: React.FC<SportsManagerInfoCardProps> = props => {
  const { sportsManagerId, bidHistoryOnClickHandler } = props;

  const etherscanBaseURL = buildEtherscanAddressLink(config.addresses.sportsManagerToken);

  const etherscanButtonClickHandler = () => window.open(`${etherscanBaseURL}/${sportsManagerId}`, '_blank');

  const lastAuctionSportsManagerId = useAppSelector(state => state.onDisplayAuction.lastAuctionSportsManagerId);

  return (
    <>
      <Col lg={12} className={classes.sportsManagerInfoRow}>
        <SportsManagerInfoRowBirthday sportsManagerId={sportsManagerId} />
      </Col>
      <Col lg={12} className={classes.sportsManagerInfoRow}>
        <SportsManagerInfoRowHolder sportsManagerId={sportsManagerId} />
      </Col>
      <Col lg={12} className={classes.sportsManagerInfoRow}>
        <SportsManagerInfoRowButton
          iconImgSource={_BidsIcon}
          btnText={lastAuctionSportsManagerId === sportsManagerId ? <Trans>Bids</Trans> : <Trans>Bid history</Trans>}
          onClickHandler={bidHistoryOnClickHandler}
        />
        <SportsManagerInfoRowButton
          iconImgSource={_AddressIcon}
          btnText={<Trans>Etherscan</Trans>}
          onClickHandler={etherscanButtonClickHandler}
        />
      </Col>
    </>
  );
};

export default SportsManagerInfoCard;

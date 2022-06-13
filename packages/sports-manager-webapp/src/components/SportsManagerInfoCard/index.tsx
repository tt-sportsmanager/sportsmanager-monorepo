import React from 'react';
import { Col } from 'react-bootstrap';

import classes from './SportsManagerInfoCard.module.css';

import _AddressIcon from '../../assets/icons/Address.svg';
import _BidsIcon from '../../assets/icons/Bids.svg';

import NounInfoRowBirthday from '../NounInfoRowBirthday';
import NounInfoRowHolder from '../SportsManagerInfoRowHolder';
import NounInfoRowButton from '../NounInfoRowButton';
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

  const lastAuctionSportsManagerId = useAppSelector(state => state.onDisplayAuction.lastAuctionNounId);

  return (
    <>
      <Col lg={12} className={classes.sportsManagerInfoRow}>
        <NounInfoRowBirthday sportsManagerId={sportsManagerId} />
      </Col>
      <Col lg={12} className={classes.sportsManagerInfoRow}>
        <NounInfoRowHolder sportsManagerId={sportsManagerId} />
      </Col>
      <Col lg={12} className={classes.sportsManagerInfoRow}>
        <NounInfoRowButton
          iconImgSource={_BidsIcon}
          btnText={lastAuctionSportsManagerId === sportsManagerId ? <Trans>Bids</Trans> : <Trans>Bid history</Trans>}
          onClickHandler={bidHistoryOnClickHandler}
        />
        <NounInfoRowButton
          iconImgSource={_AddressIcon}
          btnText={<Trans>Etherscan</Trans>}
          onClickHandler={etherscanButtonClickHandler}
        />
      </Col>
    </>
  );
};

export default SportsManagerInfoCard;

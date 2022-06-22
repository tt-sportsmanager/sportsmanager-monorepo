import { BigNumber } from '@ethersproject/bignumber';
import React from 'react';
import { isFounderSportsManager } from '../../utils/founderSportsManager';

import classes from './SportsManagerInfoRowBirthday.module.css';
import _BirthdayIcon from '../../assets/icons/Birthday.svg';

import { Image } from 'react-bootstrap';
import { useAppSelector } from '../../hooks';
import { AuctionState } from '../../state/slices/auction';
import { Trans } from '@lingui/macro';
import { i18n } from '@lingui/core';

interface SportsManagerInfoRowBirthdayProps {
  sportsManagerId: number;
}

const SportsManagerInfoRowBirthday: React.FC<SportsManagerInfoRowBirthdayProps> = props => {
  const { sportsManagerId } = props;

  // If the sports manager is a sports manager founder sports manager, use the next sports manager to get the mint date.
  // We do this because we use the auction start time to get the mint date and
  // sports manager founder sports manager do not have an auction start time.
  const sportsManagerIdForQuery = isFounderSportsManager(BigNumber.from(sportsManagerId)) ? sportsManagerId + 1 : sportsManagerId;

  const pastAuctions = useAppSelector(state => state.pastAuctions.pastAuctions);
  if (!pastAuctions || !pastAuctions.length) {
    return <></>;
  }

  const startTime = BigNumber.from(
    pastAuctions.find((auction: AuctionState, i: number) => {
      const maybeSportsManagerId = auction.activeAuction?.sportsManagerId;
      return maybeSportsManagerId ? BigNumber.from(maybeSportsManagerId).eq(BigNumber.from(sportsManagerIdForQuery)) : false;
    })?.activeAuction?.startTime || 0,
  );

  if (!startTime) {
    return <Trans>Error fetching SportsManager birthday</Trans>;
  }

  const birthday = new Date(Number(startTime._hex) * 1000);

  return (
    <div className={classes.birthdayInfoContainer}>
      <span>
        <Image src={_BirthdayIcon} className={classes.birthdayIcon} />
      </span>
      <Trans>Born</Trans>
      <span className={classes.nounInfoRowBirthday}>
        {i18n.date(birthday, { month: 'long', year: 'numeric', day: '2-digit' })}
      </span>
    </div>
  );
};

export default SportsManagerInfoRowBirthday;

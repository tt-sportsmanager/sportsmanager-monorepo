import React from 'react';
import { Image } from 'react-bootstrap';
import classes from './SportsManagerInfoRowButton.module.css';
import { useAppSelector } from '../../hooks';

interface SportsManagerInfoRowButtonProps {
  iconImgSource: string;
  btnText: React.ReactNode;
  onClickHandler: () => void;
}

const SportsManagerInfoRowButton: React.FC<SportsManagerInfoRowButtonProps> = props => {
  const { iconImgSource, btnText, onClickHandler } = props;
  const isCool = useAppSelector(state => state.application.isCoolBackground);
  return (
    <div
      className={isCool ? classes.sportsManagerButtonCool : classes.sportsManagerButtonWarm}
      onClick={onClickHandler}
    >
      <div className={classes.sportsManagerButtonContents}>
        <Image src={iconImgSource} className={classes.buttonIcon} />
        {btnText}
      </div>
    </div>
  );
};

export default SportsManagerInfoRowButton;

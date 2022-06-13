import classes from './SportsManager.module.css';
import React from 'react';
import loadingSportsManager from '../../assets/loading-skull-noun.gif';
import Image from 'react-bootstrap/Image';

export const LoadingSportsManager = () => {
  return (
    <div className={classes.imgWrapper}>
      <Image className={classes.img} src={loadingSportsManager} alt={'loading noun'} fluid />
    </div>
  );
};

const SportsManager: React.FC<{
  imgPath: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
}> = props => {
  const { imgPath, alt, className, wrapperClassName } = props;
  return (
    <div className={`${classes.imgWrapper} ${wrapperClassName}`}>
      <Image
        className={`${classes.img} ${className}`}
        src={imgPath ? imgPath : loadingSportsManager}
        alt={alt}
        fluid
      />
    </div>
  );
};

export default SportsManager;

import { getGrayBackgroundSVG } from '../../utils/grayBackgroundSVG';
import nounClasses from '../SportsManager/SportsManager.module.css';
import SportsManager from '../SportsManager';

export const GrayCircle = () => {
  return (
    <SportsManager
      imgPath={getGrayBackgroundSVG()}
      alt={''}
      wrapperClassName={nounClasses.circularNounWrapper}
      className={nounClasses.circular}
    />
  );
};

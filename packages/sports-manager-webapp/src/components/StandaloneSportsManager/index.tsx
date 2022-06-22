import { ImageData as data, getSportsManagerData } from '@sports-manager/assets';
import { buildSVG } from '@sports-manager/sdk';
import { BigNumber as EthersBN } from 'ethers';
import { ISportsManagerSeed, useSportsManagerSeed } from '../../wrappers/sportsManagerToken';
import SportsManager from '../SportsManager';
import { Link } from 'react-router-dom';
import classes from './StandaloneSportsManager.module.css';
import { useDispatch } from 'react-redux';
import { setOnDisplayAuctionSportsManagerId } from '../../state/slices/onDisplayAuction';
import nounClasses from '../SportsManager/SportsManager.module.css';

interface StandaloneSportsManagerProps {
  sportsManagerId: EthersBN;
}
interface StandaloneCircularSportsManagerProps {
  sportsManagerId: EthersBN;
}

interface StandaloneSportsManagerWithSeedProps {
  sportsManagerId: EthersBN;
  onLoadSeed?: (seed: ISportsManagerSeed) => void;
  shouldLinkToProfile: boolean;
}

const getSportsManager = (sportsManagerId: string | EthersBN, seed: ISportsManagerSeed) => {
  const id = sportsManagerId.toString();
  const name = `SportsManager ${id}`;
  const description = `SportsManager ${id} is a member of the Sports Manager DAO`;
  const { parts, background } = getSportsManagerData(seed);
  const image = `data:image/svg+xml;base64,${btoa(buildSVG(parts, data.palette, background))}`;

  return {
    name,
    description,
    image,
  };
};

const StandaloneSportsManager: React.FC<StandaloneSportsManagerProps> = (props: StandaloneSportsManagerProps) => {
  const { sportsManagerId } = props;
  const seed = useSportsManagerSeed(sportsManagerId);
  const noun = seed && getSportsManager(sportsManagerId, seed);

  const dispatch = useDispatch();

  const onClickHandler = () => {
    dispatch(setOnDisplayAuctionSportsManagerId(sportsManagerId.toNumber()));
  };

  return (
    <Link
      to={'/noun/' + sportsManagerId.toString()}
      className={classes.clickableSportsManager}
      onClick={onClickHandler}
    >
      <SportsManager imgPath={noun ? noun.image : ''} alt={noun ? noun.description : 'SportsManager'} />
    </Link>
  );
};

export const StandaloneSportsManagerCircular: React.FC<StandaloneCircularSportsManagerProps> = (
  props: StandaloneCircularSportsManagerProps,
) => {
  const { sportsManagerId } = props;
  const seed = useSportsManagerSeed(sportsManagerId);
  const noun = seed && getSportsManager(sportsManagerId, seed);

  const dispatch = useDispatch();
  const onClickHandler = () => {
    dispatch(setOnDisplayAuctionSportsManagerId(sportsManagerId.toNumber()));
  };

  return (
    <Link
      to={'/noun/' + sportsManagerId.toString()}
      className={classes.clickableSportsManager}
      onClick={onClickHandler}
    >
      <SportsManager
        imgPath={noun ? noun.image : ''}
        alt={noun ? noun.description : 'SportsManager'}
        wrapperClassName={nounClasses.circularSportsManagerWrapper}
        className={nounClasses.circular}
      />
    </Link>
  );
};

export const StandaloneSportsManagerRoundedCorners: React.FC<StandaloneSportsManagerProps> = (
  props: StandaloneSportsManagerProps,
) => {
  const { sportsManagerId } = props;
  const seed = useSportsManagerSeed(sportsManagerId);
  const noun = seed && getSportsManager(sportsManagerId, seed);

  const dispatch = useDispatch();
  const onClickHandler = () => {
    dispatch(setOnDisplayAuctionSportsManagerId(sportsManagerId.toNumber()));
  };

  return (
    <Link
      to={'/noun/' + sportsManagerId.toString()}
      className={classes.clickableSportsManager}
      onClick={onClickHandler}
    >
      <SportsManager
        imgPath={noun ? noun.image : ''}
        alt={noun ? noun.description : 'SportsManager'}
        className={nounClasses.rounded}
      />
    </Link>
  );
};

export const StandaloneSportsManagerWithSeed: React.FC<StandaloneSportsManagerWithSeedProps> = (
  props: StandaloneSportsManagerWithSeedProps,
) => {
  const { sportsManagerId, onLoadSeed, shouldLinkToProfile } = props;

  const dispatch = useDispatch();
  const seed = useSportsManagerSeed(sportsManagerId);
  const seedIsInvalid = Object.values(seed || {}).every(v => v === 0);

  if (!seed || seedIsInvalid || !sportsManagerId || !onLoadSeed) return <SportsManager imgPath="" alt="SportsManager" />;

  onLoadSeed(seed);

  const onClickHandler = () => {
    dispatch(setOnDisplayAuctionSportsManagerId(sportsManagerId.toNumber()));
  };

  const { image, description } = getSportsManager(sportsManagerId, seed);

  const noun = <SportsManager imgPath={image} alt={description} />;
  const nounWithLink = (
    <Link
      to={'/noun/' + sportsManagerId.toString()}
      className={classes.clickableSportsManager}
      onClick={onClickHandler}
    >
      {noun}
    </Link>
  );
  return shouldLinkToProfile ? nounWithLink : noun;
};

export default StandaloneSportsManager;

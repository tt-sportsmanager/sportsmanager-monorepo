import { ImageData as data, getNounData } from '@sports-manager/assets';
import { buildSVG } from '@sports-manager/sdk';
import { BigNumber as EthersBN } from 'ethers';
import { INounSeed, useNounSeed } from '../../wrappers/sportsManagerToken';
import Noun from '../SportsManager';
import { Link } from 'react-router-dom';
import classes from './StandaloneNoun.module.css';
import { useDispatch } from 'react-redux';
import { setOnDisplayAuctionNounId } from '../../state/slices/onDisplayAuction';
import nounClasses from '../SportsManager/SportsManager.module.css';

interface StandaloneNounProps {
  sportsManagerId: EthersBN;
}
interface StandaloneCircularNounProps {
  sportsManagerId: EthersBN;
}

interface StandaloneNounWithSeedProps {
  sportsManagerId: EthersBN;
  onLoadSeed?: (seed: INounSeed) => void;
  shouldLinkToProfile: boolean;
}

const getNoun = (sportsManagerId: string | EthersBN, seed: INounSeed) => {
  const id = sportsManagerId.toString();
  const name = `Noun ${id}`;
  const description = `Noun ${id} is a member of the Nouns DAO`;
  const { parts, background } = getNounData(seed);
  const image = `data:image/svg+xml;base64,${btoa(buildSVG(parts, data.palette, background))}`;

  return {
    name,
    description,
    image,
  };
};

const StandaloneNoun: React.FC<StandaloneNounProps> = (props: StandaloneNounProps) => {
  const { sportsManagerId } = props;
  const seed = useNounSeed(sportsManagerId);
  const noun = seed && getNoun(sportsManagerId, seed);

  const dispatch = useDispatch();

  const onClickHandler = () => {
    dispatch(setOnDisplayAuctionNounId(sportsManagerId.toNumber()));
  };

  return (
    <Link
      to={'/noun/' + sportsManagerId.toString()}
      className={classes.clickableNoun}
      onClick={onClickHandler}
    >
      <Noun imgPath={noun ? noun.image : ''} alt={noun ? noun.description : 'Noun'} />
    </Link>
  );
};

export const StandaloneNounCircular: React.FC<StandaloneCircularNounProps> = (
  props: StandaloneCircularNounProps,
) => {
  const { sportsManagerId } = props;
  const seed = useNounSeed(sportsManagerId);
  const noun = seed && getNoun(sportsManagerId, seed);

  const dispatch = useDispatch();
  const onClickHandler = () => {
    dispatch(setOnDisplayAuctionNounId(sportsManagerId.toNumber()));
  };

  return (
    <Link
      to={'/noun/' + sportsManagerId.toString()}
      className={classes.clickableNoun}
      onClick={onClickHandler}
    >
      <Noun
        imgPath={noun ? noun.image : ''}
        alt={noun ? noun.description : 'Noun'}
        wrapperClassName={nounClasses.circularNounWrapper}
        className={nounClasses.circular}
      />
    </Link>
  );
};

export const StandaloneNounRoundedCorners: React.FC<StandaloneNounProps> = (
  props: StandaloneNounProps,
) => {
  const { sportsManagerId } = props;
  const seed = useNounSeed(sportsManagerId);
  const noun = seed && getNoun(sportsManagerId, seed);

  const dispatch = useDispatch();
  const onClickHandler = () => {
    dispatch(setOnDisplayAuctionNounId(sportsManagerId.toNumber()));
  };

  return (
    <Link
      to={'/noun/' + sportsManagerId.toString()}
      className={classes.clickableNoun}
      onClick={onClickHandler}
    >
      <Noun
        imgPath={noun ? noun.image : ''}
        alt={noun ? noun.description : 'Noun'}
        className={nounClasses.rounded}
      />
    </Link>
  );
};

export const StandaloneNounWithSeed: React.FC<StandaloneNounWithSeedProps> = (
  props: StandaloneNounWithSeedProps,
) => {
  const { sportsManagerId, onLoadSeed, shouldLinkToProfile } = props;

  const dispatch = useDispatch();
  const seed = useNounSeed(sportsManagerId);
  const seedIsInvalid = Object.values(seed || {}).every(v => v === 0);

  if (!seed || seedIsInvalid || !sportsManagerId || !onLoadSeed) return <Noun imgPath="" alt="Noun" />;

  onLoadSeed(seed);

  const onClickHandler = () => {
    dispatch(setOnDisplayAuctionNounId(sportsManagerId.toNumber()));
  };

  const { image, description } = getNoun(sportsManagerId, seed);

  const noun = <Noun imgPath={image} alt={description} />;
  const nounWithLink = (
    <Link
      to={'/noun/' + sportsManagerId.toString()}
      className={classes.clickableNoun}
      onClick={onClickHandler}
    >
      {noun}
    </Link>
  );
  return shouldLinkToProfile ? nounWithLink : noun;
};

export default StandaloneNoun;

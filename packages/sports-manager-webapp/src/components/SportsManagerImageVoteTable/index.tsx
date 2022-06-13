import { StandaloneNounCircular } from '../StandaloneNoun';
import { BigNumber as EthersBN } from 'ethers';
import classes from './SportsManagerImageVoteTable.module.css';
import { GrayCircle } from '../GrayCircle';
import { pseudoRandomPredictableShuffle } from '../../utils/pseudoRandomPredictableShuffle';

interface SportsManagerImageVoteTableProps {
  sportsManagerIdArray: string[];
  propId: number;
}
const NOUNS_PER_VOTE_CARD_DESKTOP = 15;

const isXLScreen = window.innerWidth > 1200;

const SportsManagerImageVoteTable: React.FC<SportsManagerImageVoteTableProps> = props => {
  const { sportsManagerIdArray, propId } = props;

  const shuffledSportsManagerIds = pseudoRandomPredictableShuffle(sportsManagerIdArray, propId);
  const paddedSportsManagerIds = shuffledSportsManagerIds
    .map((sportsManagerId: string) => {
      return <StandaloneNounCircular sportsManagerId={EthersBN.from(sportsManagerId)} />;
    })
    .concat(Array(NOUNS_PER_VOTE_CARD_DESKTOP).fill(<GrayCircle />))
    .slice(0, NOUNS_PER_VOTE_CARD_DESKTOP);

  const content = () => {
    const rows = 3;
    const rowLength = isXLScreen ? 5 : 4;

    return Array(rows)
      .fill(0)
      .map((_, i) => (
        <tr key={i}>
          {Array(rowLength)
            .fill(0)
            .map((_, j) => (
              <td key={j}>{paddedSportsManagerIds[i * rowLength + j]}</td>
            ))}
        </tr>
      ));
  };

  return (
    <table className={classes.wrapper}>
      <tbody>{content()}</tbody>
    </table>
  );
};

export default SportsManagerImageVoteTable;

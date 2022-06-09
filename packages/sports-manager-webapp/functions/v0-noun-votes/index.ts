import { Handler } from '@netlify/functions';
import { NormalizedVote, sportsManagerQuery } from '../theGraph';
import * as R from 'ramda';
import { sharedResponseHeaders } from '../utils';

interface SportsManagerVote {
  id: number;
  owner: string;
  delegatedTo: null | string;
  votes: NormalizedVote[];
}

const buildSportsManagerVote = R.pick(['id', 'owner', 'delegatedTo', 'votes']);

const buildSportsManagerVoteMap = R.map(buildSportsManagerVote);

const handler: Handler = async (event, context) => {
  const sportsManager = await sportsManagerQuery();
  const sportsManagerVoteArray: SportsManagerVote[] = buildSportsManagerVoteMap(sportsManager);
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      ...sharedResponseHeaders,
    },
    body: JSON.stringify(sportsManagerVoteArray),
  };
};

export { handler };

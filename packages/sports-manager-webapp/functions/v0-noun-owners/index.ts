import { Handler } from '@netlify/functions';
import { sportsManagerQuery } from '../theGraph';
import * as R from 'ramda';
import { sharedResponseHeaders } from '../utils';

export interface LiteSportsManager {
  id: number;
  owner: string;
  delegatedTo: null | string;
}

const lightenSportsManager = R.pick(['id', 'owner', 'delegatedTo']);

const lightenSportsManagerMap = R.map(lightenSportsManager);

const handler: Handler = async (event, context) => {
  const sportsManager = await sportsManagerQuery();
  const liteSportsManagerArray: LiteSportsManager[] = lightenSportsManagerMap(sportsManager);
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      ...sharedResponseHeaders,
    },
    body: JSON.stringify(liteSportsManagerArray),
  };
};

export { handler };

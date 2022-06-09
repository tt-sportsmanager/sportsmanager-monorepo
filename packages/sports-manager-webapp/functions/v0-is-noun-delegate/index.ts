import { Handler } from '@netlify/functions';
import { isSportsManagerDelegate, sportsManagerQuery } from '../theGraph';
import { sharedResponseHeaders } from '../utils';

const handler: Handler = async (event, context) => {
  const sportsManager = await sportsManagerQuery();
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      ...sharedResponseHeaders,
    },
    body: JSON.stringify(isSportsManagerDelegate(event.body, sportsManager)),
  };
};

export { handler };

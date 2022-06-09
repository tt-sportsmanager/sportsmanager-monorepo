import { Handler } from '@netlify/functions';
import { NormalizedSportsManager, NormalizedVote, sportsManagerQuery } from '../theGraph';
import { sharedResponseHeaders } from '../utils';

interface ProposalVote {
  sportsManagerId: number;
  owner: string;
  delegatedTo: null | string;
  supportDetailed: number;
}

interface ProposalVotes {
  [key: number]: ProposalVote[];
}

const builtProposalVote = (sportsManager: NormalizedSportsManager, vote: NormalizedVote): ProposalVote => ({
  sportsManagerId: sportsManager.id,
  owner: sportsManager.owner,
  delegatedTo: sportsManager.delegatedTo,
  supportDetailed: vote.supportDetailed,
});

const reduceProposalVotes = (sportsManager: NormalizedSportsManager[]) =>
  sportsManager.reduce((acc: ProposalVotes, sportsManager: NormalizedSportsManager) => {
    for (let i in sportsManager.votes) {
      const vote = sportsManager.votes[i];
      if (!acc[vote.proposalId]) acc[vote.proposalId] = [];
      acc[vote.proposalId].push(builtProposalVote(sportsManager, vote));
    }
    return acc;
  }, {});

const handler: Handler = async (event, context) => {
  const sportsManager = await sportsManagerQuery();
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      ...sharedResponseHeaders,
    },
    body: JSON.stringify(reduceProposalVotes(sportsManager)),
  };
};

export { handler };

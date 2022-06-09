import axios from 'axios';
import * as R from 'ramda';
import config from '../src/config';
import { bigNumbersEqual } from './utils';

export interface NormalizedVote {
  proposalId: number;
  supportDetailed: number;
}

export interface Seed {
  background: number;
  body: number;
  accessory: number;
  head: number;
  glasses: number;
}

export interface NormalizedSportsManager {
  id: number;
  owner: string;
  delegatedTo: null | string;
  votes: NormalizedVote[];
  seed: Seed;
}

const sportsManagerGql = `
{
  sportsManager {
    id
    owner {
      id
	    delegate {
		    id
	    }
    }
    votes {
      proposal {
        id
      }
      supportDetailed
    }
    seed {
      background
      body
      accessory
      head
      glasses
    }
  }
}
`;

export const normalizeVote = (vote: any): NormalizedVote => ({
  proposalId: Number(vote.proposal.id),
  supportDetailed: Number(vote.supportDetailed),
});

export const normalizeSeed = (seed: any): Seed => ({
  background: Number(seed.background),
  body: Number(seed.body),
  glasses: Number(seed.glasses),
  accessory: Number(seed.accessory),
  head: Number(seed.head),
});

export const normalizeSportsManager = (sportsManager: any): NormalizedSportsManager => ({
  id: Number(sportsManager.id),
  owner: sportsManager.owner.id,
  delegatedTo: sportsManager.owner.delegate?.id,
  votes: normalizeVotes(sportsManager.votes),
  seed: normalizeSeed(sportsManager.seed),
});

export const normalizeSportsManagerMap = R.map(normalizeSportsManager);

export const normalizeVotes = R.map(normalizeVote);

export const ownerFilterFactory = (address: string) =>
  R.filter((sportsManager: any) => bigNumbersEqual(address, sportsManager.owner));

export const isSportsManagerOwner = (address: string, sportsManager: NormalizedSportsManager[]) =>
  ownerFilterFactory(address)(sportsManager).length > 0;

export const delegateFilterFactory = (address: string) =>
  R.filter((sportsManager: any) => sportsManager.delegatedTo && bigNumbersEqual(address, sportsManager.delegatedTo));

export const isSportsManagerDelegate = (address: string, sportsManager: NormalizedSportsManager[]) =>
  delegateFilterFactory(address)(sportsManager).length > 0;

export const sportsManagerQuery = async () =>
  normalizeSportsManagerMap(
    (await axios.post(config.app.subgraphApiUri, { query: sportsManagerGql })).data.data.sportsManager,
  );

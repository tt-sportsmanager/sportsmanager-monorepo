import { useContractCall, useEthers } from '@usedapp/core';
import { BigNumber as EthersBN, utils } from 'ethers';
import { SportsManagerTokenABI } from '@sports-manager/contracts';
import config, { cache, cacheKey, CHAIN_ID } from '../config';
import { useQuery } from '@apollo/client';
import { seedsQuery } from './subgraph';
import { useEffect } from 'react';

interface SportsManagerToken {
  name: string;
  description: string;
  image: string;
}

export interface ISportsManagerSeed {
  accessory: number;
  background: number;
  body: number;
  glasses: number;
  head: number;
}

const abi = new utils.Interface(SportsManagerTokenABI.abi);
const seedCacheKey = cacheKey(cache.seed, CHAIN_ID, config.addresses.sportsManagerToken);

const isSeedValid = (seed: Record<string, any> | undefined) => {
  const expectedKeys = ['background', 'body', 'accessory', 'head', 'glasses'];
  const hasExpectedKeys = expectedKeys.every(key => (seed || {}).hasOwnProperty(key));
  const hasValidValues = Object.values(seed || {}).some(v => v !== 0);
  return hasExpectedKeys && hasValidValues;
};

export const useSportsManagerToken = (nounId: EthersBN) => {
  const [noun] =
    useContractCall<[string]>({
      abi,
      address: config.addresses.sportsManagerToken,
      method: 'dataURI',
      args: [nounId],
    }) || [];

  if (!noun) {
    return;
  }

  const nounImgData = noun.split(';base64,').pop() as string;
  const json: SportsManagerToken = JSON.parse(atob(nounImgData));

  return json;
};

const seedArrayToObject = (seeds: (ISportsManagerSeed & { id: string })[]) => {
  return seeds.reduce<Record<string, ISportsManagerSeed>>((acc, seed) => {
    acc[seed.id] = {
      background: Number(seed.background),
      body: Number(seed.body),
      accessory: Number(seed.accessory),
      head: Number(seed.head),
      glasses: Number(seed.glasses),
    };
    return acc;
  }, {});
};

const useSportsManagerSeeds = () => {
  const cache = localStorage.getItem(seedCacheKey);
  const cachedSeeds = cache ? JSON.parse(cache) : undefined;
  const { data } = useQuery(seedsQuery(), {
    skip: !!cachedSeeds,
  });

  useEffect(() => {
    if (!cachedSeeds && data?.seeds?.length) {
      localStorage.setItem(seedCacheKey, JSON.stringify(seedArrayToObject(data.seeds)));
    }
  }, [data, cachedSeeds]);

  return cachedSeeds;
};

export const useSportsManagerSeed = (nounId: EthersBN) => {
  const seeds = useSportsManagerSeeds();
  const seed = seeds?.[nounId.toString()];
  // prettier-ignore
  const request = seed ? false : {
    abi,
    address: config.addresses.sportsManagerToken,
    method: 'seeds',
    args: [nounId],
  };
  const response = useContractCall<ISportsManagerSeed>(request);
  if (response) {
    const seedCache = localStorage.getItem(seedCacheKey);
    if (seedCache && isSeedValid(response)) {
      const updatedSeedCache = JSON.stringify({
        ...JSON.parse(seedCache),
        [nounId.toString()]: {
          accessory: response.accessory,
          background: response.background,
          body: response.body,
          glasses: response.glasses,
          head: response.head,
        },
      });
      localStorage.setItem(seedCacheKey, updatedSeedCache);
    }
    return response;
  }
  return seed;
};

export const useUserVotes = (): number | undefined => {
  const { account } = useEthers();
  const [votes] =
    useContractCall<[EthersBN]>({
      abi,
      address: config.addresses.sportsManagerToken,
      method: 'getCurrentVotes',
      args: [account],
    }) || [];
  return votes?.toNumber();
};

export const useUserDelegatee = (): string | undefined => {
  const { account } = useEthers();
  const [delegate] =
    useContractCall<[string]>({
      abi,
      address: config.addresses.sportsManagerToken,
      method: 'delegates',
      args: [account],
    }) || [];
  return delegate;
};

export const useUserVotesAsOfBlock = (block: number | undefined): number | undefined => {
  const { account } = useEthers();

  // Check for available votes
  const [votes] =
    useContractCall<[EthersBN]>({
      abi,
      address: config.addresses.sportsManagerToken,
      method: 'getPriorVotes',
      args: [account, block],
    }) || [];
  return votes?.toNumber();
};

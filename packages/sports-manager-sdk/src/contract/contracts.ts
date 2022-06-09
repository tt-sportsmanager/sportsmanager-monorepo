import {
  SportsManagerTokenFactory,
  SportsManagerAuctionHouseFactory,
  SportsManagerDescriptorFactory,
  SportsManagerSeederFactory,
  SportsManagerDaoLogicV1Factory,
} from '@sports-manager/contracts';
import type { Signer } from 'ethers';
import type { Provider } from '@ethersproject/providers';
import { getContractAddressesForChainOrThrow } from './addresses';
import { Contracts } from './types';

/**
 * Get contract instances that target the Ethereum mainnet
 * or a supported testnet. Throws if there are no known contracts
 * deployed on the corresponding chain.
 * @param chainId The desired chain id
 * @param signerOrProvider The ethers v5 signer or provider
 */
export const getContractsForChainOrThrow = (
  chainId: number,
  signerOrProvider?: Signer | Provider,
): Contracts => {
  const addresses = getContractAddressesForChainOrThrow(chainId);

  return {
    sportsManagerTokenContract: SportsManagerTokenFactory.connect(
      addresses.sportsManagerToken,
      signerOrProvider as Signer | Provider,
    ),
    sportsManagerAuctionHouseContract: SportsManagerAuctionHouseFactory.connect(
      addresses.sportsManagerAuctionHouseProxy,
      signerOrProvider as Signer | Provider,
    ),
    sportsManagerDescriptorContract: SportsManagerDescriptorFactory.connect(
      addresses.sportsManagerDescriptor,
      signerOrProvider as Signer | Provider,
    ),
    sportsManagerSeederContract: SportsManagerSeederFactory.connect(
      addresses.sportsManagerSeeder,
      signerOrProvider as Signer | Provider,
    ),
    sportsManagerDaoContract: SportsManagerDaoLogicV1Factory.connect(
      addresses.sportsManagerDAOProxy,
      signerOrProvider as Signer | Provider,
    ),
  };
};

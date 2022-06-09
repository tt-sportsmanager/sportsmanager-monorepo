import { default as SportsManagerAuctionHouseABI } from '../abi/contracts/SportsManagerAuctionHouse.sol/SportsManagerAuctionHouse.json';
import { task, types } from 'hardhat/config';
import { Interface } from 'ethers/lib/utils';
import { Contract as EthersContract } from 'ethers';
import { ContractName } from './types';

type LocalContractName = ContractName | 'WETH';

interface Contract {
  args?: (string | number | (() => string | undefined))[];
  instance?: EthersContract;
  libraries?: () => Record<string, string>;
  waitForConfirmation?: boolean;
}

task('deploy-local', 'Deploy contracts to hardhat')
  .addOptionalParam('sportsManagerdao', 'The sportsManager DAO contract address')
  .addOptionalParam('auctionTimeBuffer', 'The auction time buffer (seconds)', 30, types.int) // Default: 30 seconds
  .addOptionalParam('auctionReservePrice', 'The auction reserve price (wei)', 1, types.int) // Default: 1 wei
  .addOptionalParam(
    'auctionMinIncrementBidPercentage',
    'The auction min increment bid percentage (out of 100)', // Default: 5%
    5,
    types.int,
  )
  .addOptionalParam('auctionDuration', 'The auction duration (seconds)', 60 * 2, types.int) // Default: 2 minutes
  .addOptionalParam('timelockDelay', 'The timelock delay (seconds)', 60 * 60 * 24 * 2, types.int) // Default: 2 days
  .addOptionalParam('votingPeriod', 'The voting period (blocks)', 4 * 60 * 24 * 3, types.int) // Default: 3 days
  .addOptionalParam('votingDelay', 'The voting delay (blocks)', 1, types.int) // Default: 1 block
  .addOptionalParam('proposalThresholdBps', 'The proposal threshold (basis points)', 500, types.int) // Default: 5%
  .addOptionalParam('quorumVotesBps', 'Votes required for quorum (basis points)', 1_000, types.int) // Default: 10%
  .setAction(async (args, { ethers }) => {
    const network = await ethers.provider.getNetwork();
    if (network.chainId !== 31337) {
      console.log(`Invalid chain id. Expected 31337. Got: ${network.chainId}.`);
      return;
    }

    const proxyRegistryAddress = '0xa5409ec958c83c3f309868babaca7c86dcb077c1';

    const AUCTION_HOUSE_PROXY_NONCE_OFFSET = 7;
    const GOVERNOR_N_DELEGATOR_NONCE_OFFSET = 10;

    const [deployer] = await ethers.getSigners();
    const nonce = await deployer.getTransactionCount();
    const expectedSportsManagerDAOProxyAddress = ethers.utils.getContractAddress({
      from: deployer.address,
      nonce: nonce + GOVERNOR_N_DELEGATOR_NONCE_OFFSET,
    });
    const expectedAuctionHouseProxyAddress = ethers.utils.getContractAddress({
      from: deployer.address,
      nonce: nonce + AUCTION_HOUSE_PROXY_NONCE_OFFSET,
    });
    const contracts: Record<LocalContractName, Contract> = {
      WETH: {},
      NFTDescriptor: {},
      SportsManagerDescriptor: {
        libraries: () => ({
          NFTDescriptor: contracts.NFTDescriptor.instance?.address as string,
        }),
      },
      SportsManagerSeeder: {},
      SportsManagerToken: {
        args: [
          args.sportsManagerdao || deployer.address,
          expectedAuctionHouseProxyAddress,
          () => contracts.SportsManagerDescriptor.instance?.address,
          () => contracts.SportsManagerSeeder.instance?.address,
          proxyRegistryAddress,
        ],
      },
      SportsManagerAuctionHouse: {
        waitForConfirmation: true,
      },
      SportsManagerAuctionHouseProxyAdmin: {},
      SportsManagerAuctionHouseProxy: {
        args: [
          () => contracts.SportsManagerAuctionHouse.instance?.address,
          () => contracts.SportsManagerAuctionHouseProxyAdmin.instance?.address,
          () =>
            new Interface(SportsManagerAuctionHouseABI.abi).encodeFunctionData('initialize', [
              contracts.SportsManagerToken.instance?.address,
              contracts.WETH.instance?.address,
              args.auctionTimeBuffer,
              args.auctionReservePrice,
              args.auctionMinIncrementBidPercentage,
              args.auctionDuration,
            ]),
        ],
      },
      SportsManagerDAOExecutor: {
        args: [expectedSportsManagerDAOProxyAddress, args.timelockDelay],
      },
      SportsManagerDAOLogicV1: {
        waitForConfirmation: true,
      },
      SportsManagerDAOProxy: {
        args: [
          () => contracts.SportsManagerDAOExecutor.instance?.address,
          () => contracts.SportsManagerToken.instance?.address,
          args.sportsManagerdao || deployer.address,
          () => contracts.SportsManagerDAOExecutor.instance?.address,
          () => contracts.SportsManagerDAOLogicV1.instance?.address,
          args.votingPeriod,
          args.votingDelay,
          args.proposalThresholdBps,
          args.quorumVotesBps,
        ],
      },
    };

    for (const [name, contract] of Object.entries(contracts)) {
      const factory = await ethers.getContractFactory(name, {
        libraries: contract?.libraries?.(),
      });

      const deployedContract = await factory.deploy(
        ...(contract.args?.map(a => (typeof a === 'function' ? a() : a)) ?? []),
      );

      if (contract.waitForConfirmation) {
        await deployedContract.deployed();
      }

      contracts[name as ContractName].instance = deployedContract;

      console.log(`${name} contract deployed to ${deployedContract.address}`);
    }

    return contracts;
  });

import { task } from 'hardhat/config';
import { DeployedContract } from './types';

interface ContractRow {
  Address: string;
  'Deployment Hash'?: string;
}

task('deploy-and-configure', 'Deploy and configure all contracts')
  .addFlag('startAuction', 'Start the first auction upon deployment completion')
  .addFlag('autoDeploy', 'Deploy all contracts without user interaction')
  .addFlag('updateConfigs', 'Write the deployed addresses to the SDK and subgraph configs')
  .addOptionalParam('weth', 'The WETH contract address')
  .addOptionalParam('noundersdao', 'The nounders DAO contract address')
  .addOptionalParam('auctionTimeBuffer', 'The auction time buffer (seconds)')
  .addOptionalParam('auctionReservePrice', 'The auction reserve price (wei)')
  .addOptionalParam(
    'auctionMinIncrementBidPercentage',
    'The auction min increment bid percentage (out of 100)',
  )
  .addOptionalParam('auctionDuration', 'The auction duration (seconds)')
  .addOptionalParam('timelockDelay', 'The timelock delay (seconds)')
  .addOptionalParam('votingPeriod', 'The voting period (blocks)')
  .addOptionalParam('votingDelay', 'The voting delay (blocks)')
  .addOptionalParam('proposalThresholdBps', 'The proposal threshold (basis points)')
  .addOptionalParam('quorumVotesBps', 'Votes required for quorum (basis points)')
  .setAction(async (args, { run }) => {
    // Deploy the SportsManager DAO contracts and return deployment information
    const contracts = await run('deploy', args);

    // Verify the contracts on Etherscan
    await run('verify-etherscan', {
      contracts,
    });

    // Optionally write the deployed addresses to the SDK and subgraph configs.
    if (args.updateConfigs) {
      await run('update-configs', {
        contracts,
      });
    }

    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('RUNNING POPULATE DESCRIPTOR');
    // Populate the on-chain art
    await run('populate-descriptor', {
      nftDescriptor: contracts.NFTDescriptor.address,
      sportsManagerDescriptor: contracts.SportsManagerDescriptor.address,
    });
    console.log('POPUPLATE DESCRIPTOR FINISHED');

    // Transfer ownership of all contract except for the auction house.
    // We must maintain ownership of the auction house to kick off the first auction.
    const executorAddress = contracts.SportsManagerDAOExecutor.address;
    await contracts.SportsManagerDescriptor.instance.transferOwnership(executorAddress);
    await contracts.SportsManagerToken.instance.transferOwnership(executorAddress);
    await contracts.SportsManagerAuctionHouseProxyAdmin.instance.transferOwnership(executorAddress);
    console.log(
      'Transferred ownership of the descriptor, token, and proxy admin contracts to the executor.',
    );

    // Optionally kick off the first auction and transfer ownership of the auction house
    // to the SportsManager DAO executor.
    if (args.startAuction) {
      const auctionHouse = contracts.SportsManagerAuctionHouse.instance.attach(
        contracts.SportsManagerAuctionHouseProxy.address,
      );
      await auctionHouse.unpause({
        gasLimit: 1_000_000,
      });
      await auctionHouse.transferOwnership(executorAddress);
      console.log(
        'Started the first auction and transferred ownership of the auction house to the executor.',
      );
    }

    console.table(
      Object.values<DeployedContract>(contracts).reduce(
        (acc: Record<string, ContractRow>, contract: DeployedContract) => {
          acc[contract.name] = {
            Address: contract.address,
          };
          if (contract.instance?.deployTransaction) {
            acc[contract.name]['Deployment Hash'] = contract.instance.deployTransaction.hash;
          }
          return acc;
        },
        {},
      ),
    );
    console.log('Deployment Complete.');
  });

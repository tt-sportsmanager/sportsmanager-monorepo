import { task, types } from 'hardhat/config';
import { ContractName, DeployedContract } from './types';
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

task('update-configs', 'Write the deployed addresses to the SDK and subgraph configs')
  .addParam('contracts', 'Contract objects from the deployment', undefined, types.json)
  .setAction(
    async ({ contracts }: { contracts: Record<ContractName, DeployedContract> }, { ethers }) => {
      const { name: network, chainId } = await ethers.provider.getNetwork();

      // Update SDK addresses
      const sdkPath = join(__dirname, '../../sports-manager-sdk');
      const addressesPath = join(sdkPath, 'src/contract/addresses.json');
      const addresses = JSON.parse(readFileSync(addressesPath, 'utf8'));
      addresses[chainId] = {
        nounsToken: contracts.SportsManagerToken.address,
        nounsSeeder: contracts.SportsManagerSeeder.address,
        nounsDescriptor: contracts.SportsManagerDescriptor.address,
        nftDescriptor: contracts.NFTDescriptor.address,
        nounsAuctionHouse: contracts.SportsManagerAuctionHouse.address,
        nounsAuctionHouseProxy: contracts.SportsManagerAuctionHouseProxy.address,
        nounsAuctionHouseProxyAdmin: contracts.SportsManagerAuctionHouseProxyAdmin.address,
        nounsDaoExecutor: contracts.SportsManagerDAOExecutor.address,
        nounsDAOProxy: contracts.SportsManagerDAOProxy.address,
        nounsDAOLogicV1: contracts.SportsManagerDAOLogicV1.address,
      };
      writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
      try {
        execSync('yarn build', {
          cwd: sdkPath,
        });
      } catch {
        console.log('Failed to re-build `@sports-manager/sdk`. Please rebuild manually.');
      }
      console.log('Addresses written to the SportsManager SDK.');

      // Generate subgraph config
      const configName = `${network}-fork`;
      const subgraphConfigPath = join(__dirname, `../../sports-manager-subgraph/config/${configName}.json`);
      const subgraphConfig = {
        network,
        nounsToken: {
          address: contracts.SportsManagerToken.address,
          startBlock: contracts.SportsManagerToken.instance.deployTransaction.blockNumber,
        },
        nounsAuctionHouse: {
          address: contracts.SportsManagerAuctionHouseProxy.address,
          startBlock: contracts.SportsManagerAuctionHouseProxy.instance.deployTransaction.blockNumber,
        },
        nounsDAO: {
          address: contracts.SportsManagerDAOProxy.address,
          startBlock: contracts.SportsManagerDAOProxy.instance.deployTransaction.blockNumber,
        },
      };
      writeFileSync(subgraphConfigPath, JSON.stringify(subgraphConfig, null, 2));
      console.log('Subgraph config has been generated.');
    },
  );

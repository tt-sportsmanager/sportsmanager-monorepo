import { join } from 'path';
import { readFileSync } from 'fs';
import { task } from 'hardhat/config';
import {
  default as SportsManagerDAOLogicV1ABI
//} from '../artifacts/contracts/governance/SportsManagerDAOLogicV1.sol/SportsManagerDAOLogicV1.json';
} from '../abi/contracts/governance/SportsManagerDAOLogicV1.sol/SportsManagerDAOLogicV1.json';

task('withdraw', 'Withdraw eth from SportsManagerDAOExecutor contract')
  .setAction(async (_args, { ethers }) => {
    const sdkPath = join(__dirname, '../../sports-manager-sdk');
    const addressesPath = join(sdkPath, 'src/contract/addresses.json');
    const addresses = JSON.parse(readFileSync(addressesPath, 'utf8'));

    const { chainId } = await ethers.provider.getNetwork();
    const signer = ethers.provider.getSigner();

    const proxyAddress = addresses[chainId.toString()]['sportsManagerDAOProxy'];

    const timelockAddress = addresses[chainId.toString()]['sportsManagerDaoExecutor'];
    console.log({ timelockAddress });

    const SportsManagerDAOLogic = new ethers.Contract(
      addresses[chainId.toString()]['sportsManagerDAOLogicV1'],
      SportsManagerDAOLogicV1ABI,
      signer,
    );

    const delegate = SportsManagerDAOLogic.attach(proxyAddress);

    const minimumWithdrawBalance = await delegate.minimumWithdrawBalance();
    console.log({ minimumWithdrawBalance: minimumWithdrawBalance.toString() });

    const timelockBalance = await ethers.provider.getBalance(timelockAddress);
    console.log({ timelockBalance: timelockBalance.toString() });

    const tx = await delegate.withdraw();
    const receipt = await tx.wait();

    console.log({ receipt });
  });

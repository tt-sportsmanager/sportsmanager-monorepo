import { Result } from 'ethers/lib/utils';
import { task, types } from 'hardhat/config';

task('mint-noun', 'Mints a SportsManager')
  .addOptionalParam(
    'nounsToken',
    'The `SportsManagerToken` contract address',
    '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    types.string,
  )
  .setAction(async ({ nounsToken }, { ethers }) => {
    const nftFactory = await ethers.getContractFactory('SportsManagerToken');
    const nftContract = nftFactory.attach(nounsToken);

    const receipt = await (await nftContract.mint()).wait();
    const nounCreated = receipt.events?.[1];
    const { tokenId } = nounCreated?.args as Result;

    console.log(`SportsManager minted with ID: ${tokenId.toString()}.`);
  });

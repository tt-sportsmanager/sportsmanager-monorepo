import { utils } from 'ethers';
import { task, types } from 'hardhat/config';

task('create-proposal', 'Create a governance proposal')
  .addOptionalParam(
    'sportsManagerDaoProxy',
    'The `SportsManagerDAOProxy` contract address',
    '0x610178dA211FEF7D417bC0e6FeD39F05609AD788',
    types.string,
  )
  .setAction(async ({ sportsManagerDaoProxy }, { ethers }) => {
    const sportsManagerDaoFactory = await ethers.getContractFactory('SportsManagerDAOLogicV1');
    const sportsManagerDao = sportsManagerDaoFactory.attach(sportsManagerDaoProxy);

    const [deployer] = await ethers.getSigners();
    const oneETH = utils.parseEther('1');

    const receipt = await (
      await sportsManagerDao.propose(
        [deployer.address],
        [oneETH],
        [''],
        ['0x'],
        '# Test Proposal\n## This is a **test**.',
      )
    ).wait();
    if (!receipt.events?.length) {
      throw new Error('Failed to create proposal');
    }
    console.log('Proposal created');
  });

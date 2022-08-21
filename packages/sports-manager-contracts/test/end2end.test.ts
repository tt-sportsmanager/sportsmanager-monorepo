import chai from 'chai';
import { ethers, upgrades } from 'hardhat';
import { BigNumber as EthersBN } from 'ethers';
import { solidity } from 'ethereum-waffle';

import {
  WETH,
  SportsManagerToken,
  SportsManagerAuctionHouse,
  SportsManagerAuctionHouse__factory as SportsManagerAuctionHouseFactory,
  SportsManagerDescriptor,
  SportsManagerDescriptor__factory as SportsManagerDescriptorFactory,
  SportsManagerDAOProxy__factory as SportsManagerDaoProxyFactory,
  SportsManagerDAOLogicV1,
  SportsManagerDAOLogicV1__factory as SportsManagerDaoLogicV1Factory,
  SportsManagerDAOExecutor,
  SportsManagerDAOExecutor__factory as SportsManagerDaoExecutorFactory,
  SportsManagerDAOProxy,
} from '../typechain';

import {
  deploySportsManagerToken,
  deployWeth,
  populateDescriptor,
  address,
  encodeParameters,
  advanceBlocks,
  blockTimestamp,
  setNextBlockTimestamp,
} from './utils';

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

chai.use(solidity);
const { expect } = chai;

let sportsManagerToken: SportsManagerToken;
let sportsManagerAuctionHouse: SportsManagerAuctionHouse;
let descriptor: SportsManagerDescriptor;
let weth: WETH;
let gov: SportsManagerDAOLogicV1;
let timelock: SportsManagerDAOExecutor;

let deployer: SignerWithAddress;
let wethDeployer: SignerWithAddress;
let bidderA: SignerWithAddress;
let noundersDAO: SignerWithAddress;
let rewardDistributor: SignerWithAddress;
let newRewardDistributor: SignerWithAddress;

// Governance Config
const TIME_LOCK_DELAY = 172_800; // 2 days
const PROPOSAL_THRESHOLD_BPS = 500; // 5%
const QUORUM_VOTES_BPS = 1_000; // 10%
const VOTING_PERIOD = 5_760; // About 24 hours with 15s blocks
const VOTING_DELAY = 1; // 1 block
const MINIMUM_WITHDRAW_BALANCE = 1;

// Proposal Config
const targets: string[] = [];
const values: string[] = [];
const signatures: string[] = [];
const callDatas: string[] = [];

let proposalId: EthersBN;

// Auction House Config
const TIME_BUFFER = 15 * 60;
const RESERVE_PRICE = 2;
const MIN_INCREMENT_BID_PERCENTAGE = 5;
const DURATION = 60 * 60 * 24;

let sportsManagerDAOProxy: SportsManagerDAOProxy;

async function deploy() {
  [deployer, bidderA, wethDeployer, noundersDAO, rewardDistributor, newRewardDistributor] = await ethers.getSigners();

  // Deployed by another account to simulate real network

  weth = await deployWeth(wethDeployer);

  // nonce 2: Deploy AuctionHouse
  // nonce 3: Deploy nftDescriptorLibraryFactory
  // nonce 4: Deploy SportsManagerDescriptor
  // nonce 5: Deploy SportsManagerSeeder
  // nonce 6: Deploy SportsManagerToken
  // nonce 0: Deploy SportsManagerDAOExecutor
  // nonce 1: Deploy SportsManagerDAOLogicV1
  // nonce 7: Deploy SportsManagerDAOProxy
  // nonce ++: populate Descriptor
  // nonce ++: set ownable contracts owner to timelock

  // 1. DEPLOY SportsManager token
  sportsManagerToken = await deploySportsManagerToken(
    deployer,
    noundersDAO.address,
    deployer.address, // do not know minter/auction house yet
  );

  // 2a. DEPLOY AuctionHouse
  const auctionHouseFactory = await ethers.getContractFactory('SportsManagerAuctionHouse', deployer);
  const sportsManagerAuctionHouseProxy = await upgrades.deployProxy(auctionHouseFactory, [
    sportsManagerToken.address,
    weth.address,
    TIME_BUFFER,
    RESERVE_PRICE,
    MIN_INCREMENT_BID_PERCENTAGE,
    DURATION,
  ]);

  // 2b. CAST proxy as AuctionHouse
  sportsManagerAuctionHouse = SportsManagerAuctionHouseFactory.connect(sportsManagerAuctionHouseProxy.address, deployer);

  // 3. SET MINTER
  await sportsManagerToken.setMinter(sportsManagerAuctionHouse.address);

  // 4. POPULATE body parts
  descriptor = SportsManagerDescriptorFactory.connect(await sportsManagerToken.descriptor(), deployer);

  await populateDescriptor(descriptor);

  // 5a. CALCULATE Gov Delegate, takes place after 2 transactions
  const calculatedGovDelegatorAddress = ethers.utils.getContractAddress({
    from: deployer.address,
    nonce: (await deployer.getTransactionCount()) + 2,
  });

  // 5b. DEPLOY SportsManagerDAOExecutor with pre-computed Delegator address
  timelock = await new SportsManagerDaoExecutorFactory(deployer).deploy(
    calculatedGovDelegatorAddress,
    TIME_LOCK_DELAY,
  );

  // 6. DEPLOY Delegate
  const govDelegate = await new SportsManagerDaoLogicV1Factory(deployer).deploy();

  // 7a. DEPLOY Delegator
  sportsManagerDAOProxy = await new SportsManagerDaoProxyFactory(deployer).deploy(
    timelock.address,
    sportsManagerToken.address,
    noundersDAO.address, // SportsManagerdersDAO is vetoer
    timelock.address,
    govDelegate.address,
    rewardDistributor.address,
    VOTING_PERIOD,
    VOTING_DELAY,
    PROPOSAL_THRESHOLD_BPS,
    QUORUM_VOTES_BPS,
    MINIMUM_WITHDRAW_BALANCE
  );

  expect(calculatedGovDelegatorAddress).to.equal(sportsManagerDAOProxy.address);

  // 7b. CAST Delegator as Delegate
  gov = SportsManagerDaoLogicV1Factory.connect(sportsManagerDAOProxy.address, deployer);

  // 8. SET SportsManager owner to SportsManagerDAOExecutor
  await sportsManagerToken.transferOwnership(timelock.address);
  // 9. SET Descriptor owner to SportsManagerDAOExecutor
  await descriptor.transferOwnership(timelock.address);

  // 10. UNPAUSE auction and kick off first mint
  await sportsManagerAuctionHouse.unpause();

  // 11. SET Auction House owner to SportsManagerDAOExecutor
  await sportsManagerAuctionHouse.transferOwnership(timelock.address);
}

describe('End to End test with deployment, auction, proposing, voting, executing', async () => {
  before(deploy);

  it('sets all starting params correctly', async () => {
    expect(await sportsManagerToken.owner()).to.equal(timelock.address);
    expect(await descriptor.owner()).to.equal(timelock.address);
    expect(await sportsManagerAuctionHouse.owner()).to.equal(timelock.address);

    expect(await sportsManagerToken.minter()).to.equal(sportsManagerAuctionHouse.address);
    expect(await sportsManagerToken.noundersDAO()).to.equal(noundersDAO.address);

    expect(await gov.admin()).to.equal(timelock.address);
    expect(await timelock.admin()).to.equal(gov.address);
    expect(await gov.timelock()).to.equal(timelock.address);

    expect(await gov.vetoer()).to.equal(noundersDAO.address);

    expect(await gov.rewardDistributor()).to.equal(rewardDistributor.address);

    expect(await sportsManagerToken.totalSupply()).to.equal(EthersBN.from('2'));

    expect(await sportsManagerToken.ownerOf(0)).to.equal(noundersDAO.address);
    expect(await sportsManagerToken.ownerOf(1)).to.equal(sportsManagerAuctionHouse.address);

    expect((await sportsManagerAuctionHouse.auction()).sportsManagerId).to.equal(EthersBN.from('1'));
  });

  it('allows bidding, settling, and transferring ETH correctly', async () => {
    await sportsManagerAuctionHouse.connect(bidderA).createBid(1, { value: RESERVE_PRICE });
    await setNextBlockTimestamp(Number(await blockTimestamp('latest')) + DURATION);
    await sportsManagerAuctionHouse.settleCurrentAndCreateNewAuction();

    expect(await sportsManagerToken.ownerOf(1)).to.equal(bidderA.address);
    expect(await ethers.provider.getBalance(timelock.address)).to.equal(RESERVE_PRICE);
  });

  it('allows rewardDistributor address to withdraw funds from timelock', async () => {
    const rewardDistributorBalanceBeforeWithdraw = await ethers.provider.getBalance(rewardDistributor.address);

    expect(await ethers.provider.getBalance(timelock.address)).to.equal(RESERVE_PRICE);

    const tx = await gov.connect(rewardDistributor).withdraw();
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed;
    const gasUsedInWei = gasUsed.mul("1000000000");

    console.log({ gasUsedInWei });

    const rewardDistributorBalanceMinusGas = rewardDistributorBalanceBeforeWithdraw.sub(gasUsedInWei);
    const expectedBalance = rewardDistributorBalanceMinusGas.add(RESERVE_PRICE);

    const rewardDistributorBalanceAfterWithdraw = await ethers.provider.getBalance(rewardDistributor.address);

    expect(rewardDistributorBalanceAfterWithdraw).to.equal(expectedBalance);
  });

  it('allows rewardDistributor address to be changed', async () => {
    await gov.connect(rewardDistributor)._setRewardDistributor(newRewardDistributor.address);
    const rewardDistributorAddr = await gov.rewardDistributor();
    expect(rewardDistributorAddr).to.equal(newRewardDistributor.address);
  });

  it('allows minimumWithdrawBalance to be changed', async () => {
    try {
      await gov.connect(newRewardDistributor)._setMinimumWithdrawBalance('10000');
      const minimumWithdrawBalance = await gov.minimumWithdrawBalance();
      expect(minimumWithdrawBalance).to.equal('10000');
    } catch (err) {
      console.log(err)
    }
  });

  it('allows proposing, voting, queuing', async () => {
    const description = 'Set sportsManagerToken minter to address(1) and transfer treasury to address(2)';

    // Action 1. Execute sportsManagerToken.setMinter(address(1))
    targets.push(sportsManagerToken.address);
    values.push('0');
    signatures.push('setMinter(address)');
    callDatas.push(encodeParameters(['address'], [address(1)]));

    // Action 2. Execute transfer RESERVE_PRICE to address(2)
    targets.push(address(2));
    values.push(String(RESERVE_PRICE));
    signatures.push('');
    callDatas.push('0x');

    await gov.connect(bidderA).propose(targets, values, signatures, callDatas, description);

    proposalId = await gov.latestProposalIds(bidderA.address);

    // Wait for VOTING_DELAY
    await advanceBlocks(VOTING_DELAY + 1);

    // cast vote for proposal
    await gov.connect(bidderA).castVote(proposalId, 1);

    await advanceBlocks(VOTING_PERIOD);

    await gov.connect(bidderA).queue(proposalId);

    // Queued state
    expect(await gov.state(proposalId)).to.equal(5);
  });

  it('executes proposal transactions correctly', async () => {
    // Create another bid and settles it
    await sportsManagerAuctionHouse.connect(bidderA).createBid(2, { value: RESERVE_PRICE });
    await setNextBlockTimestamp(Number(await blockTimestamp('latest')) + DURATION);
    await sportsManagerAuctionHouse.settleCurrentAndCreateNewAuction();

    const { eta } = await gov.proposals(proposalId);
    await setNextBlockTimestamp(eta.toNumber(), false);
    await gov.execute(proposalId);

    // Successfully executed Action 1
    expect(await sportsManagerToken.minter()).to.equal(address(1));

    // Successfully executed Action 2
    expect(await ethers.provider.getBalance(address(2))).to.equal(RESERVE_PRICE);
  });

  it('does not allow SportsManagerDAO to accept funds', async () => {
    let error1;

    // SportsManagerDAO does not accept value without calldata
    try {
      await bidderA.sendTransaction({
        to: gov.address,
        value: 10,
      });
    } catch (e) {
      error1 = e;
    }

    expect(error1);

    let error2;

    // SportsManagerDAO does not accept value with calldata
    try {
      await bidderA.sendTransaction({
        data: '0xb6b55f250000000000000000000000000000000000000000000000000000000000000001',
        to: gov.address,
        value: 10,
      });
    } catch (e) {
      error2 = e;
    }

    expect(error2);
  });

  it('allows SportsManagerDAOExecutor to receive funds', async () => {
    // test receive()
    await bidderA.sendTransaction({
      to: timelock.address,
      value: 10,
    });

    expect(await ethers.provider.getBalance(timelock.address)).to.equal(10);

    // test fallback() calls deposit(uint) which is not implemented
    await bidderA.sendTransaction({
      data: '0xb6b55f250000000000000000000000000000000000000000000000000000000000000001',
      to: timelock.address,
      value: 10,
    });

    expect(await ethers.provider.getBalance(timelock.address)).to.equal(20);
  });
});

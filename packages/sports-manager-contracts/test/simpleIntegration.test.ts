import chai from 'chai';
import { ethers, upgrades, network } from 'hardhat';
import { BigNumber as EthersBN, Contract } from 'ethers';
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
  SportsManagerStream,
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

let stream: Contract;
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
let alice: SignerWithAddress;
let bob: SignerWithAddress;

// Stream Factory
let streamFactory: Contract;

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

const deployStream = async () => {
  let SportsManagerStreamFactory = await ethers.getContractFactory('SportsManagerStreamFactory');
  SportsManagerStreamFactory = SportsManagerStreamFactory.connect(rewardDistributor); // Set reward distributor as receiver
  let streamFactory = await SportsManagerStreamFactory.deploy();
  await streamFactory.deployed();

  return streamFactory;
}

const clone = async (streamFactory: Contract, desc: string, members: SportsManagerStream.MemberStruct[]) => {
  let tx = await streamFactory.genesis(desc, members);
  await tx.wait();

  let SportsManagerStream = await ethers.getContractFactory('SportsManagerStream');
  let _stream = await SportsManagerStream.deploy();
  await _stream.deployed();
  _stream.initialize(members);
  stream = _stream;
}

const getBalance = async (
    deployer: SignerWithAddress,
    alice: SignerWithAddress,
    bob: SignerWithAddress,
) => {
  const aliceB = await ethers.provider.getBalance(alice.address);
  const bobB = await ethers.provider.getBalance(bob.address);
  const deployerB = await ethers.provider.getBalance(deployer.address);
  const contractB = await ethers.provider.getBalance(stream.address);

  return {
    alice: ethers.utils.formatEther(aliceB),
    bob: ethers.utils.formatEther(bobB),
    deployer: ethers.utils.formatEther(deployerB),
    contract: ethers.utils.formatEther(contractB)
  };
}

async function deploy() {
  // reset blockchain every time
  await network.provider.request({
    method: "hardhat_reset",
    params: [],
  });

  [deployer, bidderA, wethDeployer, noundersDAO, rewardDistributor, alice, bob] = await ethers.getSigners();

  // Deployed by another account to simulate real network

  weth = await deployWeth(wethDeployer);

  // Deploy stream contract factory
  streamFactory = await deployStream();
  await clone(streamFactory, "alice, bob", [{
    account: alice.address,
    value: "" + 5,
    total: 10
  }, {
    account: bob.address,
    value: "" + 5,
    total: 10
  }]);

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

describe('Integration test with deployment, auction, money distribution', async () => {
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

    const beforeBalance = await getBalance(
        rewardDistributor,
        alice,
        bob,
    );
    expect(beforeBalance.alice).to.equal('10000.0');
    expect(beforeBalance.bob).to.equal('10000.0');
    expect(beforeBalance.contract).to.equal('0.0');
  });

  it('allows bidding, settling, and transferring ETH correctly', async () => {
    await sportsManagerAuctionHouse.connect(bidderA).createBid(1, { value: RESERVE_PRICE });
    await setNextBlockTimestamp(Number(await blockTimestamp('latest')) + DURATION);
    await sportsManagerAuctionHouse.settleCurrentAndCreateNewAuction();

    expect(await sportsManagerToken.ownerOf(1)).to.equal(bidderA.address);
    expect(await ethers.provider.getBalance(timelock.address)).to.equal(RESERVE_PRICE);
  });

  it('allows rewardDistributor address to withdraw funds from timelock via stream contract', async () => {
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
    
    // This will simulate an autotask to send transaction
    const estimateGas = await ethers.provider.estimateGas({
        to: stream.address,
        value: rewardDistributorBalanceAfterWithdraw
    });
    const gasPrice = await ethers.provider.getGasPrice();
    const estimateTxFee = gasPrice.mul(estimateGas)
    await rewardDistributor.sendTransaction({
      to: stream.address,
      value: rewardDistributorBalanceAfterWithdraw.sub(estimateTxFee)
    });

    const afterBalance = await getBalance(
      rewardDistributor,
      alice,
      bob
    );
    expect(afterBalance.alice).to.equal('14999.999480183000000001');
    expect(afterBalance.bob).to.equal('14999.999480183000000001');
    expect(afterBalance.contract).to.equal('0.0');
  });
});

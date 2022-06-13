import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import chai from 'chai';
import { solidity } from 'ethereum-waffle';
import { constants } from 'ethers';
import { ethers, upgrades } from 'hardhat';
import {
  MaliciousBidder__factory as MaliciousBidderFactory,
  SportsManagerAuctionHouse,
  SportsManagerDescriptor__factory as SportsManagerDescriptorFactory,
  SportsManagerToken,
  WETH,
} from '../typechain';
import { deploySportsManagerToken, deployWeth, populateDescriptor } from './utils';

chai.use(solidity);
const { expect } = chai;

describe('SportsManagerAuctionHouse', () => {
  let sportsManagerAuctionHouse: SportsManagerAuctionHouse;
  let sportsManagerToken: SportsManagerToken;
  let weth: WETH;
  let deployer: SignerWithAddress;
  let sportsManagerFoundersDAO: SignerWithAddress;
  let bidderA: SignerWithAddress;
  let bidderB: SignerWithAddress;
  let snapshotId: number;

  const TIME_BUFFER = 15 * 60;
  const RESERVE_PRICE = 2;
  const MIN_INCREMENT_BID_PERCENTAGE = 5;
  const DURATION = 60 * 60 * 24;

  async function deploy(deployer?: SignerWithAddress) {
    const auctionHouseFactory = await ethers.getContractFactory('SportsManagerAuctionHouse', deployer);
    return upgrades.deployProxy(auctionHouseFactory, [
      sportsManagerToken.address,
      weth.address,
      TIME_BUFFER,
      RESERVE_PRICE,
      MIN_INCREMENT_BID_PERCENTAGE,
      DURATION,
    ]) as Promise<SportsManagerAuctionHouse>;
  }

  before(async () => {
    [deployer, sportsManagerFoundersDAO, bidderA, bidderB] = await ethers.getSigners();

    sportsManagerToken = await deploySportsManagerToken(deployer, sportsManagerFoundersDAO.address, deployer.address);
    weth = await deployWeth(deployer);
    sportsManagerAuctionHouse = await deploy(deployer);

    const descriptor = await sportsManagerToken.descriptor();

    await populateDescriptor(SportsManagerDescriptorFactory.connect(descriptor, deployer));

    await sportsManagerToken.setMinter(sportsManagerAuctionHouse.address);
  });

  beforeEach(async () => {
    snapshotId = await ethers.provider.send('evm_snapshot', []);
  });

  afterEach(async () => {
    await ethers.provider.send('evm_revert', [snapshotId]);
  });

  it('should revert if a second initialization is attempted', async () => {
    const tx = sportsManagerAuctionHouse.initialize(
      sportsManagerToken.address,
      weth.address,
      TIME_BUFFER,
      RESERVE_PRICE,
      MIN_INCREMENT_BID_PERCENTAGE,
      DURATION,
    );
    await expect(tx).to.be.revertedWith('Initializable: contract is already initialized');
  });

  it('should allow the sportsManagerFoundersDAO to unpause the contract and create the first auction', async () => {
    const tx = await sportsManagerAuctionHouse.unpause();
    await tx.wait();

    const auction = await sportsManagerAuctionHouse.auction();
    expect(auction.startTime.toNumber()).to.be.greaterThan(0);
  });

  it('should revert if a user creates a bid for an inactive auction', async () => {
    await (await sportsManagerAuctionHouse.unpause()).wait();

    const { sportsManagerId } = await sportsManagerAuctionHouse.auction();
    const tx = sportsManagerAuctionHouse.connect(bidderA).createBid(sportsManagerId.add(1), {
      value: RESERVE_PRICE,
    });

    await expect(tx).to.be.revertedWith('SportsManager not up for auction');
  });

  it('should revert if a user creates a bid for an expired auction', async () => {
    await (await sportsManagerAuctionHouse.unpause()).wait();

    await ethers.provider.send('evm_increaseTime', [60 * 60 * 25]); // Add 25 hours

    const { sportsManagerId } = await sportsManagerAuctionHouse.auction();
    const tx = sportsManagerAuctionHouse.connect(bidderA).createBid(sportsManagerId, {
      value: RESERVE_PRICE,
    });

    await expect(tx).to.be.revertedWith('Auction expired');
  });

  it('should revert if a user creates a bid with an amount below the reserve price', async () => {
    await (await sportsManagerAuctionHouse.unpause()).wait();

    const { sportsManagerId } = await sportsManagerAuctionHouse.auction();
    const tx = sportsManagerAuctionHouse.connect(bidderA).createBid(sportsManagerId, {
      value: RESERVE_PRICE - 1,
    });

    await expect(tx).to.be.revertedWith('Must send at least reservePrice');
  });

  it('should revert if a user creates a bid less than the min bid increment percentage', async () => {
    await (await sportsManagerAuctionHouse.unpause()).wait();

    const { sportsManagerId } = await sportsManagerAuctionHouse.auction();
    await sportsManagerAuctionHouse.connect(bidderA).createBid(sportsManagerId, {
      value: RESERVE_PRICE * 50,
    });
    const tx = sportsManagerAuctionHouse.connect(bidderB).createBid(sportsManagerId, {
      value: RESERVE_PRICE * 51,
    });

    await expect(tx).to.be.revertedWith(
      'Must send more than last bid by minBidIncrementPercentage amount',
    );
  });

  it('should refund the previous bidder when the following user creates a bid', async () => {
    await (await sportsManagerAuctionHouse.unpause()).wait();

    const { sportsManagerId } = await sportsManagerAuctionHouse.auction();
    await sportsManagerAuctionHouse.connect(bidderA).createBid(sportsManagerId, {
      value: RESERVE_PRICE,
    });

    const bidderAPostBidBalance = await bidderA.getBalance();
    await sportsManagerAuctionHouse.connect(bidderB).createBid(sportsManagerId, {
      value: RESERVE_PRICE * 2,
    });
    const bidderAPostRefundBalance = await bidderA.getBalance();

    expect(bidderAPostRefundBalance).to.equal(bidderAPostBidBalance.add(RESERVE_PRICE));
  });

  it('should cap the maximum bid griefing cost at 30K gas + the cost to wrap and transfer WETH', async () => {
    await (await sportsManagerAuctionHouse.unpause()).wait();

    const { sportsManagerId } = await sportsManagerAuctionHouse.auction();

    const maliciousBidderFactory = new MaliciousBidderFactory(bidderA);
    const maliciousBidder = await maliciousBidderFactory.deploy();

    const maliciousBid = await maliciousBidder
      .connect(bidderA)
      .bid(sportsManagerAuctionHouse.address, sportsManagerId, {
        value: RESERVE_PRICE,
      });
    await maliciousBid.wait();

    const tx = await sportsManagerAuctionHouse.connect(bidderB).createBid(sportsManagerId, {
      value: RESERVE_PRICE * 2,
      gasLimit: 1_000_000,
    });
    const result = await tx.wait();

    expect(result.gasUsed.toNumber()).to.be.lessThan(200_000);
    expect(await weth.balanceOf(maliciousBidder.address)).to.equal(RESERVE_PRICE);
  });

  it('should emit an `AuctionBid` event on a successful bid', async () => {
    await (await sportsManagerAuctionHouse.unpause()).wait();

    const { sportsManagerId } = await sportsManagerAuctionHouse.auction();
    const tx = sportsManagerAuctionHouse.connect(bidderA).createBid(sportsManagerId, {
      value: RESERVE_PRICE,
    });

    await expect(tx)
      .to.emit(sportsManagerAuctionHouse, 'AuctionBid')
      .withArgs(sportsManagerId, bidderA.address, RESERVE_PRICE, false);
  });

  it('should emit an `AuctionExtended` event if the auction end time is within the time buffer', async () => {
    await (await sportsManagerAuctionHouse.unpause()).wait();

    const { sportsManagerId, endTime } = await sportsManagerAuctionHouse.auction();

    await ethers.provider.send('evm_setNextBlockTimestamp', [endTime.sub(60 * 5).toNumber()]); // Subtract 5 mins from current end time

    const tx = sportsManagerAuctionHouse.connect(bidderA).createBid(sportsManagerId, {
      value: RESERVE_PRICE,
    });

    await expect(tx)
      .to.emit(sportsManagerAuctionHouse, 'AuctionExtended')
      .withArgs(sportsManagerId, endTime.add(60 * 10));
  });

  it('should revert if auction settlement is attempted while the auction is still active', async () => {
    await (await sportsManagerAuctionHouse.unpause()).wait();

    const { sportsManagerId } = await sportsManagerAuctionHouse.auction();

    await sportsManagerAuctionHouse.connect(bidderA).createBid(sportsManagerId, {
      value: RESERVE_PRICE,
    });
    const tx = sportsManagerAuctionHouse.connect(bidderA).settleCurrentAndCreateNewAuction();

    await expect(tx).to.be.revertedWith("Auction hasn't completed");
  });

  it('should emit `AuctionSettled` and `AuctionCreated` events if all conditions are met', async () => {
    await (await sportsManagerAuctionHouse.unpause()).wait();

    const { sportsManagerId } = await sportsManagerAuctionHouse.auction();

    await sportsManagerAuctionHouse.connect(bidderA).createBid(sportsManagerId, {
      value: RESERVE_PRICE,
    });

    await ethers.provider.send('evm_increaseTime', [60 * 60 * 25]); // Add 25 hours
    const tx = await sportsManagerAuctionHouse.connect(bidderA).settleCurrentAndCreateNewAuction();

    const receipt = await tx.wait();
    const { timestamp } = await ethers.provider.getBlock(receipt.blockHash);

    const settledEvent = receipt.events?.find(e => e.event === 'AuctionSettled');
    const createdEvent = receipt.events?.find(e => e.event === 'AuctionCreated');

    expect(settledEvent?.args?.sportsManagerId).to.equal(sportsManagerId);
    expect(settledEvent?.args?.winner).to.equal(bidderA.address);
    expect(settledEvent?.args?.amount).to.equal(RESERVE_PRICE);

    expect(createdEvent?.args?.sportsManagerId).to.equal(sportsManagerId.add(1));
    expect(createdEvent?.args?.startTime).to.equal(timestamp);
    expect(createdEvent?.args?.endTime).to.equal(timestamp + DURATION);
  });

  it('should not create a new auction if the auction house is paused and unpaused while an auction is ongoing', async () => {
    await (await sportsManagerAuctionHouse.unpause()).wait();

    await (await sportsManagerAuctionHouse.pause()).wait();

    await (await sportsManagerAuctionHouse.unpause()).wait();

    const { sportsManagerId } = await sportsManagerAuctionHouse.auction();

    expect(sportsManagerId).to.equal(1);
  });

  it('should create a new auction if the auction house is paused and unpaused after an auction is settled', async () => {
    await (await sportsManagerAuctionHouse.unpause()).wait();

    const { sportsManagerId } = await sportsManagerAuctionHouse.auction();

    await sportsManagerAuctionHouse.connect(bidderA).createBid(sportsManagerId, {
      value: RESERVE_PRICE,
    });

    await ethers.provider.send('evm_increaseTime', [60 * 60 * 25]); // Add 25 hours

    await (await sportsManagerAuctionHouse.pause()).wait();

    const settleTx = sportsManagerAuctionHouse.connect(bidderA).settleAuction();

    await expect(settleTx)
      .to.emit(sportsManagerAuctionHouse, 'AuctionSettled')
      .withArgs(sportsManagerId, bidderA.address, RESERVE_PRICE);

    const unpauseTx = await sportsManagerAuctionHouse.unpause();
    const receipt = await unpauseTx.wait();
    const { timestamp } = await ethers.provider.getBlock(receipt.blockHash);

    const createdEvent = receipt.events?.find(e => e.event === 'AuctionCreated');

    expect(createdEvent?.args?.sportsManagerId).to.equal(sportsManagerId.add(1));
    expect(createdEvent?.args?.startTime).to.equal(timestamp);
    expect(createdEvent?.args?.endTime).to.equal(timestamp + DURATION);
  });

  it('should settle the current auction and pause the contract if the minter is updated while the auction house is unpaused', async () => {
    await (await sportsManagerAuctionHouse.unpause()).wait();

    const { sportsManagerId } = await sportsManagerAuctionHouse.auction();

    await sportsManagerAuctionHouse.connect(bidderA).createBid(sportsManagerId, {
      value: RESERVE_PRICE,
    });

    await sportsManagerToken.setMinter(constants.AddressZero);

    await ethers.provider.send('evm_increaseTime', [60 * 60 * 25]); // Add 25 hours

    const settleTx = sportsManagerAuctionHouse.connect(bidderA).settleCurrentAndCreateNewAuction();

    await expect(settleTx)
      .to.emit(sportsManagerAuctionHouse, 'AuctionSettled')
      .withArgs(sportsManagerId, bidderA.address, RESERVE_PRICE);

    const paused = await sportsManagerAuctionHouse.paused();

    expect(paused).to.equal(true);
  });

  it('should burn a SportsManager on auction settlement if no bids are received', async () => {
    await (await sportsManagerAuctionHouse.unpause()).wait();

    const { sportsManagerId } = await sportsManagerAuctionHouse.auction();

    await ethers.provider.send('evm_increaseTime', [60 * 60 * 25]); // Add 25 hours

    const tx = sportsManagerAuctionHouse.connect(bidderA).settleCurrentAndCreateNewAuction();

    await expect(tx)
      .to.emit(sportsManagerAuctionHouse, 'AuctionSettled')
      .withArgs(sportsManagerId, '0x0000000000000000000000000000000000000000', 0);
  });
});

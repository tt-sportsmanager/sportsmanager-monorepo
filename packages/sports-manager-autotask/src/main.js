const ccxt = require("ccxt");
const hre = require("hardhat");
const { ethers } = require("ethers");
const { SportsManagerDaoLogicV1Factory } = require("@sports-manager/contracts");
const {
  ContractAddresses,
  getContractAddressesForChainOrThrow,
} = require("@sports-manager/sdk");

require("dotenv").config();

async function main(
  payload,
  signer
) {
  /**
   * @dev Set default arguments
   */
  let _ethers = ethers;

  /**
   * @dev For development only! Set the current ethers environment to Hardhat.
   */
  if (process.env.hasOwnProperty("ENVIRONMENT_TYPE") && process.env.ENVIRONMENT_TYPE == "development") { // eslint-disable-line
    _ethers = hre.ethers;
    [signer] = await _ethers.getSigners();
    const { chainId } = await _ethers.provider.getNetwork();

    try {
      sportsManagerAddresses = getContractAddressesForChainOrThrow(chainId);

      const proxyAddress = sportsManagerAddresses['sportsManagerDAOProxy'];
      const timelockAddress = sportsManagerAddresses['sportsManagerDaoExecutor'];

      let sportsManagerDaoContract = new SportsManagerDaoLogicV1Factory().attach(proxyAddress);
      sportsManagerDaoContract = sportsManagerDaoContract.connect(signer);
      console.log({ sportsManagerDaoContract });

      const minimumWithdrawBalance = await sportsManagerDaoContract.minimumWithdrawBalance();
      console.log({ minimumWithdrawBalance: minimumWithdrawBalance.toString() });

      const timelockBalance = await _ethers.provider.getBalance(timelockAddress);
      console.log({ timelockBalance: timelockBalance.toString() });

      const tx = await sportsManagerDaoContract.withdraw();
      const receipt = await tx.wait();
      console.log({ receipt });

    } catch(err) {
      console.log({ err });
    }
  }

  // TODO: Insert logic here to run on deployed autotask
}

module.exports = {
  main
}

const ccxt = require("ccxt");
const hre = require("hardhat");
const { ethers } = require("ethers");
const { swapOnExchange } = require("./swapOnExchange");
const { createClient } = require("@supabase/supabase-js");
const { abi } = require("./abi/SaeFtmStakingV1.sol/SaeFtmStakingV1.json");

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
  }

  
  // Insert logic here
}

module.exports = {
  main
}
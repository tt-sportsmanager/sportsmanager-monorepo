// tasks/deploy-stream.ts

import { task } from "hardhat/config";

task("deploy-stream", "Deploys NFT Smart contract").setAction(
  async (_args, { ethers }) => {
    const SportsManagerStreamFactory = await ethers.getContractFactory('SportsManagerStreamFactory');
    const factory = await SportsManagerStreamFactory.deploy();

    await factory.deployed();

    console.log("Stream Factory Deployed to :", factory.address);

    return factory.address;
  }
);
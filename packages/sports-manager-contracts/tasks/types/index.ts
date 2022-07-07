import { Contract } from 'ethers';

export enum ChainId {
  Mainnet = 1,
  Ropsten = 3,
  Rinkeby = 4,
  Goerli = 5,
  Kovan = 42,
}

// prettier-ignore
export type ContractName = 'NFTDescriptor' | 'SportsManagerDescriptor' | 'SportsManagerSeeder' | 'SportsManagerToken' | 'SportsManagerAuctionHouse' | 'SportsManagerAuctionHouseProxyAdmin' | 'SportsManagerAuctionHouseProxy' | 'SportsManagerDAOExecutor' | 'SportsManagerDAOLogicV1' | 'SportsManagerDAOProxy';

export interface ContractDeployment {
  args?: (string | number | (() => string))[];
  libraries?: () => Record<string, string>;
  waitForConfirmation?: boolean;
  validateDeployment?: () => void;
}

export interface DeployedContract {
  name: string;
  address: string;
  instance: Contract;
  constructorArguments: (string | number)[];
  libraries: Record<string, string>;
}

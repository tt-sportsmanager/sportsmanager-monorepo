import {
  SportsManagerTokenFactory,
  SportsManagerAuctionHouseFactory,
  SportsManagerDescriptorFactory,
  SportsManagerSeederFactory,
  SportsManagerDaoLogicV1Factory,
} from '@sports-manager/contracts';

export interface ContractAddresses {
  sportsManagerToken: string;
  sportsManagerSeeder: string;
  sportsManagerDescriptor: string;
  nftDescriptor: string;
  sportsManagerAuctionHouse: string;
  sportsManagerAuctionHouseProxy: string;
  sportsManagerAuctionHouseProxyAdmin: string;
  sportsManagerDaoExecutor: string;
  sportsManagerDAOProxy: string;
  sportsManagerDAOLogicV1: string;
}

export interface Contracts {
  sportsManagerTokenContract: ReturnType<typeof SportsManagerTokenFactory.connect>;
  sportsManagerAuctionHouseContract: ReturnType<typeof SportsManagerAuctionHouseFactory.connect>;
  sportsManagerDescriptorContract: ReturnType<typeof SportsManagerDescriptorFactory.connect>;
  sportsManagerSeederContract: ReturnType<typeof SportsManagerSeederFactory.connect>;
  sportsManagerDaoContract: ReturnType<typeof SportsManagerDaoLogicV1Factory.connect>;
}

export enum ChainId {
  Mainnet = 1,
  Ropsten = 3,
  Rinkeby = 4,
  Kovan = 42,
  Local = 31337,
}

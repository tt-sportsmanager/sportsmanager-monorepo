import { task, types } from 'hardhat/config';
import ImageData from '../files/image-data.json';
import { chunkArray } from '../utils';

task('populate-descriptor', 'Populates the descriptor with color palettes and SportsManager parts')
  .addOptionalParam(
    'nftDescriptor',
    'The `NFTDescriptor` contract address',
    '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    types.string,
  )
  .addOptionalParam(
    'sportsManagerDescriptor',
    'The `SportsManagerDescriptor` contract address',
    '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    types.string,
  )
  .setAction(async ({ nftDescriptor, sportsManagerDescriptor }, { ethers }) => {
    const descriptorFactory = await ethers.getContractFactory('SportsManagerDescriptor', {
      libraries: {
        NFTDescriptor: nftDescriptor,
      },
    });
    const descriptorContract = descriptorFactory.attach(sportsManagerDescriptor);

    const { bgcolors, palette, images } = ImageData;
    const { bodies, accessories, heads, glasses } = images;

    // Chunk head and accessory population due to high gas usage
    console.log('addManyBackgrounds');
    await descriptorContract.addManyBackgrounds(bgcolors);
    console.log('addManyColorsToPalette');
    await descriptorContract.addManyColorsToPalette(0, palette);
    console.log('addManyBodies');
    await descriptorContract.addManyBodies(bodies.map(({ data }) => data));

    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('addManyAccessories');
    const accessoryChunk = chunkArray(accessories, 10);
    for (const chunk of accessoryChunk) {
      console.log({ chunk })
      await descriptorContract.addManyAccessories(chunk.map(({ data }) => data));
    }

    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('addManyHeads');
    const headChunk = chunkArray(heads, 10);
    for (const chunk of headChunk) {
      console.log({ chunk })
      await descriptorContract.addManyHeads(chunk.map(({ data }) => data));
    }

    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('addManyGlasses');
    await descriptorContract.addManyGlasses(glasses.map(({ data }) => data));

    console.log('Descriptor populated with palettes and parts.');
  });

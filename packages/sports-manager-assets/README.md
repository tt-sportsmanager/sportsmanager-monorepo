# @sports-manager/assets

## Development

### Install dependencies

```sh
yarn
```

## Usage

**Access SportsManager RLE Image Data**

```ts
import { ImageData } from '@sports-manager/assets';

const { bgcolors, palette, images } = ImageData;
const { bodies, accessories, heads, glasses } = images;
```

**Get SportsManager Part & Background Data**

```ts
import { getSportsManagerData } from '@sports-manager/assets';

const seed = {
  background: 0,
  body: 17,
  accessory: 41,
  head: 71,
  glasses: 2,
};
const { parts, background } = getSportsManagerData(seed);
```

**Emulate `SportsManagerSeeder.sol` Pseudorandom seed generation**

```ts
import { getSportsManagerSeedFromBlockHash } from '@sports-manager/assets';

const blockHash = '0x5014101691e81d79a2eba711e698118e1a90c9be7acb2f40d7f200134ee53e01';
const nounId = 116;

/**
 {
    background: 1,
    body: 28,
    accessory: 120,
    head: 95,
    glasses: 15
  }
*/
const seed = getSportsManagerSeedFromBlockHash(nounId, blockHash);
```

## Examples

**Almost off-chain SportsManager Crystal Ball**
Generate a SportsManager using only a block hash, which saves calls to `SportsManagerSeeder` and `SportsManagerDescriptor` contracts. This can be used for a faster crystal ball.

```ts
/**
 * For you to implement:
   - hook up providers with ether/web3.js
   - get currently auctioned SportsManager Id from the SportsManagersAuctionHouse contract
   - add 1 to the current SportsManager Id to get the next SportsManager Id (named `nextSportsManagerId` below)
   - get the latest block hash from your provider (named `latestBlockHash` below)
*/

import { ImageData, getSportsManagerSeedFromBlockHash, getSportsManagerData } from '@sports-manager/assets';
import { buildSVG } from '@sports-manager/sdk';
const { palette } = ImageData; // Used with `buildSVG``

/**
 * OUTPUT:
   {
      background: 1,
      body: 28,
      accessory: 120,
      head: 95,
      glasses: 15
    }
*/
const seed = getSportsManagerSeedFromBlockHash(nextSportsManagerId, latestBlockHash);

/** 
 * OUTPUT:
   {
     parts: [
       {
         filename: 'body-teal',
         data: '...'
       },
       {
         filename: 'accessory-txt-noun-multicolor',
         data: '...'
       },
       {
         filename: 'head-goat',
         data: '...'
       },
       {
         filename: 'glasses-square-red',
         data: '...'
       }
     ],
     background: 'e1d7d5'
   }
*/
const { parts, background } = getSportsManagerData(seed);

const svgBinary = buildSVG(parts, palette, background);
const svgBase64 = btoa(svgBinary);
```

The SportsManager SVG can then be displayed. Here's a dummy example using React

```ts
function SVG({ svgBase64 }) {
  return <img src={`data:image/svg+xml;base64,${svgBase64}`} />;
}
```

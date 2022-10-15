import { expect } from 'chai';
import { keccak256 as solidityKeccak256 } from '@ethersproject/solidity';
import {
  shiftRightAndCast,
  getPseudorandomPart,
  getSportsManagerSeedFromBlockHash,
  getSportsManagerData,
} from '../src/index';
import { images } from '../src/image-data.json';
import { SportsManagerSeed } from '../src/types';

const { bodies, accessories, heads, glasses } = images;

describe('@sports-manager/assets utils', () => {
  // Test against SportsManager 116, created at block 13661786
  const SPORTS_MANAGER116_ID = 116;
  const SPORTS_MANAGER116_SEED: SportsManagerSeed = {
    background: 1,
    body: 28,
    accessory: 120,
    head: 95,
    glasses: 15,
  };
  const SPORTS_MANAGER116_PREV_BLOCKHASH =
    '0x5014101691e81d79a2eba711e698118e1a90c9be7acb2f40d7f200134ee53e01';
  const SPORTS_MANAGER116_PSEUDORANDOMNESS = solidityKeccak256(
    ['bytes32', 'uint256'],
    [SPORTS_MANAGER116_PREV_BLOCKHASH, SPORTS_MANAGER116_ID],
  );

  describe('shiftRightAndCast', () => {
    it('should work correctly', () => {
      expect(shiftRightAndCast(SPORTS_MANAGER116_PREV_BLOCKHASH, 0, 48)).to.equal('0x00134ee53e01');
      expect(shiftRightAndCast(SPORTS_MANAGER116_PREV_BLOCKHASH, 48, 48)).to.equal('0x7acb2f40d7f2');
    });
  });

  describe('getPseudorandomPart', () => {
    it('should match SportsManagersSeeder.sol implementation for a pseudorandomly chosen part', () => {
      const headShift = 144;
      const { head } = SPORTS_MANAGER116_SEED;
      expect(getPseudorandomPart(SPORTS_MANAGER116_PSEUDORANDOMNESS, heads.length, headShift)).to.be.equal(
        head,
      );
    });
  });

  describe('getSportsManagerSeedFromBlockHash', () => {
    it('should match SportsManagersSeeder.sol implementation for generating a SportsManager seed', () => {
      expect(getSportsManagerSeedFromBlockHash(SPORTS_MANAGER116_ID, SPORTS_MANAGER116_PREV_BLOCKHASH)).to.deep.equal(
        SPORTS_MANAGER116_SEED,
      );
    });
  });
});

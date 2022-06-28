// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./SportsManagerStream.sol";

contract SportsManagerStreamFactory {
  event ContractDeployed(address indexed owner, address indexed group, string title);
  
  address public immutable implementation;

  constructor() {
    implementation = address(new SportsManagerStream());
  }

  function genesis(string calldata title, SportsManagerStream.Member[] calldata members) external returns (address) {
    address payable clone = payable(Clones.clone(implementation));
    SportsManagerStream s = SportsManagerStream(clone);
    s.initialize(members);
    emit ContractDeployed(msg.sender, clone, title);
    return clone;
  }
}
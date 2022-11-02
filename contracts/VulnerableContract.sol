// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

contract VulnerableContract {

    mapping(address => uint) public balances;

    receive() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() external {
        require(balances[msg.sender] > 0, "You have nothing to withdraw");

        (bool success,) = msg.sender.call{value: balances[msg.sender]}("");

        if (!success) {
            revert("Unable to transfer value to address");
        }

        // Here is the vulnerability: the balance is updated AFTER the transfer, but if the withdraw function is called
        // by a malicious smart contract, its receive/fallback function could call this withdraw function again,
        // creating a loop that empties the contract
        balances[msg.sender] = 0;
    }
}

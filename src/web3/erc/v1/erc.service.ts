import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Contract } from './json/contract';
const Web3 = require('web3');

@Injectable()
export class ErcServiceV1 {
  constructor(private readonly contractJson: Contract) {}

  async create(createErcDto) {
    try {
      const connectWeb3 = new Web3(
        new Web3.providers.HttpProvider(createErcDto.chain_link),
      );

      const wallet = await connectWeb3.eth.accounts.create();

      return {
        status: true,
        data: wallet,
      };
    } catch (e) {
      throw new HttpException(
        {
          status: false,
          message: e.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: e,
        },
      );
    }
  }

  async balance(balanceErcDto) {
    try {
      let balance;
      const web3 = new Web3(balanceErcDto.chain_link);

      if (balanceErcDto.type == 'coin') {
        const getBalance = await web3.eth.getBalance(balanceErcDto.address);

        balance = web3.utils.fromWei(getBalance.toString(), 'ether');
      }

      if (balanceErcDto.type == 'token') {
        const contractInstance = new web3.eth.Contract(
          this.contractJson.json(),
          balanceErcDto.contract,
        );
        const balanceCall = await contractInstance.methods
          .balanceOf(balanceErcDto.address)
          .call();
        const tokenDecimal = await contractInstance.methods.decimals().call();

        balance = (balanceCall / Math.pow(10, tokenDecimal)).toString();
      }

      return {
        status: true,
        data: balance,
      };
    } catch (e) {
      throw new HttpException(
        {
          status: false,
          message: e.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: e,
        },
      );
    }
  }
}

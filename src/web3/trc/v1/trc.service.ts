import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import * as TronWeb from 'tronweb';

@Injectable()
export class TrcServiceV1 {
  constructor(private readonly httpService: HttpService) {}

  tronWebCall() {
    return new TronWeb({
      fullHost: 'https://api.trongrid.io',
      headers: {
        'TRON-PRO-API-KEY': process.env.TRONGRID_API_KEY,
      },
    });
  }

  async create() {
    try {
      const tronWeb = this.tronWebCall();
      const response = await tronWeb.createAccount();

      return {
        status: true,
        data: {
          address: response.address.base58,
          privateKey: response.privateKey,
          publicKey: response.publicKey,
        },
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

  async balance(balanceTrcDto) {
    try {
      const tronWeb = this.tronWebCall();
      tronWeb.setAddress(balanceTrcDto.address);
      const contract = await tronWeb.contract().at(balanceTrcDto.contract);

      const response = await contract.balanceOf(balanceTrcDto.address).call();
      const decimal = await contract.decimals().call();
      const getDecimal = Math.pow(10, decimal);

      const balance = tronWeb.BigNumber(response._hex) / getDecimal;

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

  async send(sendTrcDto) {
    let contract;
    let amount;

    try {
      const tronWeb = this.tronWebCall();
      tronWeb.setPrivateKey(sendTrcDto.private_key);
      contract = await tronWeb.contract().at(sendTrcDto.contract);
      const decimalValue = await contract.decimals().call();
      const getDecimal = Math.pow(10, decimalValue);
      amount = parseInt(String(Number(sendTrcDto.amount) * getDecimal));

      const transaction = await contract
        .transfer(sendTrcDto.to_address, BigInt(amount.toString()))
        .send();

      if (transaction) {
        return {
          status: true,
          data: {
            hash: transaction,
          },
        };
      } else {
        return {
          status: false,
          message: 'Transaction failed',
        };
      }
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

  async transactions(transactionsTrcDto) {
    try {
      const url =
        'https://api.trongrid.io/v1/accounts/' +
        transactionsTrcDto.address +
        '/transactions/trc20?&contract_address=' +
        transactionsTrcDto.contract;
      const response: AxiosResponse<Response[]> = await this.httpService
        .get(url)
        .toPromise();

      return {
        status: true,
        data: response.data['data'],
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

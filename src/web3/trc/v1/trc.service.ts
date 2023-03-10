import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as TronWeb from 'tronweb';
import { HttpService } from '@nestjs/axios';

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
}

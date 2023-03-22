import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import * as TronWeb from 'tronweb';
import { tronWebCall } from '../../common/helper/helper.function';

@Injectable()
export class TrcServiceV1 {
  constructor(private readonly httpService: HttpService) {}

  async validateAddress(address) {
    const url = 'https://api.trongrid.io/wallet/validateaddress';
    const request: AxiosResponse<Response[]> = await this.httpService
      .post(url, { address: address })
      .toPromise();
    return request.data['message'] == 'Base58check format';
  }

  async create() {
    try {
      const tronWeb = tronWebCall(TronWeb);
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
      const validateAddress = await this.validateAddress(balanceTrcDto.address);

      if (validateAddress) {
        let balance;
        const tronWeb = tronWebCall(TronWeb);

        if (balanceTrcDto.type == 'coin') {
          const getBalance = await tronWeb.trx.getBalance(
            balanceTrcDto.address,
          );
          balance = parseFloat(tronWeb.fromSun(getBalance));
        }

        if (balanceTrcDto.type == 'token') {
          const validateContractAddress = await this.validateAddress(
            balanceTrcDto.contract,
          );
          if (validateContractAddress) {
            tronWeb.setAddress(balanceTrcDto.address);
            const contract = await tronWeb
              .contract()
              .at(balanceTrcDto.contract);

            const response = await contract
              .balanceOf(balanceTrcDto.address)
              .call();
            const decimal = await contract.decimals().call();
            const getDecimal = Math.pow(10, decimal);

            balance = tronWeb.BigNumber(response._hex) / getDecimal;
          } else {
            throw new HttpException(
              'Incorrect contract address',
              HttpStatus.BAD_REQUEST,
            );
          }
        }

        return {
          status: true,
          data: balance,
        };
      } else {
        throw new HttpException('Incorrect address', HttpStatus.BAD_REQUEST);
      }
    } catch (e) {
      throw new HttpException(
        {
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
    try {
      const validateAddress = await this.validateAddress(sendTrcDto.to_address);

      if (validateAddress) {
        let transaction;
        let contract;
        let amount;
        const tronWeb = tronWebCall(TronWeb);

        if (sendTrcDto.type == 'coin') {
          if (tronWeb.isAddress(sendTrcDto.to_address)) {
            amount = parseInt(tronWeb.toSun(sendTrcDto.amount));
            transaction = await tronWeb.trx.sendTransaction(
              sendTrcDto.to_address,
              amount,
              sendTrcDto.private_key,
            );
          }
        }

        if (sendTrcDto.type == 'token') {
          const validateContractAddress = await this.validateAddress(
            sendTrcDto.contract,
          );
          if (validateContractAddress) {
            tronWeb.setPrivateKey(sendTrcDto.private_key);
            contract = await tronWeb.contract().at(sendTrcDto.contract);
            const decimalValue = await contract.decimals().call();
            const getDecimal = Math.pow(10, decimalValue);
            amount = parseInt(String(Number(sendTrcDto.amount) * getDecimal));

            transaction = await contract
              .transfer(sendTrcDto.to_address, BigInt(amount.toString()))
              .send();

            transaction = await tronWeb.trx.getTransaction(transaction);
          } else {
            throw new HttpException(
              'Incorrect contract address',
              HttpStatus.BAD_REQUEST,
            );
          }
        }

        return {
          status: true,
          data: transaction,
        };
      } else {
        throw new HttpException(
          'Incorrect recipient address',
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (e) {
      throw new HttpException(
        {
          message: e.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: e,
        },
      );
    }
  }

  async transaction(transactionTrcDto) {
    try {
      const tronWeb = tronWebCall(TronWeb);

      const transaction = await tronWeb.trx.getTransaction(
        transactionTrcDto.txid,
      );

      return {
        status: true,
        data: transaction,
      };
    } catch (e) {
      throw new HttpException(
        {
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
      const validateAddress = await this.validateAddress(
        transactionsTrcDto.address,
      );

      if (validateAddress) {
        let result;
        let url =
          'https://api.trongrid.io/v1/accounts/' +
          transactionsTrcDto.address +
          '/transactions';

        if (transactionsTrcDto.type == 'coin') {
          url = url + '?only_confirmed=true';
        }

        if (transactionsTrcDto.type == 'token') {
          const validateContractAddress = await this.validateAddress(
            transactionsTrcDto.contract,
          );
          if (validateContractAddress) {
            url =
              url + '/trc20?&contract_address=' + transactionsTrcDto.contract;
          } else {
            throw new HttpException(
              'Incorrect contract address',
              HttpStatus.BAD_REQUEST,
            );
          }
        }

        if (transactionsTrcDto.payment_type == 'sent') {
          url = url + '&only_from=true';
        } else if (transactionsTrcDto.payment_type == 'received') {
          url = url + '&only_to=true';
        }

        const response: AxiosResponse<Response[]> = await this.httpService
          .get(url)
          .toPromise();

        if (transactionsTrcDto.type == 'coin') {
          result = response.data['data'].map(({ ret, txID, raw_data }) => ({
            is_success_transaction: ret[0].contractRet == 'SUCCESS',
            transaction_id: txID,
            from: '',
            to: '',
            value: '',
            timestamp: String(raw_data.timestamp),
          }));
        }

        if (transactionsTrcDto.type == 'token') {
          result = response.data['data'].map(
            ({
              token_info,
              transaction_id,
              from,
              to,
              value,
              block_timestamp,
            }) => ({
              token_symbol: token_info.symbol,
              transaction_id: transaction_id,
              from: from,
              to: to,
              value: value,
              timestamp: String(block_timestamp),
            }),
          );
        }

        return {
          status: true,
          data: result,
        };
      } else {
        throw new HttpException('Incorrect address', HttpStatus.BAD_REQUEST);
      }
    } catch (e) {
      throw new HttpException(
        {
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

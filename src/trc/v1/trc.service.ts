import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as TronWeb from 'tronweb';
import { tronWebCall } from '../../common/helper/helper.function';
import axios from 'axios';
import { ERROR_MESSAGES } from '../../common/constants/error-messages';

@Injectable()
export class TrcServiceV1 {
  private apiTrongridUrl = 'https://api.trongrid.io';

  async validateAddress(address) {
    try {
      const request = await axios.post(
        `${this.apiTrongridUrl}/wallet/validateaddress`,
        { address: address },
      );
      return request.data.message == 'Base58check format';
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
      // проверка валидности адреса
      const isAddressValid = await this.validateAddress(balanceTrcDto.address);

      if (!isAddressValid) {
        throw new HttpException(
          ERROR_MESSAGES.INCORRECT_ADDRESS,
          HttpStatus.BAD_REQUEST,
        );
      }

      let balance;
      const tronWeb = tronWebCall(TronWeb);

      if (balanceTrcDto.type == 'coin') {
        // получение баланса в формате sun
        const getBalance = await tronWeb.trx.getBalance(balanceTrcDto.address);

        // конвертация баланса из sun в TRX
        balance = parseFloat(tronWeb.fromSun(getBalance));
      }

      if (balanceTrcDto.type == 'token') {
        // проверка валидности адреса контракта
        const isContractValid = await this.validateAddress(
          balanceTrcDto.contract,
        );

        if (!isContractValid) {
          throw new HttpException(
            ERROR_MESSAGES.INCORRECT_CONTRACT_ADDRESS,
            HttpStatus.BAD_REQUEST,
          );
        }

        // установка адреса для работы с контрактом
        tronWeb.setAddress(balanceTrcDto.address);

        // получение экземпляра контракта по адресу
        const contract = await tronWeb.contract().at(balanceTrcDto.contract);

        // получение баланса адреса в токенах
        const response = await contract.balanceOf(balanceTrcDto.address).call();
        // получение количества decimal токена
        const decimal = await contract.decimals().call();
        const getDecimal = Math.pow(10, decimal);

        // конвертация и расчет баланса
        balance = tronWeb.BigNumber(response._hex) / getDecimal;
      }

      return {
        status: true,
        data: balance,
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

  async send(sendTrcDto) {
    try {
      // проверка валидности адреса получателя
      const isRecipientAddressValid = await this.validateAddress(
        sendTrcDto.to_address,
      );

      if (!isRecipientAddressValid) {
        throw new HttpException(
          ERROR_MESSAGES.INCORRECT_RECIPIENT_ADDRESS,
          HttpStatus.BAD_REQUEST,
        );
      }

      const tronWeb = tronWebCall(TronWeb);

      // получение адреса отправителя из приватного ключа
      const address = tronWeb.address.fromPrivateKey(sendTrcDto.private_key);
      let transaction;
      let response;

      if (sendTrcDto.type == 'coin') {
        // отправка TRX
        if (tronWeb.isAddress(sendTrcDto.to_address)) {
          // конвертация сумму в sun
          const amount = parseInt(tronWeb.toSun(sendTrcDto.amount));

          // отправка транзакции
          transaction = await tronWeb.trx.sendTransaction(
            sendTrcDto.to_address,
            amount,
            sendTrcDto.private_key,
          );

          response = {
            is_success_transaction: transaction.result,
            transaction_id: transaction.txid,
            from: address,
            to: sendTrcDto.to_address,
            value: String(sendTrcDto.amount),
            timestamp: String(transaction.transaction.raw_data.timestamp),
          };
        }
      } else if (sendTrcDto.type == 'token') {
        // проверка валидности адреса контракта
        const isContractValid = await this.validateAddress(sendTrcDto.contract);

        if (!isContractValid) {
          throw new HttpException(
            ERROR_MESSAGES.INCORRECT_CONTRACT_ADDRESS,
            HttpStatus.BAD_REQUEST,
          );
        }

        // установка приватного ключа
        tronWeb.setPrivateKey(sendTrcDto.private_key);

        // получение экземпляра контракта
        const contract = await tronWeb.contract().at(sendTrcDto.contract);

        // получение decimal токена
        const decimalValue = await contract.decimals().call();
        const getDecimal = Math.pow(10, decimalValue);

        // конвертация суммы в соответствии с decimal
        const amount = parseInt(String(Number(sendTrcDto.amount) * getDecimal));

        // отправка транзакции
        transaction = await contract
          .transfer(sendTrcDto.to_address, BigInt(amount.toString()))
          .send();

        // получение информации о транзакции
        transaction = await tronWeb.trx.getTransaction(transaction);

        response = {
          is_success_transaction: transaction.ret[0].contractRet == 'SUCCESS',
          transaction_id: transaction.txID,
          from: address,
          to: sendTrcDto.to_address,
          value: String(sendTrcDto.amount),
          timestamp: String(transaction.raw_data.timestamp),
        };
      }

      return {
        status: true,
        data: response,
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

  async transaction(transactionTrcDto) {
    try {
      const tronWeb = tronWebCall(TronWeb);

      // получение транзакции по ее идентификатору
      const transaction = await tronWeb.trx.getTransaction(
        transactionTrcDto.txid,
      );

      // проверка, является ли транзакция токеном
      const isTokenTransaction =
        transaction.raw_data.contract[0].type === 'TriggerSmartContract';

      let result;

      if (!isTokenTransaction) {
        const isSuccessTransaction =
          transaction.ret[0].contractRet === 'SUCCESS';
        const transactionId = transaction.txID;
        const senderAddress = tronWeb.address.fromHex(
          transaction.raw_data.contract[0].parameter.value.owner_address,
        );
        const recipientAddress = tronWeb.address.fromHex(
          transaction.raw_data.contract[0].parameter.value.to_address,
        );
        const value = (
          transaction.raw_data.contract[0].parameter.value.amount / 1e6
        ).toString();
        const timestamp = transaction.raw_data.timestamp.toString();

        result = {
          is_success_transaction: isSuccessTransaction,
          transaction_id: transactionId,
          from: senderAddress,
          to: recipientAddress,
          value: value,
          timestamp: timestamp,
        };
      } else {
        throw new HttpException(
          ERROR_MESSAGES.TOKEN_VIEW_NOT_AVAILABLE,
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      return {
        status: true,
        data: result,
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
      const isAddressValid = await this.validateAddress(
        transactionsTrcDto.address,
      );

      if (!isAddressValid) {
        throw new HttpException(
          ERROR_MESSAGES.INCORRECT_ADDRESS,
          HttpStatus.BAD_REQUEST,
        );
      }

      let url = `${this.apiTrongridUrl}/v1/accounts/${transactionsTrcDto.address}/transactions`;

      if (transactionsTrcDto.type == 'coin') {
        // если тип транзакции coin, добавляем параметр для получения только подтвержденных транзакций
        url += '?only_confirmed=true';
      } else if (transactionsTrcDto.type == 'token') {
        const isContractValid = await this.validateAddress(
          transactionsTrcDto.contract,
        );

        if (!isContractValid) {
          throw new HttpException(
            ERROR_MESSAGES.INCORRECT_CONTRACT_ADDRESS,
            HttpStatus.BAD_REQUEST,
          );
        }

        // если тип транзакции token, добавляем параметр для получения только транзакций связанных с указанным контрактом
        url += `/trc20?&contract_address=${transactionsTrcDto.contract}`;
      }

      if (transactionsTrcDto.payment_type == 'sent') {
        // если тип платежа sent, добавляем параметр для получения только исходящих транзакций
        url += '&only_from=true';
      } else if (transactionsTrcDto.payment_type == 'received') {
        // если тип платежа received, добавляем параметр для получения только входящих транзакций
        url += '&only_to=true';
      }

      // выполняем GET-запрос по полученному URL
      const response = await axios.get(url);

      let result;

      if (transactionsTrcDto.type == 'coin') {
        // маппим данные транзакций для формирования результата
        result = response.data.data.map(({ ret, txID, raw_data }) => ({
          is_success_transaction: ret[0].contractRet == 'SUCCESS',
          transaction_id: txID,
          from: '',
          to: '',
          value: '',
          timestamp: String(raw_data.timestamp),
        }));
      } else if (transactionsTrcDto.type == 'token') {
        const tronWeb = tronWebCall(TronWeb);

        // маппим данные транзакций для формирования результата
        result = response.data.data.map(
          ({
            token_info,
            transaction_id,
            from,
            to,
            value,
            block_timestamp,
          }) => ({
            token_symbol: token_info.symbol,
            transaction_id,
            from,
            to,
            value: tronWeb.fromSun(value),
            timestamp: String(block_timestamp),
          }),
        );
      }

      return {
        status: true,
        data: result,
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
}

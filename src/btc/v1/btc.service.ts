import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';
import { validate } from 'bitcoin-address-validation';
import {
  convertFromSatoshi,
  convertToSatoshi,
} from '../../common/helper/helper.function';
import * as bitcoin from 'bitcoinjs-lib';
import { ERROR_MESSAGES } from '../../common/constants/error-messages';

@Injectable()
export class BtcServiceV1 {
  private apiBlockchairUrl = 'https://api.blockchair.com/bitcoin';

  getAddressFromPrivateKey(privateKey) {
    // WIF (Wallet Import Format)
    // const keyPair = bitcoin.ECPair.fromPrivateKey(
    //   Buffer.from(privateKey, 'hex'),
    // );

    // HEX format
    const keyPair = bitcoin.ECPair.fromWIF(privateKey);
    const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
    return address;
  }

  async averageFee() {
    try {
      const response = await axios.get(this.apiBlockchairUrl + '/stats');
      return {
        status: true,
        data: {
          satoshi: response.data.data.suggested_transaction_fee_per_byte_sat,
          bitcoin: convertFromSatoshi(
            response.data.data.suggested_transaction_fee_per_byte_sat,
          ).toFixed(8),
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

  async getPreviousTransactionInfo(address) {
    try {
      const transactionsFull = await this.transactions({ address }, 'full');

      let latestTransaction = null;
      let latestBlockId = 0;

      for (const transaction of transactionsFull.data) {
        const transactionHash = Object.keys(transaction)[0];
        const blockId = transaction[transactionHash].transaction.block_id;

        if (blockId > latestBlockId) {
          latestBlockId = blockId;
          latestTransaction = transaction[transactionHash];
        }
      }

      // если не найдено предыдущих транзакций, выбрасываем исключение
      if (latestTransaction === null) {
        throw new HttpException(
          ERROR_MESSAGES.NO_PREVIOUS_TRANSACTIONS,
          HttpStatus.BAD_REQUEST,
        );
      }

      return {
        previousTransactionHash: latestTransaction.transaction.hash,
        previousOutputIndex: latestTransaction.outputs[0].index,
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

  async create() {
    try {
      // генерируем Private Key
      const keyPair = bitcoin.ECPair.makeRandom({
        network: bitcoin.networks.bitcoin,
      });
      const privateKey = keyPair.toWIF();

      // получаем Public Key из Private Key
      const publicKey = keyPair.publicKey.toString('hex');

      // получаем адрес из Public Key
      const { address } = bitcoin.payments.p2pkh({
        pubkey: keyPair.publicKey,
        network: bitcoin.networks.bitcoin,
      });

      return {
        status: true,
        data: {
          address: address,
          privateKey: privateKey,
          publicKey: publicKey,
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

  async balance(balanceBtcDto) {
    try {
      const address = balanceBtcDto.address;

      if (!validate(address)) {
        throw new HttpException(
          ERROR_MESSAGES.INCORRECT_ADDRESS,
          HttpStatus.BAD_REQUEST,
        );
      }

      const response = await axios.get(
        `${this.apiBlockchairUrl}/dashboards/address/${address}`,
        {
          params: {
            key: process.env.BLOCKCHAIR_APIKEY,
            state: 'latest',
          },
        },
      );
      const balanceData = response.data.data[address]?.address || null;

      const balance = balanceData.balance;

      return {
        status: true,
        data: convertFromSatoshi(balance),
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

  async send(sendBtcDto) {
    try {
      // получаем адрес отправителя из Private Key
      const address = this.getAddressFromPrivateKey(sendBtcDto.private_key);
      // получаем адрес получателя
      const toAddress = sendBtcDto.to_address;
      // запрос на транзакции отправителя
      const transactions = await this.transactions({ address }, 'standard');

      // ------------------------------ //
      //     прохождение условий        //
      // ------------------------------ //
      // ищем, есть ли неподтвержденные транзакции
      const unconfirmedTransaction = !!transactions.data.find((transaction) => {
        return !transaction.is_success_transaction;
      }) as boolean;

      if (unconfirmedTransaction) {
        throw new HttpException(
          ERROR_MESSAGES.UNCONFIRMED_TRANSACTION,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

      // ищем, есть ли уже ранее отправленные транзакции этому получателю
      const shippingAddresses = !!transactions.data.find((transaction) => {
        return transaction.to === toAddress;
      }) as boolean;

      if (shippingAddresses) {
        throw new HttpException(
          ERROR_MESSAGES.DUPLICATE_TRANSACTION,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

      const feePerByte =
        sendBtcDto.fee || (await this.averageFee()).data.satoshi;

      if (feePerByte < 20) {
        throw new HttpException(
          ERROR_MESSAGES.SMALL_FEE_VALUE,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

      if (!validate(toAddress)) {
        throw new HttpException(
          ERROR_MESSAGES.INCORRECT_RECIPIENT_ADDRESS,
          HttpStatus.BAD_REQUEST,
        );
      }

      // получаем хэш предыдущей транзакции и индекс выхода, связанные с указанным адресом
      const { previousTransactionHash, previousOutputIndex } =
        await this.getPreviousTransactionInfo(address);

      // ------------------------------ //
      //     создание транзакции        //
      // ------------------------------ //
      // создаем транзакцию на основе TransactionBuilder
      const txb = new bitcoin.TransactionBuilder(bitcoin.networks.bitcoin);
      const privateKeyBuffer = bitcoin.ECPair.fromWIF(
        sendBtcDto.private_key,
      ).privateKey;

      // добавляем вход в транзакцию, используя хэш предыдущей транзакции и индекс выхода
      txb.addInput(previousTransactionHash, previousOutputIndex);

      // добавляем выходную точку для отправки средств на указанный адрес и конвертируем сумму в сатоши
      txb.addOutput(toAddress, convertToSatoshi(sendBtcDto.amount));

      // подписываем входную точку транзакции с помощью приватного ключа
      // txb.sign(previousOutputIndex, bitcoin.ECPair.fromPrivateKey(privateKeyBuffer));
      // txb.sign(0, bitcoin.ECPair.fromPrivateKey(privateKeyBuffer));
      const signatureHashType =
        bitcoin.Transaction.SIGHASH_ALL | bitcoin.Transaction.SIGHASH_FORKID;
      txb.sign(
        0,
        bitcoin.ECPair.fromPrivateKey(privateKeyBuffer),
        null,
        signatureHashType,
      );

      // создаем полную транзакцию
      const builtTransaction = txb.build();

      // ------------------------------ //
      //   расчет и установка комиссии  //
      // ------------------------------ //
      // рассчитываем размер транзакции в байтах
      const transactionSize = builtTransaction.byteLength();

      // рассчитываем общую комиссию в сатоши
      const calculateFee = feePerByte * transactionSize;

      // проверяем, что выход с указанным индексом существует
      if (previousOutputIndex >= builtTransaction.outs.length) {
        throw new HttpException(
          ERROR_MESSAGES.NONEXISTENT_OUTPUT(previousOutputIndex),
          HttpStatus.BAD_REQUEST,
        );
      }

      // устанавливаем комиссию для выхода с указанным индексом
      builtTransaction.fee = calculateFee;
      // builtTransaction.outs[previousOutputIndex].value = calculateFee;

      // получаем шестнадцатеричное представление транзакции
      const hexTransaction = builtTransaction.toHex();

      // используем ранее рассчитанный calculateFee для каждого выхода
      const totalFeePerOutput = calculateFee;

      // рассчитываем комиссию для всех входов
      const totalFeePerInput = feePerByte * builtTransaction.ins.length;

      // рассчитываем общую комиссию
      const totalFee = totalFeePerOutput + totalFeePerInput;

      // получаем сумму комиссии и кол-ва отправляемых биткоинов
      const totalPay = convertFromSatoshi(totalFee) + sendBtcDto.amount;

      // приводим общую сумму платежа в числовой формат
      const totalPayFormat = parseFloat(totalPay);

      // получаем баланс пользователя с учетом неподтвержденных транзакций
      const userBalance = await this.balance({ address });

      // проверяем баланс пользователя
      if (userBalance.data < totalPayFormat) {
        throw new HttpException(
          ERROR_MESSAGES.INSUFFICIENT_COIN_BALANCE,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return axios
        .post(`${this.apiBlockchairUrl}/push/transaction`, {
          data: hexTransaction,
        })
        .then((response) => {
          return {
            is_success_transaction: true,
            transaction_id: response.data.hash,
            from: address,
            to: sendBtcDto.to_address,
            value: String(sendBtcDto.amount),
            timestamp: String(Date.now()),
          };
        })
        .catch((e) => {
          const errorMessage = e.response.data.context.error.toString();

          switch (errorMessage) {
            case 'Invalid transaction. Error: txn-mempool-conflict':
              throw new HttpException(
                ERROR_MESSAGES.INCOMPLETE_TRANSACTION,
                HttpStatus.INTERNAL_SERVER_ERROR,
              );
            case 'Invalid transaction. Error: bad-txns-inputs-missingorspent':
              throw new HttpException(
                ERROR_MESSAGES.INVALID_PREVIOUS_HASH,
                HttpStatus.INTERNAL_SERVER_ERROR,
              );
            default:
              throw new HttpException(
                errorMessage,
                HttpStatus.INTERNAL_SERVER_ERROR,
              );
          }
        });
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

  async transaction(transactionBtcDto, dataType) {
    try {
      const response = await axios.get(
        `${this.apiBlockchairUrl}/dashboards/transaction/${transactionBtcDto.hash}`,
        {
          params: {
            key: process.env.BLOCKCHAIR_APIKEY,
          },
        },
      );

      // если тип 'full', тогда возвращаем все данные о транзакции
      if (dataType === 'full') {
        return response.data;
      }

      // извлечение данных транзакции из ответа API
      const transactionData = response.data.data[transactionBtcDto.hash];
      const transaction = transactionData.transaction;
      const input = transactionData.inputs[0];
      const output = transactionData.outputs[0];

      return {
        status: true,
        data: {
          is_success_transaction: transaction.block_id !== -1,
          transaction_id: transaction.hash,
          from: input.recipient,
          to: output.recipient,
          value: convertFromSatoshi(output.value).toString(),
          fee: convertFromSatoshi(transaction.fee).toString(),
          timestamp: new Date(transaction.time).getTime().toString(),
        },
      };
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async transactions(transactionsBtcDto, dataType) {
    try {
      const address = transactionsBtcDto.address;

      if (!validate(address)) {
        throw new HttpException(
          ERROR_MESSAGES.INCORRECT_ADDRESS,
          HttpStatus.BAD_REQUEST,
        );
      }

      const response = await axios.get(
        `${this.apiBlockchairUrl}/dashboards/address/${address}`,
        {
          params: {
            key: process.env.BLOCKCHAIR_APIKEY,
          },
        },
      );
      const data = response.data.data[address];

      // проверка наличия данных для адреса
      if (!data) {
        throw new HttpException(
          ERROR_MESSAGES.ADDRESS_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }

      const transactions = data.transactions;
      const transactionList = [];

      // обработка каждой транзакции
      for (const hash of transactions) {
        // получение данных о транзакции
        const transactionData = await this.transaction({ hash }, dataType);
        const transaction = transactionData.data;

        // добавление транзакции в список
        transactionList.push({
          ...transaction,
        });
      }

      return {
        status: true,
        data: transactionList,
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

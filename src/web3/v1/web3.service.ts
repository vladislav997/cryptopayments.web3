import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { getAddressByPrivateKeyWeb3 } from '../../common/helpers/helper.function';
import axios from 'axios';
import contractJson from '../../common/helpers/contract-json';
import { ERROR_MESSAGES } from '../../common/constants/error-messages';
const Web3 = require('web3');

@Injectable()
export class Web3ServiceV1 {
  private apiEtherscanUrl = 'https://api.etherscan.io/api';
  private apiBscscanUrl = 'https://api.bscscan.com/api';

  async getContractDecimal(web3, contract) {
    try {
      const getContract = new web3.eth.Contract(contractJson(), contract);
      // вызов функции decimals контракта для получения количества десятичных знаков
      return await getContract.methods.decimals().call();
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

  async balanceCall(web3, contract, address) {
    try {
      const getContract = new web3.eth.Contract(contractJson(), contract);
      // вызов функции balanceOf контракта для получения баланса
      return await getContract.methods.balanceOf(address).call();
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

  async calculateEstimateGasFees(web3, amount, address, dto) {
    const gasPrice = await web3.eth.getGasPrice();
    let usedGasLimit = dto.gas_limit;
    let estimateGas = 0;
    let gasFees = 0;
    const contract = new web3.eth.Contract(contractJson(), dto.contract);

    if (Number(usedGasLimit) <= 0) {
      // оценка необходимого лимита газа для выполнения транзакции
      estimateGas = await contract.methods
        .transfer(dto.to_address, amount)
        .estimateGas({ from: address });
      // рассчет использованного предела газа
      usedGasLimit = parseInt(String(estimateGas / 2)) + estimateGas;
    }

    // вычисление общих комиссий в газе
    gasFees = Number(usedGasLimit) * Number(gasPrice);

    // преобразование комиссий из Wei в Ether
    const finalGasFees = Web3.utils.fromWei(gasFees.toString());

    return {
      gasLimit: usedGasLimit,
      gasPrice,
      estimateGasFees: finalGasFees,
    };
  }

  async create(chainLink) {
    try {
      const web3 = new Web3(new Web3.providers.HttpProvider(chainLink));
      const wallet = await web3.eth.accounts.create();

      return {
        status: true,
        data: wallet,
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

  async balance(chainLink, balanceWeb3Dto) {
    try {
      const web3 = new Web3(chainLink);
      const isAddressValid = web3.utils.isAddress(balanceWeb3Dto.address);

      if (!isAddressValid) {
        throw new HttpException(
          ERROR_MESSAGES.INCORRECT_ADDRESS,
          HttpStatus.BAD_REQUEST,
        );
      }

      let balance;

      if (balanceWeb3Dto.type == 'coin') {
        // получение баланса Эфира
        const getBalance = await web3.eth.getBalance(balanceWeb3Dto.address);

        // преобразование баланса из Wei в Ether
        balance = parseFloat(
          web3.utils.fromWei(getBalance.toString(), 'ether'),
        );
      }

      if (balanceWeb3Dto.type == 'token') {
        const isContractValid = web3.utils.isAddress(balanceWeb3Dto.contract);

        // проверка валидности адреса контракта
        if (!isContractValid) {
          throw new HttpException(
            ERROR_MESSAGES.INCORRECT_CONTRACT_ADDRESS,
            HttpStatus.BAD_REQUEST,
          );
        }

        // получение decimal для токена
        const decimal = await this.getContractDecimal(
          web3,
          balanceWeb3Dto.contract,
        );

        // вызов функции balanceOf контракта токена
        const balanceCall = await this.balanceCall(
          web3,
          balanceWeb3Dto.contract,
          balanceWeb3Dto.address,
        );

        // преобразование баланса токена
        balance = balanceCall / Math.pow(10, decimal);
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

  async send(chainLink, chainId, sendWeb3Dto) {
    try {
      // проверка валидности адреса получателя
      const isRecipientAddressValid = new Web3.utils.isAddress(
        sendWeb3Dto.to_address,
      );

      if (!isRecipientAddressValid) {
        throw new HttpException(
          ERROR_MESSAGES.INCORRECT_RECIPIENT_ADDRESS,
          HttpStatus.BAD_REQUEST,
        );
      }

      let transaction;
      const web3 = new Web3(chainLink);
      const address = getAddressByPrivateKeyWeb3(web3, sendWeb3Dto.private_key);

      // определение типа отправки: Эфир или токен
      if (sendWeb3Dto.type == 'coin') {
        // формирование объекта транзакции для отправки эфира
        transaction = await this.coinSend(web3, chainId, sendWeb3Dto, address);
      } else if (sendWeb3Dto.type == 'token') {
        // формирование объекта транзакции для отправки токена
        transaction = await this.tokenSend(web3, sendWeb3Dto, address);
      }

      // подпись и отправка транзакции
      const response = await this.signedAndSendTransaction(
        web3,
        sendWeb3Dto,
        transaction,
        address,
      );

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

  async coinSend(web3, chainId, sendWeb3Dto, address) {
    try {
      // преобразование суммы в единицы wei
      const amount = Web3.utils.toWei(sendWeb3Dto.amount.toString(), 'ether');

      // получение текущего nonce для адреса
      const nonce = await web3.eth.getTransactionCount(address, 'latest');

      // определение используемого лимита газа
      const usedGasLimit =
        sendWeb3Dto.gas_limit > 0 ? sendWeb3Dto.gas_limit : 63000;

      // формирование объекта транзакции для отправки эфира
      return {
        from: address,
        nonce: web3.utils.toHex(nonce),
        gas: usedGasLimit,
        to: sendWeb3Dto.to_address,
        value: amount,
        chainId: chainId,
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

  async tokenSend(web3, sendWeb3Dto, address) {
    try {
      // проверка валидности адреса контракта
      const isValidateContract = new Web3().utils.isAddress(
        sendWeb3Dto.contract,
      );
      if (!isValidateContract) {
        throw new HttpException(
          ERROR_MESSAGES.INCORRECT_CONTRACT_ADDRESS,
          HttpStatus.BAD_REQUEST,
        );
      }

      // получение количества decimal у контракта
      const decimal = await this.getContractDecimal(web3, sendWeb3Dto.contract);

      // расчет суммы перевода в соответствии с decimal
      const amount = (
        sendWeb3Dto.amount * Math.pow(10, decimal)
      ).toLocaleString('fullwide', { useGrouping: false });

      // расчет оценочной стоимости газа для транзакции
      const calculateEstimateGasFees = await this.calculateEstimateGasFees(
        web3,
        amount,
        address,
        sendWeb3Dto,
      );
      const contract = new web3.eth.Contract(
        contractJson(),
        sendWeb3Dto.contract,
      );

      // формирование объекта транзакции для отправки токенов
      return {
        from: address,
        to: sendWeb3Dto.contract,
        gas: calculateEstimateGasFees.gasLimit,
        data: contract.methods
          .transfer(sendWeb3Dto.to_address, amount)
          .encodeABI(),
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

  async signedAndSendTransaction(web3, sendWeb3Dto, transaction, address) {
    // подпись транзакции с использованием приватного ключа и отправкой
    const signTransaction = await web3.eth.accounts.signTransaction(
      transaction,
      sendWeb3Dto.private_key,
    );
    // ожидание получения результата выполнения транзакции
    const receipt = await new Promise<any>((resolve, reject) =>
      web3.eth
        .sendSignedTransaction(signTransaction.rawTransaction)
        .on('receipt', resolve)
        .on('error', reject),
    );

    // формирование объекта с результатами выполнения транзакции
    return {
      is_success_transaction: receipt.status,
      transaction_id: receipt.transactionHash,
      from: address,
      to: sendWeb3Dto.to_address,
      value: String(sendWeb3Dto.amount),
      timestamp: String(Date.now()),
    };
  }

  async transactions(chainLink, chainId, apiKey, transactionsWeb3Dto) {
    try {
      const isAddressValid = new Web3().utils.isAddress(
        transactionsWeb3Dto.address,
      );

      if (!isAddressValid) {
        throw new HttpException(
          ERROR_MESSAGES.INCORRECT_ADDRESS,
          HttpStatus.BAD_REQUEST,
        );
      }

      let result;
      let url;

      // формирование API URL в зависимости от выбранной сети
      switch (chainId) {
        case '1':
          url = `${this.apiEtherscanUrl}?module=account`;
          break;
        case '56':
          url = `${this.apiBscscanUrl}?module=account`;
          break;
      }

      if (transactionsWeb3Dto.type == 'coin') {
        url += '&action=txlist&endblock=99999999';
      }

      if (transactionsWeb3Dto.type == 'token') {
        // проверка валидности адреса контракта
        const isContractValid = new Web3().utils.isAddress(
          transactionsWeb3Dto.contract,
        );

        if (!isContractValid) {
          throw new HttpException(
            ERROR_MESSAGES.INCORRECT_CONTRACT_ADDRESS,
            HttpStatus.BAD_REQUEST,
          );
        }

        url += `&action=tokentx&endblock=999999999&contractaddress=${transactionsWeb3Dto.contract}`;
      }

      url += `&address=${transactionsWeb3Dto.address}&startblock=0&sort=asc&apikey=${apiKey}`;

      const response = await axios.get(url);

      if (transactionsWeb3Dto.type == 'coin') {
        // обработка результатов для типа 'coin'
        result = response.data.result.map(
          ({ txreceipt_status, hash, from, to, value, timeStamp }) => ({
            is_success_transaction: txreceipt_status == 1,
            transaction_id: hash,
            from,
            to,
            value: Web3.utils.fromWei(value.toString(), 'ether'),
            timestamp: timeStamp,
          }),
        );
      }

      if (transactionsWeb3Dto.type == 'token') {
        // обработка результатов для типа 'token'
        const web3 = new Web3(chainLink);
        const decimal = await this.getContractDecimal(
          web3,
          transactionsWeb3Dto.contract,
        );

        result = response.data.result.map(
          ({ tokenSymbol, hash, from, to, value, timeStamp }) => ({
            token_symbol: tokenSymbol,
            transaction_id: hash,
            from,
            to,
            value: (value / Math.pow(10, decimal)).toLocaleString('fullwide', {
              useGrouping: false,
            }),
            timestamp: timeStamp,
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

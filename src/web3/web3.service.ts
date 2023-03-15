import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Contract } from './json/contract';
const Web3 = require('web3');

@Injectable()
export class Web3Service {
  constructor(private readonly contractJson: Contract) {}

  async getContractDecimal(web3, contract) {
    const getContract = new web3.eth.Contract(
      this.contractJson.json(),
      contract,
    );
    return await getContract.methods.decimals().call();
  }

  async balanceCall(web3, contract, address) {
    const getContract = new web3.eth.Contract(
      this.contractJson.json(),
      contract,
    );
    return await getContract.methods.balanceOf(address).call();
  }

  async calculateEstimateGasFees(web3, amount, dto) {
    let usedGasLimit = dto.gas_limit;
    let estimateGas;
    const gasPrice = await web3.eth.getGasPrice();
    let gasFees = usedGasLimit * gasPrice;
    const contract = new web3.eth.Contract(
      this.contractJson.json(),
      dto.contract,
    );

    if (usedGasLimit > 0) {
      gasFees = usedGasLimit * gasPrice;
    } else {
      estimateGas = await contract.methods
        .transfer(dto.to_address, amount)
        .estimateGas({ from: dto.address });
      usedGasLimit = parseInt(String(estimateGas / 2)) + estimateGas;
    }

    const finalGasFees = Web3.utils.fromWei(gasFees.toString());

    return {
      amount: amount,
      tx: 'ok',
      gasLimit: usedGasLimit,
      gasPrice: gasPrice,
      estimateGasFees: finalGasFees,
    };
  }

  async create(chainLink) {
    try {
      const connectWeb3 = new Web3(new Web3.providers.HttpProvider(chainLink));

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

  async balance(chainLink, balanceWeb3Dto) {
    try {
      let balance;
      const web3 = new Web3(chainLink);

      if (balanceWeb3Dto.type == 'coin') {
        const getBalance = await web3.eth.getBalance(balanceWeb3Dto.address);

        balance = parseFloat(
          web3.utils.fromWei(getBalance.toString(), 'ether'),
        );
      }

      if (balanceWeb3Dto.type == 'token') {
        const decimal = await this.getContractDecimal(
          web3,
          balanceWeb3Dto.contract,
        );
        const balanceCall = await this.balanceCall(
          web3,
          balanceWeb3Dto.contract,
          balanceWeb3Dto.address,
        );

        balance = balanceCall / Math.pow(10, decimal);
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

  async send(chainLink, chainId, sendWeb3Dto) {
    try {
      let transaction;
      const web3 = new Web3(chainLink);
      const validateRecipientAddress = new Web3().utils.isAddress(
        sendWeb3Dto.to_address,
      );

      if (validateRecipientAddress) {
        if (sendWeb3Dto.type == 'coin') {
          const amount = Web3.utils.toWei(
            sendWeb3Dto.amount.toString(),
            'ether',
          );
          const nonce = await web3.eth.getTransactionCount(
            sendWeb3Dto.address,
            'latest',
          );
          const usedGasLimit =
            sendWeb3Dto.gas_limit > 0 ? sendWeb3Dto.gas_limit : 63000;

          transaction = {
            from: sendWeb3Dto.address,
            nonce: web3.utils.toHex(nonce),
            gas: usedGasLimit,
            to: sendWeb3Dto.to_address,
            value: amount,
            chainId: chainId,
          };
        }

        if (sendWeb3Dto.type == 'token') {
          const decimal = await this.getContractDecimal(
            web3,
            sendWeb3Dto.contract,
          );

          const amount = (
            sendWeb3Dto.amount * Math.pow(10, decimal)
          ).toLocaleString('fullwide', { useGrouping: false });

          const calculateEstimateGasFees = await this.calculateEstimateGasFees(
            web3,
            amount,
            sendWeb3Dto,
          );
          const contract = new web3.eth.Contract(
            this.contractJson.json(),
            sendWeb3Dto.contract,
          );

          transaction = {
            from: sendWeb3Dto.address,
            to: sendWeb3Dto.contract,
            gas: Web3.utils.toHex(calculateEstimateGasFees.gasLimit),
            data: contract.methods
              .transfer(sendWeb3Dto.to_address, amount)
              .encodeABI(),
          };
        }

        const signTransaction = await web3.eth.accounts.signTransaction(
          transaction,
          sendWeb3Dto.private_key,
        );
        const receipt = await new Promise(async (resolve, reject) => {
          await web3.eth
            .sendSignedTransaction(signTransaction.rawTransaction)
            .on('receipt', (receipt) => {
              resolve(receipt);
            })
            .on('error', (error) => {
              reject(error);
            });
        });

        return {
          status: true,
          data: receipt,
        };
      } else {
        throw new HttpException(
          {
            status: false,
            message: 'Incorrect recipient address',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
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
}

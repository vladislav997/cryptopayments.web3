import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  HttpCode,
  Get,
  Query,
} from '@nestjs/common';
import { Web3Service } from '../../web3/web3.service';
import { BalanceWeb3Dto } from '../../web3/dto/balance-web3.dto';
import { SendWeb3Dto } from '../../web3/dto/send-web3.dto';
import { TransactionsWeb3Dto } from '../../web3/dto/transactions-web3.dto';

@Controller({
  path: 'erc',
  version: '1',
})
export class ErcControllerV1 {
  constructor(private readonly web3Service: Web3Service) {}

  @Post('/create')
  @HttpCode(201)
  create() {
    return this.web3Service.create(process.env.CHAIN_LINK_ETH);
  }

  @Get('/balance')
  @HttpCode(200)
  balance(@Query(new ValidationPipe()) balanceWeb3Dto: BalanceWeb3Dto) {
    return this.web3Service.balance(process.env.CHAIN_LINK_ETH, balanceWeb3Dto);
  }

  @Post('/send')
  @HttpCode(200)
  send(
    @Body(new ValidationPipe({ transform: true })) sendWeb3Dto: SendWeb3Dto,
  ) {
    return this.web3Service.send(
      process.env.CHAIN_LINK_ETH,
      process.env.CHAIN_ID_ETH,
      sendWeb3Dto,
    );
  }

  @Get('/transactions')
  @HttpCode(200)
  transactions(
    @Query(new ValidationPipe()) transactionsWeb3Dto: TransactionsWeb3Dto,
  ) {
    return this.web3Service.transactions(
      process.env.CHAIN_LINK_ETH,
      process.env.CHAIN_ID_ETH,
      process.env.ETHERSCAN_APIKEY,
      transactionsWeb3Dto,
    );
  }
}

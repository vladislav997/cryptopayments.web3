import { Controller, Post, Body, ValidationPipe, Res, HttpCode } from '@nestjs/common';
import { Web3Service } from '../../web3/web3.service';
import { BalanceWeb3Dto } from '../../web3/dto/balance-web3.dto';
import { SendWeb3Dto } from '../../web3/dto/send-web3.dto';
import { TransactionsWeb3Dto } from '../../web3/dto/transactions-web3.dto';

@Controller({
  path: 'bsc',
  version: '1',
})
export class BscControllerV1 {
  constructor(private readonly web3Service: Web3Service) {}

  @Post('/create')
  @HttpCode(201)
  create() {
    return this.web3Service.create(process.env.CHAIN_LINK_BSC);
  }

  @Post('/balance')
  @HttpCode(200)
  balance(@Body(new ValidationPipe()) balanceWeb3Dto: BalanceWeb3Dto) {
    return this.web3Service.balance(process.env.CHAIN_LINK_BSC, balanceWeb3Dto);
  }

  @Post('/send')
  @HttpCode(200)
  send(
    @Body(new ValidationPipe({ transform: true })) sendWeb3Dto: SendWeb3Dto,
  ) {
    return this.web3Service.send(
      process.env.CHAIN_LINK_BSC,
      process.env.CHAIN_ID_BSC,
      sendWeb3Dto,
    );
  }

  @Post('/transactions')
  @HttpCode(200)
  transactions(
    @Body(new ValidationPipe()) transactionsWeb3Dto: TransactionsWeb3Dto,
  ) {
    return this.web3Service.transactions(
      process.env.CHAIN_LINK_BSC,
      process.env.BSCSCAN_APIKEY,
      transactionsWeb3Dto,
    );
  }
}

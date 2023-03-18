import { Controller, Post, Body, ValidationPipe, HttpCode } from '@nestjs/common';
import { TrcServiceV1 } from './trc.service';
import { BalanceTrcDto } from './dto/balance-trc.dto';
import { SendTrcDto } from './dto/send-trc.dto';
import { TransactionsTrcDto } from './dto/transactions-trc-dto';
import { TransactionTrcDto } from './dto/transaction-trc-dto';

@Controller({
  path: 'trc',
  version: '1',
})
export class TrcControllerV1 {
  constructor(private readonly trcService: TrcServiceV1) {}

  @Post('/create')
  @HttpCode(201)
  create() {
    return this.trcService.create();
  }

  @Post('/balance')
  @HttpCode(200)
  balance(@Body(new ValidationPipe()) balanceTrcDto: BalanceTrcDto) {
    return this.trcService.balance(balanceTrcDto);
  }

  @Post('/send')
  @HttpCode(200)
  send(@Body(new ValidationPipe()) sendTrcDto: SendTrcDto) {
    return this.trcService.send(sendTrcDto);
  }

  @Post('/transaction')
  @HttpCode(200)
  transaction(
    @Body(new ValidationPipe()) transactionTrcDto: TransactionTrcDto,
  ) {
    return this.trcService.transaction(transactionTrcDto);
  }

  @Post('/transactions')
  @HttpCode(200)
  transactions(
    @Body(new ValidationPipe()) transactionsTrcDto: TransactionsTrcDto,
  ) {
    return this.trcService.transactions(transactionsTrcDto);
  }
}

import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
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
  create() {
    return this.trcService.create();
  }

  @Post('/balance')
  balance(@Body(new ValidationPipe()) balanceTrcDto: BalanceTrcDto) {
    return this.trcService.balance(balanceTrcDto);
  }

  @Post('/send')
  send(@Body(new ValidationPipe()) sendTrcDto: SendTrcDto) {
    return this.trcService.send(sendTrcDto);
  }

  @Post('/transaction')
  transaction(@Body(new ValidationPipe()) transactionTrcDto: TransactionTrcDto) {
    return this.trcService.transaction(transactionTrcDto);
  }

  @Post('/transactions')
  transactions(@Body(new ValidationPipe()) transactionsTrcDto: TransactionsTrcDto) {
    return this.trcService.transactions(transactionsTrcDto);
  }
}

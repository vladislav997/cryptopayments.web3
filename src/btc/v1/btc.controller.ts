import {
  Body,
  Controller,
  HttpCode,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { BtcServiceV1 } from './btc.service';
import { BalanceBtcDto } from './dto/balance-btc.dto';
import { SendBtcDto } from './dto/send-btc.dto';
import { TransactionsBtcDto } from './dto/transactions-btc.dto';
import { TransactionBtcDto } from './dto/transaction-btc.dto';

@Controller({
  path: 'btc',
  version: '1',
})
export class BtcControllerV1 {
  constructor(private readonly btcService: BtcServiceV1) {}

  @Post('/create')
  @HttpCode(201)
  create() {
    return this.btcService.create();
  }

  @Post('/balance')
  @HttpCode(200)
  balance(@Body(new ValidationPipe()) balanceBrcDto: BalanceBtcDto) {
    return this.btcService.balance(balanceBrcDto);
  }

  @Post('/send')
  @HttpCode(200)
  send(@Body(new ValidationPipe()) sendBtcDto: SendBtcDto) {
    return this.btcService.send(sendBtcDto);
  }

  @Post('/transaction')
  @HttpCode(200)
  transaction(@Body(new ValidationPipe()) transactionBtcDto: TransactionBtcDto) {
    return this.btcService.transaction(transactionBtcDto);
  }

  @Post('/transactions')
  @HttpCode(200)
  transactions(@Body(new ValidationPipe()) transactionsBtcDto: TransactionsBtcDto) {
    return this.btcService.transactions(transactionsBtcDto);
  }
}

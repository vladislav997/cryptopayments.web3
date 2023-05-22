import {
  Body,
  Controller,
  HttpCode,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { BtcServiceV1 } from './btc.service';
import { BalanceBtcDto } from './dto/balance-btc.dto';

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
}

import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import { ErcServiceV1 } from './erc.service';
import { CreateErcDto } from './dto/create-erc.dto';
import { BalanceErcDto } from './dto/balance-erc.dto';

@Controller({
  path: 'erc',
  version: '1',
})
export class ErcControllerV1 {
  constructor(private readonly ercService: ErcServiceV1) {}

  @Post('/create')
  create(@Body(new ValidationPipe()) createErcDto: CreateErcDto) {
    return this.ercService.create(createErcDto);
  }

  @Post('/balance')
  balance(@Body(new ValidationPipe()) balanceErcDto: BalanceErcDto) {
    return this.ercService.balance(balanceErcDto);
  }
}

import { Module } from '@nestjs/common';
import { Web3ServiceV1 } from '../web3/v1/web3.service';
import { BscControllerV1 } from './v1/bsc.controller';

@Module({
  controllers: [BscControllerV1],
  providers: [Web3ServiceV1],
})
export class BscModule {}

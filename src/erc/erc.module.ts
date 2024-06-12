import { Module } from '@nestjs/common';
import { ErcControllerV1 } from './v1/erc.controller';
import { Web3ServiceV1 } from '../web3/v1/web3.service';

@Module({
  controllers: [ErcControllerV1],
  providers: [Web3ServiceV1],
})
export class ErcModule {}

import { Module } from '@nestjs/common';
import { BtcControllerV1 } from './v1/btc.controller';
import { BtcServiceV1 } from './v1/btc.service';

@Module({
  controllers: [BtcControllerV1],
  providers: [BtcServiceV1],
})
export class BtcModule {}

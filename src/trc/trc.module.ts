import { Module } from '@nestjs/common';
import { TrcControllerV1 } from './v1/trc.controller';
import { TrcServiceV1 } from './v1/trc.service';

@Module({
  controllers: [TrcControllerV1],
  providers: [TrcServiceV1],
})
export class TrcModule {}

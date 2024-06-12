import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TrcControllerV1 } from './trc/v1/trc.controller';
import { TrcServiceV1 } from './trc/v1/trc.service';
import { ErcControllerV1 } from './erc/v1/erc.controller';
import { BscControllerV1 } from './bsc/v1/bsc.controller';
import { BtcControllerV1 } from './btc/v1/btc.controller';
import { BtcServiceV1 } from './btc/v1/btc.service';
import { Web3ServiceV1 } from './web3/v1/web3.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      cache: false,
    }),
    HttpModule,
  ],
  controllers: [
    AppController,
    TrcControllerV1,
    ErcControllerV1,
    BscControllerV1,
    BtcControllerV1,
  ],
  providers: [AppService, TrcServiceV1, Web3ServiceV1, BtcServiceV1],
})
export class AppModule {}

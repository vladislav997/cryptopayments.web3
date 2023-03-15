import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TrcControllerV1 } from './trc/v1/trc.controller';
import { TrcServiceV1 } from './trc/v1/trc.service';
import { ErcControllerV1 } from './erc/v1/erc.controller';
import { Contract } from './web3/json/contract';
import { Web3Service } from './web3/web3.service';
import { BscControllerV1 } from './bsc/v1/bsc.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      cache: false,
    }),
    HttpModule,
  ],
  controllers: [AppController, TrcControllerV1, ErcControllerV1, BscControllerV1],
  providers: [AppService, TrcServiceV1, Contract, Web3Service],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TrcControllerV1 } from './web3/trc/v1/trc.controller';
import { TrcServiceV1 } from './web3/trc/v1/trc.service';
import { ErcControllerV1 } from './web3/erc/v1/erc.controller';
import { ErcServiceV1 } from './web3/erc/v1/erc.service';
import { Contract } from './web3/erc/v1/json/contract';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      cache: false,
    }),
    HttpModule,
  ],
  controllers: [AppController, TrcControllerV1, ErcControllerV1],
  providers: [AppService, TrcServiceV1, ErcServiceV1, Contract],
})
export class AppModule {}

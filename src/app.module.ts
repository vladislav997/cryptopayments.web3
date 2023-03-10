import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TrcControllerV1 } from './web3/trc/v1/trc.controller';
import { TrcServiceV1 } from './web3/trc/v1/trc.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      cache: false,
    }),
    HttpModule,
  ],
  controllers: [AppController, TrcControllerV1],
  providers: [AppService, TrcServiceV1],
})
export class AppModule {}

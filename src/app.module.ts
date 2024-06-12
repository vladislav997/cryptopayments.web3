import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TrcModule } from './trc/trc.module';
import { ErcModule } from './erc/erc.module';
import { BscModule } from './bsc/bsc.module';
import { BtcModule } from './btc/btc.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      cache: false,
    }),
    HttpModule,
    TrcModule,
    ErcModule,
    BscModule,
    BtcModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { IsNotEmpty, IsString, IsIn } from 'class-validator';

export class TransactionsBtcDto {
  @IsNotEmpty()
  @IsString()
  readonly address: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['coin'])
  readonly type: string;
}

import { IsNotEmpty, IsString, IsIn } from 'class-validator';

export class TransactionBtcDto {
  @IsNotEmpty()
  @IsString()
  readonly hash: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['coin'])
  readonly type: string;
}

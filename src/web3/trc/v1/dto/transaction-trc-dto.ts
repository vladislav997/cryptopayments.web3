import { IsNotEmpty, IsString } from 'class-validator';

export class TransactionTrcDto {
  @IsNotEmpty()
  @IsString()
  readonly txid: string;
}

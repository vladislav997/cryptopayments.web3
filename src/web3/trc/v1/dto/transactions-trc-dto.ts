import { IsNotEmpty, IsString } from 'class-validator';

export class TransactionsTrcDto {
  @IsNotEmpty()
  @IsString()
  readonly address: string;

  @IsNotEmpty()
  @IsString()
  readonly contract: string;
}

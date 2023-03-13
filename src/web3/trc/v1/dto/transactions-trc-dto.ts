import { IsIn, IsNotEmpty, IsString, ValidateIf } from 'class-validator';

export class TransactionsTrcDto {
  @IsNotEmpty()
  @IsString()
  readonly address: string;

  @ValidateIf((o) => o.type == 'coin')
  @IsNotEmpty()
  @IsString()
  @IsIn(['all', 'sent', 'received'])
  readonly payment_type: string;

  @ValidateIf((o) => o.type == 'token')
  @IsNotEmpty()
  @IsString()
  readonly contract: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['coin', 'token'])
  readonly type: string[];
}

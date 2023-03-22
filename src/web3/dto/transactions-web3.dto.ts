import { IsNotEmpty, IsString, IsIn, ValidateIf } from 'class-validator';

export class TransactionsWeb3Dto {
  @ValidateIf((o) => o.type == 'token')
  @IsNotEmpty()
  @IsString()
  readonly contract: string;

  @IsNotEmpty()
  @IsString()
  readonly address: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['coin', 'token'])
  readonly type: string[];
}

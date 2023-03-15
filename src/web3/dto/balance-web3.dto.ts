import { IsNotEmpty, IsString, IsIn, ValidateIf } from 'class-validator';

export class BalanceWeb3Dto {
  @IsNotEmpty()
  @IsString()
  readonly address: string;

  @ValidateIf((o) => o.type == 'token')
  @IsNotEmpty()
  @IsString()
  readonly contract: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['coin', 'token'])
  readonly type: string[];
}

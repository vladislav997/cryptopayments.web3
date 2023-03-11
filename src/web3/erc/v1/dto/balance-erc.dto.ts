import { IsNotEmpty, IsString, IsUrl, IsIn, ValidateIf } from 'class-validator';

export class BalanceErcDto {
  @IsNotEmpty()
  @IsUrl()
  readonly chain_link: string;

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

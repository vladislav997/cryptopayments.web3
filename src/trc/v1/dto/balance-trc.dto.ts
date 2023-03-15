import { IsIn, IsNotEmpty, IsString, ValidateIf } from 'class-validator';

export class BalanceTrcDto {
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

import { IsIn, IsNotEmpty, IsNumber, IsString, ValidateIf } from 'class-validator';

export class SendTrcDto {
  @IsNotEmpty()
  @IsString()
  readonly to_address: string;

  @ValidateIf((o) => o.type == 'token')
  @IsNotEmpty()
  @IsString()
  readonly contract: string;

  @IsNotEmpty()
  @IsString()
  readonly private_key: string;

  @IsNotEmpty()
  @IsNumber()
  readonly amount: number;

  @IsNotEmpty()
  @IsString()
  @IsIn(['coin', 'token'])
  readonly type: string[];
}

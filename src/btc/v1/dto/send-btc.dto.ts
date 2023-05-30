import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class SendBtcDto {
  @IsNotEmpty()
  @IsString()
  readonly to_address: string;

  @IsNotEmpty()
  @IsString()
  readonly private_key: string;

  @IsNotEmpty()
  @IsNumber()
  readonly amount: number;

  @IsOptional()
  @IsNumber()
  readonly fee: number;

  @IsNotEmpty()
  @IsString()
  @IsIn(['coin'])
  readonly type: string;
}

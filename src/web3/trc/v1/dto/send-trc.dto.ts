import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class SendTrcDto {
  @IsNotEmpty()
  @IsString()
  readonly to_address: string;

  @IsNotEmpty()
  @IsString()
  readonly contract: string;

  @IsNotEmpty()
  @IsString()
  readonly private_key: string;

  @IsNotEmpty()
  @IsNumber()
  readonly amount: number;
}

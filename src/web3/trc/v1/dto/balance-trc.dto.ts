import { IsNotEmpty, IsString } from 'class-validator';

export class BalanceTrcDto {
  @IsNotEmpty()
  @IsString()
  readonly address: string;

  @IsNotEmpty()
  @IsString()
  readonly contract: string;
}

import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class BalanceBtcDto {
  @IsNotEmpty()
  @IsString()
  readonly address: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['coin'])
  readonly type: string;
}

import { IsNotEmpty, IsUrl } from 'class-validator';

export class CreateErcDto {
  @IsNotEmpty()
  @IsUrl()
  readonly chain_link: string;
}

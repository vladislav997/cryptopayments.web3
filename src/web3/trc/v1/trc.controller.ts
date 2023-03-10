import { Controller, Get } from '@nestjs/common';
import { TrcServiceV1 } from './trc.service';

@Controller({
  path: 'trc',
  version: '1',
})
export class TrcControllerV1 {
  constructor(private readonly trcService: TrcServiceV1) {}

  @Get('/create')
  create() {
    return this.trcService.create();
  }
}

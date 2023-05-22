import { Test, TestingModule } from '@nestjs/testing';
import { BtcControllerV1 } from './btc.controller';

describe('BtcController', () => {
  let controller: BtcControllerV1;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BtcControllerV1],
    }).compile();

    controller = module.get<BtcControllerV1>(BtcControllerV1);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

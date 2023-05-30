import { Test, TestingModule } from '@nestjs/testing';
import { BtcServiceV1 } from './btc.service';

describe('BtcService', () => {
  let service: BtcServiceV1;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BtcServiceV1],
    }).compile();

    service = module.get<BtcServiceV1>(BtcServiceV1);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

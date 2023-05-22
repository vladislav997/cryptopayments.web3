import { Test, TestingModule } from '@nestjs/testing';
import { BtcService } from './btc.service';

describe('BtcService', () => {
  let service: BtcService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BtcService],
    }).compile();

    service = module.get<BtcService>(BtcService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

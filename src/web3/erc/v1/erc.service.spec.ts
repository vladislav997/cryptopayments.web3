import { Test, TestingModule } from '@nestjs/testing';
import { ErcService } from './erc.service';

describe('ErcService', () => {
  let service: ErcService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ErcService],
    }).compile();

    service = module.get<ErcService>(ErcService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

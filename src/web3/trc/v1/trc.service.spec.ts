import { Test, TestingModule } from '@nestjs/testing';
import { TrcService } from './trc.service';

describe('TrcService', () => {
  let service: TrcService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrcService],
    }).compile();

    service = module.get<TrcService>(TrcService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

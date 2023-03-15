import { Test, TestingModule } from '@nestjs/testing';
import { TrcServiceV1 } from './trc.service';

describe('TrcServiceV1', () => {
  let service: TrcServiceV1;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrcServiceV1],
    }).compile();

    service = module.get<TrcServiceV1>(TrcServiceV1);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

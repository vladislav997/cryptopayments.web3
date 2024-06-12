import { Test, TestingModule } from '@nestjs/testing';
import { Web3ServiceV1 } from './web3.service';

describe('Web3Service', () => {
  let service: Web3ServiceV1;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Web3ServiceV1],
    }).compile();

    service = module.get<Web3ServiceV1>(Web3ServiceV1);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

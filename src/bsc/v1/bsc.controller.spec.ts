import { Test, TestingModule } from '@nestjs/testing';
import { BscControllerV1 } from './bsc.controller';

describe('BscControllerV1', () => {
  let controller: BscControllerV1;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BscControllerV1],
    }).compile();

    controller = module.get<BscControllerV1>(BscControllerV1);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

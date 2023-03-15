import { Test, TestingModule } from '@nestjs/testing';
import { ErcControllerV1 } from './erc.controller';

describe('ErcControllerV1', () => {
  let controller: ErcControllerV1;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ErcControllerV1],
    }).compile();

    controller = module.get<ErcControllerV1>(ErcControllerV1);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

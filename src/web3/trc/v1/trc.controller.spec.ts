import { Test, TestingModule } from '@nestjs/testing';
import { TrcControllerV1 } from './trc.controller';

describe('TrcController', () => {
  let controller: TrcControllerV1;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrcControllerV1],
    }).compile();

    controller = module.get<TrcControllerV1>(TrcControllerV1);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

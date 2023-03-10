import { Test, TestingModule } from '@nestjs/testing';
import { TrcController } from './trc.controller';

describe('TrcController', () => {
  let controller: TrcController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrcController],
    }).compile();

    controller = module.get<TrcController>(TrcController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

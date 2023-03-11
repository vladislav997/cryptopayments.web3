import { Test, TestingModule } from '@nestjs/testing';
import { ErcController } from './erc.controller';

describe('ErcController', () => {
  let controller: ErcController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ErcController],
    }).compile();

    controller = module.get<ErcController>(ErcController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

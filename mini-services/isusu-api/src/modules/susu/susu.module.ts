import { Module } from '@nestjs/common';
import { SusuController } from './susu.controller';

@Module({
  controllers: [SusuController],
})
export class SusuModule {}

import { Module } from '@nestjs/common';
import { JobWorkService } from './job-work.service';
import { JobWorkController } from './job-work.controller';

@Module({
  controllers: [JobWorkController],
  providers: [JobWorkService],
  exports: [JobWorkService],
})
export class JobWorkModule {}

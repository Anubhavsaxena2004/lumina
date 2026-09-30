import { Global, Module } from '@nestjs/common';
import { DomainEventEmitter } from './events/domain-event.emitter';
import { SystemClock } from './clock/clock.interface';

@Global()
@Module({
  providers: [
    DomainEventEmitter,
    {
      provide: 'IClock',
      useClass: SystemClock,
    },
    SystemClock,
  ],
  exports: [DomainEventEmitter, 'IClock', SystemClock],
})
export class CommonModule {}


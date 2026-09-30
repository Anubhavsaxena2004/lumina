import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import { EntrySavedEvent } from './entry-saved.event';

@Injectable()
export class DomainEventEmitter {
  private readonly emitter = new EventEmitter();
  private readonly logger = new Logger(DomainEventEmitter.name);

  emitEntrySaved(event: EntrySavedEvent): void {
    this.logger.log(
      `[DomainEvent] EntrySaved: ${event.payload.type} id=${event.payload.id} staff=${event.payload.staffName}`,
    );
    // Asynchronous dispatch so event handlers do not block main execution
    setImmediate(() => {
      this.emitter.emit('entry.saved', event);
    });
  }

  onEntrySaved(listener: (event: EntrySavedEvent) => void): void {
    this.emitter.on('entry.saved', listener);
  }
}

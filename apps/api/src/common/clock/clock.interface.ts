export interface IClock {
  now(): Date;
  todayString(): string;
}

export class SystemClock implements IClock {
  now(): Date {
    return new Date();
  }

  todayString(): string {
    const d = this.now();
    return d.toISOString().split('T')[0];
  }
}

export class FakeClock implements IClock {
  private currentTime: Date;

  constructor(initialTime: Date | string = new Date()) {
    this.currentTime = new Date(initialTime);
  }

  now(): Date {
    return new Date(this.currentTime);
  }

  todayString(): string {
    return this.currentTime.toISOString().split('T')[0];
  }

  setTime(time: Date | string): void {
    this.currentTime = new Date(time);
  }

  advanceDays(days: number): void {
    this.currentTime = new Date(this.currentTime.getTime() + days * 24 * 60 * 60 * 1000);
  }

  advanceHours(hours: number): void {
    this.currentTime = new Date(this.currentTime.getTime() + hours * 60 * 60 * 1000);
  }
}

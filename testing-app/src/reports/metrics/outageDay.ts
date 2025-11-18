import { Outage } from "scheduler-node-models/metrics";

export class OutageDay {
  public outageDate: Date;
  public outages: Outage[];

  constructor(date: Date) {
    this.outageDate = new Date(date);
    this.outages = [];
  }

  compareTo(other?: OutageDay): number {
    if (other) {
      return (this.outageDate.getTime() < other.outageDate.getTime()) ? -1 : 1;
    }
    return -1;
  }

  use(date: Date): boolean {
    return (this.outageDate.getFullYear() === date.getFullYear()
      && this.outageDate.getMonth() === date.getMonth()
      && this.outageDate.getDate() === date.getDate());
  }
}
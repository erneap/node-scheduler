import { Mission } from "scheduler-node-models/metrics";

export class MissionDay {
  public missionDate: Date;
  public missions: Mission[];

  constructor(date: Date) {
    this.missionDate = new Date(date);
    this.missions = [];
  }

  compareTo(other?: MissionDay): number {
    if (other) {
      return (this.missionDate.getTime() < other.missionDate.getTime()) ? -1 : 1;
    }
    return -1;
  }

  use(date: Date): boolean {
    return (this.missionDate.getFullYear() === date.getFullYear()
      && this.missionDate.getMonth() === date.getMonth()
      && this.missionDate.getDate() === date.getDate());
  }
}
export interface IMissionSensorOutage {
  totalOutageMinutes: number;
  partialLBOutageMinutes: number;
  partialHBOutageMinutes: number;
}

export class MissionSensorOutage implements IMissionSensorOutage {
  public totalOutageMinutes: number;
  public partialHBOutageMinutes: number;
  public partialLBOutageMinutes: number;

  constructor(mso?: IMissionSensorOutage) {
    this.totalOutageMinutes = (mso) ? mso.totalOutageMinutes : 0;
    this.partialHBOutageMinutes = (mso) ? mso.partialHBOutageMinutes : 0;
    this.partialLBOutageMinutes = (mso) ? mso.partialLBOutageMinutes : 0;
  }
}
import { IImageType, ImageType } from "../images";

/**
 * This interface will defined the data members of a sensor's standard times
 */
export interface ISensorTimes {
  preflightMinutes: number;
  scheduledMinutes: number;
  postflightMinutes: number;
  executedMinutes?: number;
}

/**
 * This class defines the created object for sensor's standard times
 */
export class SensorTimes implements ISensorTimes {
  public preflightMinutes: number;
  public scheduledMinutes: number;
  public postflightMinutes: number;
  public executedMinutes?: number;

  constructor(st?: ISensorTimes) {
    this.postflightMinutes = (st) ? st.postflightMinutes : 0;
    this.preflightMinutes = (st) ? st.preflightMinutes : 0;
    this.scheduledMinutes = (st) ? st.scheduledMinutes : 0;
    this.executedMinutes = (st && st.executedMinutes) ? st?.executedMinutes : undefined;
  }
}

/**
 * This interface defines the data members for a sensor's exploitation record.
 */
export interface ISensorExploitation {
  exploitation: string;
  showOnGEOINT: boolean;
  showOnGSEG: boolean;
  showOnMIST: boolean;
  showOnXINT: boolean;
  standardTimes: ISensorTimes;
}

/**
 * This class defines the data members plus actions for a sensor's exploitation.
 */
export class SensorExploitation {
  public exploitation: string;
  public showOnGEOINT: boolean;
  public showOnGSEG: boolean;
  public showOnMIST: boolean;
  public showOnXINT: boolean;
  public standardTimes: ISensorTimes;

  constructor(se?: ISensorExploitation) {
    this.exploitation = (se) ? se.exploitation : '';
    this.showOnGEOINT = (se) ? se.showOnGEOINT : false;
    this.showOnGSEG = (se) ? se.showOnGSEG : false;
    this.showOnMIST = (se) ? se.showOnMIST : false;
    this.showOnXINT = (se) ? se.showOnXINT : false;
    this.standardTimes = (se) ? new SensorTimes(se.standardTimes) : new SensorTimes();
  }

  compareTo(other?: SensorExploitation): number {
    if (other) {
      return (this.exploitation < other.exploitation) ? -1 : 1;
    }
    return -1;
  }
}

export enum GeneralTypes {
  GEOINT = 1,
  XINT = 2,
  MIST = 3,
  SYERS = 4,
  ADMIN = 9,
  OTHER = 99,
  ALL = 9999
}

/**
 * This interface defines the data members for a platform's sensor
 */
export interface IPlatformSensor {
  id: string;
  association: string;
  generalType: GeneralTypes;
  showTailNumber: boolean;
  sortID: number;
  exploitations?: ISensorExploitation[];
  imageTypes?: IImageType[];
}

/**
 * This class defines the data members and actions associated with a platform's sensor
 */
export class PlatformSensor {
  public id: string;
  public association: string;
  public generalType: GeneralTypes;
  public showTailNumber: boolean;
  public sortID: number;
  public exploitations?: SensorExploitation[];
  public imageTypes?: ImageType[];

  constructor(ps?: IPlatformSensor) {
    this.id = (ps) ? ps.id : '';
    this.association = (ps) ? ps.association : '';
    this.generalType = (ps) ? ps.generalType : GeneralTypes.OTHER;
    this.showTailNumber = (ps) ? ps.showTailNumber : false;
    this.sortID = (ps) ? ps.sortID : 0;
    if (ps && ps.exploitations) {
      this.exploitations = [];
      ps.exploitations.forEach(ex => {
        this.exploitations?.push(new SensorExploitation(ex));
      });
      this.exploitations.sort((a,b) => a.compareTo(b));
    }
    if (ps && ps.imageTypes) {
      this.imageTypes = [];
      ps.imageTypes.forEach(it => {
        this.imageTypes?.push(new ImageType(it));
      })
    }
  }

  /**
   * This function will be used to sort this object as compared to another.
   * @param other A Platform Sensor object to compare with
   * @returns A numeric value to show whether this object is before or after the other.
   */
  compareTo(other?: PlatformSensor): number {
    if (other) {
      return (this.sortID < other.sortID) ? -1 : 1;
    }
    return -1;
  }

  /**
   * This method is used to determine if this object meets the requirement for use, based
   * on the exploitation and general type.
   * @param exploit The string value for the exploitation.
   * @param rpt The general type value for the sensor type for use.
   * @returns A boolean value to indicate whether or not it should be used.
   */
  use(exploit: string, rpt: GeneralTypes): boolean {
    let answer = false;
    if (rpt <= 0 || rpt > GeneralTypes.SYERS) {
      rpt = GeneralTypes.ALL;
    }
    if (this.exploitations) {
      this.exploitations.forEach(exp => {
        if ((exp.exploitation.toLowerCase().indexOf(exploit.toLowerCase()) >= 0)
          && (rpt === GeneralTypes.ALL || (rpt === GeneralTypes.XINT && exp.showOnXINT)
          || (rpt === GeneralTypes.GEOINT && exp.showOnGEOINT) 
          || (rpt === GeneralTypes.SYERS && exp.showOnGSEG)
          || (rpt === GeneralTypes.MIST && exp.showOnMIST))) {
          answer = true;
        }
      });
    }
    return answer;
  }
}

/**
 * This interface defines the data members of a platform object.
 */
export interface IPlatform {
  id: string;
  sensors: IPlatformSensor[];
  sortID: number;
}

/**
 * This class defines the data members plus actions for a platform object
 */
export class Platform implements IPlatform {
  public id: string;
  public sensors: PlatformSensor[];
  public sortID: number;

  constructor(pl: IPlatform) {
    this.id = (pl) ? pl.id : '';
    this.sensors = [];
    if (pl && pl.sensors.length > 0) {
      pl.sensors.forEach(sen => {
        this.sensors.push(new PlatformSensor(sen));
      });
      this.sensors.sort((a,b) => a.compareTo(b));
    }
    this.sortID = (pl) ? pl.sortID : 0;
  }

  /**
   * This function will be used in sorting this platform from other platforms
   * @param other The platform object to be used in comparison.
   * @returns A numeric value to indicate whether this object should be placed before the
   * other.
   */
  compareTo(other?: Platform): number {
    if (other) {
      return (this.sortID < other.sortID) ? -1 : 1;
    }
    return -1;
  }

  /**
   * This method is used to determine if this object meets the requirement for use, based
   * on the exploitation and general type.
   * @param exploit The string value for the exploitation.
   * @param rpt The general type value for the sensor type for use.
   * @returns A boolean value to indicate whether or not it should be used.
   */
  use(exploit: string, rpt: GeneralTypes): boolean {
    if (rpt < GeneralTypes.GEOINT || rpt > GeneralTypes.SYERS) {
      rpt = GeneralTypes.ALL;
    }
    let answer = false;
    this.sensors.forEach(sen => {
      if (sen.use(exploit, rpt)) {
        answer = true;
      }
    });
    return answer;
  }
}
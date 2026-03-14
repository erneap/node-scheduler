import { IImageType, ImageType } from "./images";
import { IMissionSensorOutage, MissionSensorOutage } from "./missionSensorOutage";
import { GeneralTypes } from "./systemdata";

/**
 * This interface defines a mission sensor data members
 */
export interface IMissionSensor {
  sensorID: string;
  sensorType: GeneralTypes;
  preflightMinutes: number;
  scheduledMinutes: number;
  executedMinutes: number;
  postflightMinutes: number;
  additionalMinutes: number;
  finalCode: number;
  kitNumber: string;
  sensorOutage: IMissionSensorOutage;
  groundOutage: number;
  hasHap: boolean;
  towerID: number;
  sortID: number;
  comments: string;
  equipment?: string[];
  images?: IImageType[];
}

/**
 * this class implements the mission sensor data members and actions.
 */
export class MissionSensor implements IMissionSensor {
  public sensorID: string;
  public sensorType: GeneralTypes;
  public preflightMinutes: number;
  public scheduledMinutes: number;
  public executedMinutes: number;
  public postflightMinutes: number;
  public additionalMinutes: number;
  public finalCode: number;
  public kitNumber: string;
  public sensorOutage: IMissionSensorOutage;
  public groundOutage: number;
  public hasHap: boolean;
  public towerID: number;
  public sortID: number;
  public comments: string;
  public equipment?: string[] | undefined;
  public images?: ImageType[];

  constructor(ms: IMissionSensor) {
    this.sensorID = (ms) ? ms.sensorID : '';
    this.sensorType = (ms) ? ms.sensorType : GeneralTypes.OTHER;
    this.preflightMinutes = (ms) ? ms.preflightMinutes : 0;
    this.scheduledMinutes = (ms) ? ms.scheduledMinutes : 0;
    this.executedMinutes = (ms) ? ms.executedMinutes : 0;
    this.postflightMinutes = (ms) ? ms.postflightMinutes : 0;
    this.additionalMinutes = (ms) ? ms.additionalMinutes : 0;
    this.finalCode = (ms) ? ms.finalCode : 0;
    this.kitNumber = (ms) ? ms.kitNumber : '';
    this.sensorOutage = (ms) ? new MissionSensorOutage(ms.sensorOutage)
      : new MissionSensorOutage();
    this.groundOutage = (ms) ? ms.groundOutage : 0;
    this.hasHap = (ms) ? ms.hasHap : false;
    this.towerID = (ms) ? ms.towerID : 0;
    this.sortID = (ms) ? ms.sortID : 0;
    this.comments = (ms) ? ms.comments : '';
    if (ms && ms.equipment) {
      this.equipment = [];
      ms.equipment.forEach(eq => {
        this.equipment?.push(eq);
      });
      this.equipment.sort();
    }
    if (ms && ms.images) {
      this.images = [];
      ms.images.forEach(img => {
        this.images?.push(new ImageType(img));
      });
      this.images.sort((a,b) => a.compareTo(b));
    }
  }

  /**
   * This function is used in sorting this mission sensor from another.
   * @param other The mission sensor object used for comparison.
   * @returns numeric value for the relative position of this to another.
   */
  compareTo(other?: MissionSensor): number {
    if (other) {
      return (this.sortID < other.sortID) ? -1 : 1;
    }
    return -1;
  }

  /**
   * This function will check to ensure the requested equipment is present in the 
   * equipment list.
   * @param sid The string value for the equipment to check for.
   * @returns boolean value for whether or not the equipment is in the list.
   */
  equipmentInUse(sid: string): boolean {
    let answer = false;
    if (this.equipment) {
      this.equipment.forEach(eq => {
        if (eq.toLowerCase() === sid.toLowerCase()) {
          answer = true;
        }
      });
    }
    return answer;
  }

  /**
   * This function will modify the equipment list, adding or removing equipment.
   * @param item The string value for the equipment to add/remove.
   * @param value A string value for a boolean value, true to add, false to remove.
   */
  modifyEquipment(item: string, value: string) {
    if (item.toLowerCase() === 'apsplus') {
      item = 'aps+';
    }
    if (value.toLowerCase() === 'true') {
      let found = false;
      if (this.equipment) {
        this.equipment.forEach(eq => {
          if (eq.toLowerCase() === item.toLowerCase()) {
            found = true;
          }
        })
      }
      if (!found) {
        if (!this.equipment) {
          this.equipment = [];
        }
        this.equipment.push(item);
      }
    } else {
      let found = -1;
      if (this.equipment) {
        this.equipment.forEach((eq, e) => {
          if (eq.toLowerCase() === item.toLowerCase()) {
            found = e;
          }
        });
        if (found >= 0) {
          this.equipment.splice(found, 1);
        }
      }
    }
  }
}
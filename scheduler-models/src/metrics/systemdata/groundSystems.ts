/**
 * This interface defines the data members associated with a ground system exploitation
 * object.
 */
export interface IGroundSystemExploitation {
  platformID: string;
  sensorType: string;
  exploitation: string;
  communicationID: string;
  enclaves?: string[];
}

/**
 * This class implements the data members of the GroundSystemExploitation interface,
 * plus functions to used the object.
 */
export class GroundSystemExploitation implements IGroundSystemExploitation {
  public platformID: string;
  public sensorType: string;
  public exploitation: string;
  public communicationID: string;
  public enclaves: string[];

  constructor(gse?: IGroundSystemExploitation) {
    this.platformID = (gse) ? gse.platformID : '';
    this.sensorType = (gse) ? gse.sensorType : '';
    this.exploitation = (gse) ? gse.exploitation : '';
    this.communicationID = (gse) ? gse.communicationID : '';
    this.enclaves = [];
    if (gse && gse.enclaves) {
      gse.enclaves.forEach(en => {
        this.enclaves.push(en);
      });
    }
  }

  /**
   * This function is used in sorting a list of Ground System Exploitation objects.
   * @param other The ground system exploitation object for comparison
   * @returns The numeric value to indicate this object's relative position compared to 
   * the other object.
   */
  compareTo(other?: GroundSystemExploitation): number {
    if (other) {
      if (this.platformID === other.platformID) {
        if (this.sensorType === other.sensorType) {
          if (this.exploitation === other.exploitation) {
            return (this.communicationID < other.communicationID) ? -1 : 1;
          }
          return (this.exploitation < other.exploitation) ? -1 : 1;
        }
        return (this.sensorType < other.sensorType) ? -1 : 1;
      }
      return (this.platformID < other.platformID) ? -1 : 1;
    }
    return -1;
  }

  /**
   * This function will indicate if this exploitation should be used based on the 
   * information provided.
   * @param platform The string value for the platform
   * @param sensor The string value for the sensor
   * @param exploit The string value for the exploitation
   * @param comm The string value for the communications
   * @param enclave The string value for the enclave
   * @returns boolean value to indicate whether all the conditions are present
   */
  use(platform: string, sensor: string, exploit: string, comm: string, 
    enclave: string): boolean {
    let answer = false;
    if (platform.toLowerCase() === this.platformID.toLowerCase()
      && sensor.toLowerCase() === this.sensorType.toLowerCase()
      && this.exploitation.toLowerCase().indexOf(exploit.toLowerCase()) >= 0
      && comm.toLowerCase() === this.communicationID.toLowerCase()) {
      if (this.enclaves.length === 0) return true;
      if (enclave === '') return true;
      this.enclaves.forEach(enc => {
        if (enc.toLowerCase() === enclave.toLowerCase()) {
          answer = true;
        }
      })
    }
    return answer;
  }
}

/**
 * This interface defines the data members of a ground system object
 */
export interface IGroundSystem {
  id: string;
  enclaves: string[];
  showOnGEOINT: boolean;
  showOnGSEG: boolean;
  showOnMIST: boolean;
  showOnXINT: boolean;
  checkForUse?: boolean;
  exploitations: IGroundSystemExploitation[];
}

/**
 * This class implements the data members for a ground system, plus all the action to 
 * use the object
 */
export class GroundSystem implements IGroundSystem {
  public id: string;
  public enclaves: string[];
  public showOnGEOINT: boolean;
  public showOnGSEG: boolean;
  public showOnMIST: boolean;
  public showOnXINT: boolean;
  public checkForUse: boolean;
  public exploitations: GroundSystemExploitation[];

  constructor(gs?: IGroundSystem) {
    this.id = (gs) ? gs.id : '';
    this.enclaves = [];
    if (gs && gs.enclaves.length > 0) {
      gs.enclaves.forEach(en => {
        this.enclaves.push(en);
      });
    }
    this.showOnGEOINT = (gs) ? gs.showOnGEOINT : false;
    this.showOnGSEG = (gs) ? gs.showOnGSEG : false;
    this.showOnMIST = (gs) ? gs.showOnMIST : false;
    this.showOnXINT = (gs) ? gs.showOnXINT : false;
    this.checkForUse = (gs && gs.checkForUse) ? gs.checkForUse : false;
    this.exploitations = [];
    if (gs && gs.exploitations.length > 0) {
      gs.exploitations.forEach(ex => {
        this.exploitations.push(new GroundSystemExploitation(ex));
      });
    }
  }

  /**
   * This function will be used when sorting a list of ground system objects.
   * @param other The ground system object used for comparison
   * @returns a numeric value for whether this object is before or after the other.
   */
  compareTo(other?: GroundSystem): number {
    if (other) {
      return (this.id < other.id) ? -1 : 1;
    }
    return -1;
  }

  /**
   * This function will indicate if this exploitation should be used based on the 
   * information provided.
   * @param platform The string value for the platform
   * @param sensor The string value for the sensor
   * @param exploit The string value for the exploitation
   * @param comm The string value for the communications
   * @param enclave The string value for the enclave
   * @returns boolean value to indicate whether all the conditions are present
   */
  useSensor(platform: string, sensor: string, exploit: string, comm: string, 
    enclave: string): boolean {
    if (this.exploitations.length === 0) return true;
    let answer = false;
    this.exploitations.forEach(exp => {
      if (exp.use(platform, sensor, exploit, comm, enclave)) {
        answer = true;
      }
    });
    return answer;
  }
}
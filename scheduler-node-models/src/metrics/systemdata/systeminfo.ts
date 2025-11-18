import { Classification, IClassification } from "./classifications";
import { Communication, ICommunication } from "./communications";
import { DCGS, IDCGS } from "./dcgs";
import { Exploitation, IExploitation } from "./exploitations";
import { GroundSystem, IGroundSystem } from "./groundSystems";
import { IPlatform, Platform } from "./platform";

/**
 * This interface will define the data members for the overall system data obtained from
 * a json document on the server.  A class inplementation will also be included to allow
 * all the data to be compiled, sorted and sent to the client.
 */
export interface ISystemInfo {
  classifications?: IClassification[];
  communications?: ICommunication[];
  dCGSs?: IDCGS[];
  exploitations?: IExploitation[];
  groundSystems?: IGroundSystem[];
  platforms?: IPlatform[];
}

export class SystemInfo implements ISystemInfo {
  public classifications?: Classification[] | undefined;
  public communications?: Communication[] | undefined;
  public dCGSs?: DCGS[] | undefined;
  public exploitations?: Exploitation[] | undefined;
  public groundSystems?: GroundSystem[] | undefined;
  public platforms?: Platform[] | undefined;

  constructor(si?: ISystemInfo) {
    if (si) {
      if (si.classifications) {
        this.classifications = [];
        si.classifications.forEach(cl => {
          this.classifications?.push(new Classification(cl));
        });
        this.classifications.sort((a,b) => a.compareTo(b));
      }
      if (si.communications) {
        this.communications = [];
        si.communications.forEach(com => {
          this.communications?.push(new Communication(com))
        });
        this.communications.sort((a,b) => a.compareTo(b));
      }
      if (si.dCGSs) {
        this.dCGSs = [];
        si.dCGSs.forEach(d => {
          this.dCGSs?.push(new DCGS(d));
        });
        this.dCGSs.sort((a,b) => a.compareTo(b));
      }
      if (si.exploitations) {
        this.exploitations = [];
        si.exploitations.forEach(exp => {
          this.exploitations?.push(new Exploitation(exp));
        });
        this.exploitations.sort((a,b) => a.compareTo(b));
      }
      if (si.groundSystems) {
        this.groundSystems = [];
        si.groundSystems.forEach(gs => {
          this.groundSystems?.push(new GroundSystem(gs));
        });
        this.groundSystems.sort((a,b) => a.compareTo(b));
      }
      if (si.platforms) {
        this.platforms = [];
        si.platforms.forEach(plat => {
          this.platforms?.push(new Platform(plat));
        });
        this.platforms.sort((a,b) => a.compareTo(b));
      }
    }
  }
}
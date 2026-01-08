import { Employee, IEmployee } from "../employees";
import { ILaborCode, LaborCode } from "../labor";
import { CofSReport, ICofSReport } from "./reports/cofsReport";
import { Forecast, IForecast } from "./reports/forecast";
import { IWorkcenter, Workcenter } from "./workcenters/workcenter";

/**
 * This interface defined the data members for a team site.
 */
export interface ISite {
  id: string;
  name: string;
  utcOffset: number;
  showMids: boolean;
  workcenters?: IWorkcenter[];
  laborCodes?: ILaborCode[];
  forecasts?: IForecast[];
  cofs?: ICofSReport[];
  employees?: IEmployee[];
}

/**
 * This class implements the Site interface data members and actions.
 */
export class Site implements ISite {
  public id: string;
  public name: string;
  public utcOffset: number;
  public showMids: boolean;
  public workcenters: Workcenter[];
  public laborCodes: LaborCode[];
  public forecasts: Forecast[];
  public cofs: CofSReport[];
  public employees?: Employee[];

  constructor(site?: ISite) {
    this.id = (site) ? site.id : '';
    this.name = (site) ? site.name : '';
    this.utcOffset = (site) ? site.utcOffset : 0;
    this.showMids = (site) ? site.showMids : false;
    this.workcenters = [];
    if (site && site.workcenters) {
      site.workcenters.forEach(wc => {
        this.workcenters.push(new Workcenter(wc));
      })
      this.workcenters.sort((a,b) => a.compareTo(b));
    }
    this.laborCodes = [];
    if (site && site.laborCodes) {
      site.laborCodes.forEach(lc => {
        this.laborCodes.push(new LaborCode(lc));
      });
      this.laborCodes.sort((a,b) => a.compareTo(b));
    }
    this.forecasts = [];
    if (site && site.forecasts) {
      site.forecasts.forEach(fcst => {
        this.forecasts.push(new Forecast(fcst));
      });
      this.forecasts.sort((a,b) => a.compareTo(b));
    }
    this.cofs = [];
    if (site && site.cofs) {
      site.cofs.forEach(cofs => {
        this.cofs.push(new CofSReport(cofs));
      });
      this.cofs.sort((a,b) => a.compareTo(b));
    }
    this.employees = [];
    if (site && site.employees) {
      site.employees.forEach(emp => {
        if (this.employees) {
          this.employees.push(new Employee(emp));
        }
      });
      this.employees.sort((a,b) => a.compareTo(b));
    }
  }

  /**
   * This function is used for sorting sites
   * @param other another site object to use in comparison
   * @returns A numeric value for the relative position of this site to another.
   */
  compareTo(other?: Site): number {
    if (other) {
      return (this.name < other.name) ? -1 : 1;
    }
    return -1;
  }
}
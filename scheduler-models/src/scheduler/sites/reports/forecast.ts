import { ILaborCode, LaborCode } from "../../labor";
import { IPeriod, Period } from "./period";

export interface IForecast {
  id: number;
  name: string;
  startDate: Date;
  endDate: Date;
  periods?: IPeriod[];
  laborCodes?: ILaborCode[];
  companyid?: string;
  sortfirst?: boolean;
}

export class Forecast implements IForecast {
  public id: number;
  public name: string;
  public startDate: Date;
  public endDate: Date;
  public periods: Period[];
  public laborCodes: LaborCode[];
  public companyid: string;
  public sortfirst: boolean;

  constructor(fore?: IForecast) {
    this.id = (fore) ? fore.id : 0;
    this.name = (fore) ? fore.name : '';
    this.startDate = (fore) ? new Date(fore.startDate) : new Date(0);
    this.endDate = (fore) ? new Date(fore.endDate) : new Date(0);
    this.periods = [];
    if (fore && fore.periods && fore.periods.length > 0) {
      fore.periods.forEach(per => {
        this.periods.push(new Period(per));
      });
      this.periods.sort((a,b) => a.compareTo(b));
    }
    this.laborCodes = [];
    if (fore && fore.laborCodes && fore.laborCodes.length > 0) {
      fore.laborCodes.forEach(lc => {
        this.laborCodes.push(new LaborCode(lc));
      });
      this.laborCodes.sort((a,b) => a.compareTo(b));
    }
    this.companyid = (fore && fore.companyid) ? fore.companyid : '';
    this.sortfirst = (fore && fore.sortfirst) ? fore.sortfirst : false;
  }

  compareTo(other?: Forecast): number {
    if (other) {
      if (this.startDate.getTime() === other.startDate.getTime()) {
        if (this.endDate.getTime() === other.endDate.getTime()) {
          return (this.name < other.name) ? -1 : 1;
        }
        return (this.endDate.getTime() < other.endDate.getTime()) ? -1 : 1;
      }
      return (this.startDate.getTime() < other.startDate.getTime()) ? -1 : 1;
    }
    return -1;
  }

  /**
   * This function is used to change the standard work period dates based on the day of
   * the week the period ends.  This function will ensure that the reports period all end
   * on the day of the week provided.
   * @param weekday The numeric value for the weekday the periods are to end at.
   */
  changePeriodsStart(weekday: number) {
    let end = new Date(Date.UTC(this.endDate.getFullYear(), this.endDate.getMonth(),
      this.endDate.getDate()));
    while (end.getDay() !== weekday) {
      end = new Date(end.getTime() + (24 * 3600000));
    }
    let start = new Date(Date.UTC(this.startDate.getFullYear(), this.startDate.getMonth(),
      this.startDate.getDate()));
    while (start.getDay() !== weekday) {
      start = new Date(start.getTime() + (24 * 3600000));
    }

    // clear the old periods' subperiods.
    this.periods.forEach(per => {
      per.periods = [];
    });

    while (start.getTime() < end.getTime()) {
      let found = false;
      this.periods.forEach((per, p) => {
        if (per.month.getFullYear() === start.getFullYear()
          && per.month.getMonth() === start.getMonth()) {
          per.periods.push(new Date(start));
          per.sortSubperiods();
          found = true;
          this.periods[p] = per;
        }
      });
      if (!found) {
        const month = new Period({
          month: new Date(Date.UTC(start.getFullYear(), start.getMonth(), 1)),
          periods: [ start ]
        });
        this.periods.push(month);
        this.periods.sort((a,b) => a.compareTo(b));
      }
      start = new Date(start.getTime() + (7 * 24 * 3600000));
    }
    this.removeUnusedPeriods();
  }

  /**
   * This function is used to remove forecast periods that have no subperiods.
   */
  removeUnusedPeriods() {
    for (let p = this.periods.length - 1; p >= 0; p--) {
      if (this.periods[p].periods.length === 0) {
        this.periods.splice(p, 1);
      }
    }
    this.periods.sort((a,b) => a.compareTo(b));
  }

  /**
   * This function will move a single sub-period from one month to another adjacent 
   * month.
   * @param from The date object representing the month period for the giving subperiod.
   * @param to The date object representing the month period for the receiving subperiod.
   */
  movePeriodBetweenMonths(from: Date, to: Date) {
    let fromPrd: Period | undefined;
    let toPrd: Period | undefined;
    let fromPos = -1;
    let toPos = -1;

    // determine the two periods the sub period will be move from and to.
    this.periods.sort((a,b) => a.compareTo(b));
    this.periods.forEach((prd, p) => {
      if (prd.month.getTime() === from.getTime()) {
        fromPrd = new Period(prd);
        fromPos = p;
      } else if (prd.month.getTime() === to.getTime()) {
        toPrd = new Period(prd);
        toPos = p;
      }
    });

    // if the to period isn't selected, create a new one for the month prior to 0
    if (toPos < 0) {
      toPrd = new Period({
        month: to,
        periods: []
      });
      this.periods.push(toPrd);
      toPos = this.periods.length - 1;
    }

    // now sort the subperiod of the from period 
    if (fromPrd && toPrd) {
      fromPrd.sortSubperiods();
      if (from.getTime() < to.getTime()) {
        // when the from period is before the to period
        // we will pop a period from the end of the list and push it onto the end of 
        // the to period then sort it
        const sprd = fromPrd.periods.pop();
        if (sprd) {
          toPrd.periods.push(new Date(sprd));
        }
      } else {
        // else pull the first sub period and push it to the to period
        const sprd = fromPrd.periods.shift();
        if (sprd) {
          toPrd.periods.push(new Date(sprd));
        }
      }
      toPrd.sortSubperiods();
      // re-set the from and to periods, then re-sort the periods and remove unused periods.
      this.periods[fromPos] = fromPrd;
      this.periods[toPos] = toPrd;
      this.periods.sort((a,b) => a.compareTo(b));

      this.removeUnusedPeriods();
    }
  }

  /**
   * This function adds a sub period to the list of periods where it fits best or add a
   * new period for the subperiod.
   * @param dt The date object for the sub period to add
   */
  addOutofCycleSubPeriod(dt: Date) {
    const periodID = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), 1));
    let found = false;
    this.periods.forEach((prd, p) => {
      if (prd.month.getTime() === periodID.getTime()) {
        prd.periods.forEach((sprd, sp) => {
          if (sprd.getTime() === dt.getTime()) {
            found = true;
          }
        });
        if (!found) {
          prd.periods.push(new Date(dt));
          prd.sortSubperiods();
          this.periods[p] = prd;
        }
        found = true;
      }
    });
    if (!found) {
      const prd = new Period({
        month: periodID
      });
      prd.periods.push(new Date(dt));
    }
  }

  /**
   * This function is used to determine if a forecast report is to be used for a report
   * date requested.
   * @param date The date object used for the testing.
   * @param company The string value for company identifier for the testing.
   * @returns A boolean value to indicate if the date is between the start and end dates
   * of this forecast report and is for the company indicated.
   */
  use(date: Date, company: string): boolean {
    return (date.getTime() >= this.startDate.getTime() 
      && date.getTime() <= this.endDate.getTime()
      && company.toLowerCase() === this.companyid.toLowerCase());
  }
}
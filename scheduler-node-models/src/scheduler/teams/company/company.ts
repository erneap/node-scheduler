import { Holiday, HolidayType, IHoliday } from "./holiday";
import { IModPeriod, ModPeriod } from "./modperiod";

/**
 * This interface defines the data members to describe the company information.  The 
 * ingest type, period, start day, and password information are necessary to ingess the
 * company's timecard information for various reports.
 */
export interface ICompany {
  id: string;
  name: string;
  ingest: string; 
  ingestPeriod?: number;
  startDay?: number;  // day of the week.
  ingestPwd: string;
  holidays?: IHoliday[];
  modperiods?: IModPeriod[];
}

/**
 * This class definition implements the company interface, plus necessary actions to 
 * manipulate the object.
 */
export class Company implements ICompany {
  public id: string;
  public name: string;
  public ingest: string;
  public ingestPeriod?: number | undefined;
  public startDay?: number | undefined;
  public ingestPwd: string;
  public holidays: Holiday[];
  public modperiods: ModPeriod[];

  constructor(co?: ICompany) {
    this.id = (co) ? co.id : '';
    this.name = (co) ? co.name : '';
    this.ingest = (co) ? co.ingest : 'mexcel';
    this.ingestPeriod = (co && co.ingestPeriod) ? co.ingestPeriod : 0;
    this.startDay = (co && co.startDay) ? co.startDay : 0;
    this.ingestPwd = (co) ? co.ingestPwd : '';
    this.holidays = [];
    if (co && co.holidays && co.holidays.length > 0) {
      co.holidays.forEach(hol => {
        this.holidays.push(new Holiday(hol));
      });
      this.holidays.sort((a,b) => a.compareTo(b));
    }
    this.modperiods = [];
    if (co && co.modperiods && co.modperiods.length > 0) {
      co.modperiods.forEach(mod => {
        this.modperiods.push(new ModPeriod(mod));
      });
      this.modperiods.sort((a,b) => a.compareTo(b));
    }
  }

  /**
   * This function is used in sorting this company with another.
   * @param other The company object used in the comparison.
   * @returns a numeric value to show relative position between the objects
   */
  compareTo(other?: Company): number {
    if (other) {
      return (this.name.toLowerCase() < other.name.toLowerCase()) ? -1 : 1;
    }
    return -1;
  }

  /**
   * This function is used to purge any old data from the company record, mainly holiday
   * actual dates.
   * @param date A date object used as the cutoff date.
   */
  purge(date: Date): void {
    this.holidays.forEach((hol, h) => {
      hol.purge(date);
      this.holidays[h] = hol;
    });
    for (let m=this.modperiods.length - 1; m >= 0; m--) {
      if (this.modperiods[m].year < date.getFullYear()) {
        this.modperiods.splice(m, 1);
      }
    }
  }

  /**
   * The function checks the company's list of mod periods to see if one of them fits 
   * within its start and end dates.
   * @param date The date object for checking mod periods.
   * @returns A boolean value to indicate if the list contains a mod period for the date.
   */
  hasModPeriod(date: Date): boolean {
    let answer = false;
    this.modperiods.forEach(mod => {
      if (date.getTime() >= mod.start.getTime() || date.getTime() <= mod.end.getTime()) {
        answer = true;
      }
    });
    return answer;
  }

  /**
   * This function will add a new mod period to the company's mod period list.
   * @param year numeric value for the full year.
   * @param start The date object to specify the first day of the company's mod period.
   * @param end The date object to specify the last day of the company's mod period.
   */
  addModPeriod(year: number, start: Date, end: Date): void {
    let found = false;
    this.modperiods.forEach((mod, m) => {
      if (mod.year === year) {
        mod.start = new Date(start);
        mod.end = new Date(end);
        this.modperiods[m] = mod;
        found = true;
      }
    });
    if (!found) {
      this.modperiods.push(new ModPeriod({
        year: year,
        start: new Date(start),
        end: new Date(end)
      }));
      this.modperiods.sort((a,b) => a.compareTo(b));
    }
  }

  /**
   * This function is used update either the start or end dates.
   * @param year A numeric value for the mod period's year value
   * @param field A string value to designate which date field to update
   * @param value A date object used in the update.
   */
  updateModPeriod(year: number, field: string, value: Date) {
    this.modperiods.forEach((mod, m) => {
      if (mod.year === year) {
        switch (field.toLowerCase()) {
          case "start":
            mod.start = new Date(value);
            break;
          case "end":
            mod.end = new Date(value);
            break;
        }
        this.modperiods[m] = mod;
      }
    })
  }

  /**
   * This function will remove a mod period from the company's list.
   * @param year a numeric value for the year to delete.
   */
  deleteModPeriod(year: number) {
    let found = -1;
    this.modperiods.forEach((mod, m) => {
      if (mod.year === year) {
        found = m;
      }
    });
    if (found >= 0) {
      this.modperiods.splice(found, 1);
    }
  }

  /**
   * This function checks whether a particular holiday based on a combined identifier of
   * holiday type and a sort value is present in the company's list.
   * @param type The holiday type value for comparison to the list
   * @param sort A numeric value for the second part of the identifier.
   * @returns A boolean value to signify if the holiday is present in the company's list.
   */
  hasHoliday(type: HolidayType, sort: number): boolean {
    let answer = false;
    this.holidays.forEach(hol => {
      if (hol.id === type && hol.sort === sort) {
        answer = true;
      }
    });
    return answer;
  }

  /**
   * This function will add a new holiday, after checking for the name given.
   * @param type The holiday type value for the new holiday
   * @param name A string value for the name of the new holiday
   * @returns A holiday object with the type and name.
   */
  addHoliday(type: HolidayType, name: string): Holiday {
    let max = 0;
    let holiday = new Holiday();
    this.holidays.forEach(hol => {
      if (hol.id === type && max < hol.sort) {
        max = hol.sort;
      }
      if (hol.name.toLowerCase() === name.toLowerCase()) {
        holiday = new Holiday(hol);
      }
    });
    if (holiday.sort === 0) {
      holiday = new Holiday({
        id: type,
        name: name,
        sort: max + 1
      });
      this.holidays.push(holiday);
    }
    return holiday
  }

  /**
   * This function is used to update a company holiday.
   * @param type The holiday type value for the holiday to update
   * @param sort The sort value for the holiday to update
   * @param field The string value to point to which field to update within the holiday.
   * @param value The string value for the new value to update to.
   */
  updateHoliday(type: HolidayType, sort: number, field: string, value: string) {
    this.holidays.sort((a,b) => a.compareTo(b));
    this.holidays.forEach((hol, h) => {
      if (hol.id === type && hol.sort === sort) {
        switch (field.toLowerCase()) {
          case "name":
            hol.name = value;
            break;
          case "move":
            if (value.toLowerCase().substring(0,2) === 'up') {
              if (h > 0) {
                const otherHol = this.holidays[h-1];
                if (otherHol.id === hol.id) {
                  const temp = otherHol.sort;
                  otherHol.sort = hol.sort;
                  hol.sort = temp;
                  this.holidays[h-1] = otherHol;
                }
              }
            } else {
              if (h < this.holidays.length - 1) {
                const otherHol = this.holidays[h+1];
                if (otherHol.id === hol.id) {
                  const temp = otherHol.sort;
                  otherHol.sort = hol.sort;
                  hol.sort = temp;
                  this.holidays[h-1] = otherHol;
                }
              }
            }
            break;
          case "addactual":
            const newActual = new Date(Date.parse(value));
            hol.addActual(newActual);
            break;
          case "deleteactual":
            const oldActual = new Date(Date.parse(value));
            hol.deleteActual(oldActual);
            break;
        }
        this.holidays[h] = hol;
      }
    });
  }

  /**
   * This function will remove the company holiday based on the type and identifier.
   * @param type The holiday type to look for
   * @param sort The numeric identifier for the holiday type.
   */
  deleteHoliday(type: HolidayType, sort: number) {
    let found = -1;
    this.holidays.forEach((hol, h) => {
      if (hol.id === type && hol.sort === sort) {
        found = h;
      }
    });
    if (found >= 0) {
      this.holidays.splice(found, 1);
    }
  }
}
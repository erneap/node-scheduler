export enum HolidayType {
  holiday = 'H',
  floating = 'F'
}

/**
 * This interface holds a listed company holiday and the data members involved.  The 
 * id is either H for regular, date determined holiday and F for floating or date-less
 * holiday.  The sort value is the sort order within the company's H and F types holidays.
 */
export interface IHoliday {
  id: HolidayType;
  name: string;
  sort: number;
  actualdates?: Date[];
}

/**
 * This class definition implements the holiday interface and add needed actions to 
 * manipulate the holiday object.
 */
export class Holiday implements IHoliday {
  public id: HolidayType;
  public name: string;
  public sort: number;
  public actualdates: Date[];

  constructor(hol?: IHoliday) {
    this.id = (hol) ? hol.id : HolidayType.holiday;
    this.name = (hol) ? hol.name : '';
    this.sort = (hol) ? hol.sort : 0;
    this.actualdates = [];
    if (hol && hol.actualdates && hol.actualdates.length > 0) {
      hol.actualdates.forEach(dt => {
        this.actualdates.push(new Date(dt));
      });
      this.actualdates.sort((a,b) => (a.getTime() < b.getTime()) ? -1 : 1);
    }
  }

  /**
   * This function will provide string for the combined id and sort code into a single
   * string value.
   * @returns A string value for the id and sort code.
   */
  toString(): string {
    return `${this.id}${this.sort}`.toUpperCase();
  }

  /**
   * This function is used in sorting holidays by comparing their ids and sort values
   * @param other The holiday object used in comparison
   * @returns A numeric value for relative location compared to other (-1 before, 1 after).
   */
  compareTo(other?: Holiday) {
    if (other) {
      if (this.id.toLowerCase() === other.id.toLowerCase()) {
        return (this.sort < other.sort) ? -1 : 1;
      }
      return (this.id.toLowerCase() === 'h') ? -1 : 1;
    }
    return -1;
  }

  /**
   * This function will retrieve any set date for the actual holiday, based on the year
   * provided.
   * @param year The numeric (integer) value for the 4-digit year 
   * @returns A date object or undefined for the set day of the year.
   */
  getActual(year: number): Date | undefined {
    let answer: Date | undefined = undefined;
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year+1, 0, 1));
    this.actualdates.forEach(dt => {
      if (dt.getTime() >= start.getTime() && dt.getTime() < end.getTime()) {
        answer = new Date(dt);
      }
    });
    return answer;
  }

  /**
   * The function will add a new date to the actuals list, if not already present.
   * @param date The date object to add.
   */
  addActual(date: Date) {
    let found = false;
    this.actualdates.forEach(ad => {
      if (ad.getUTCFullYear() === date.getUTCFullYear() 
        && ad.getUTCMonth() === date.getUTCMonth()
        && ad.getUTCDate() === date.getUTCDate()) {
        found = true;
      }
    });
    this.actualdates.push(new Date(date));
  }

  /**
   * The function will remove a date from the actuals list.
   * @param date The date object to remove.
   */
  deleteActual(date: Date) {
    let found = -1;
    this.actualdates.forEach((ad, a) => {
      if (ad.getUTCFullYear() === date.getUTCFullYear() 
        && ad.getUTCMonth() === date.getUTCMonth()
        && ad.getUTCDate() === date.getUTCDate()) {
        found = a;
      }
    });
    if (found >= 0) {
      this.actualdates.splice(found, 1);
    }
  }

  /**
   * This function will check the holiday's actual dates for dates before a cutoff date
   * and remove them from the object.
   * @param date The date object used as a cutoff for the purged dates.
   */
  purge(date: Date): void {
    for (let i=this.actualdates.length - 1; i >= 0; i--) {
      if (this.actualdates[i].getTime() < date.getTime()) {
        // checking to see if the actual date is before the cutoff date given.
        // if so, remove it from the list.
        this.actualdates.splice(i, 1);
      }
    }
  }
}
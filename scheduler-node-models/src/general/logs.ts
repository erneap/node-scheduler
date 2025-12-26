/**
 * This interface will provide the requirements of a log entry
 */
export interface ILogEntry {
  date: Date;
  entry: string;
}

/**
 * This class definition implements the log entry interface as an object 
 * which can be sorted in order.
 */
export class LogEntry implements ILogEntry {
  public date: Date;
  public entry: string;

  constructor(entry?: ILogEntry) {
    this.date = (entry) ? new Date(entry.date) : new Date();
    this.entry = (entry) ? entry.entry : '';
  }

  /**
   * This method will be used in sorting and comparisons in general
   * @param other (optional) a log entry object used in comparision
   * @returns a numeric value to indicate whether this log entry is before
   * or after based on log entry date.
   */
  compareTo(other?: LogEntry): number {
    if (other) {
      return (this.date.getTime() < other.date.getTime()) ? -1 : 1;
    }
    return -1;
  }

  /**
   * This method will provide a string value from this entry.
   * @returns a string value having the date/time - entry value.
   */
  toString(): string {
    const formatter = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'short',
      timeStyle: 'short'
    });

    return `${formatter.format(this.date)} - ${this.entry}`;
  }
}

/**
 * This interface will define the requirements for a log with name and entry
 */
export interface ILog {
  name: string;
  entries: ILogEntry[];
}

/**
 * This class implements the log containing a name and a series of entries.  The 
 * entries are sorted in reverse order with newest first.
 */
export class Log implements ILog {
  public name: string;
  public entries: LogEntry[];

  constructor(log?: ILog) {
    this.name = (log) ? log.name : '';
    this.entries = [];
    if (log && log.entries.length > 0) {
      log.entries.forEach(entry => {
        this.entries.push(new LogEntry(entry));
      });
      this.entries.sort((a,b) => b.compareTo(a));
    }
  }

  /**
   * This method is used to compare this object with another one.
   * @param other (optional) the log object to use in comparision
   * @returns a numeric value to indicate whether this log is before or after
   * by name.
   */
  compareTo(other?: Log): number {
    if (other) {
      return (this.name.toLowerCase() < other.name.toLowerCase()) ? -1 : 1;
    }
    return -1;
  }
}

export interface ILogList {
  logs: ILog[];
}

export class LogList implements ILogList {
  public logs: Log[];

  constructor(ls?: ILogList) {
    this.logs = [];
    if (ls && ls.logs.length > 0) {
      ls.logs.forEach(lg => {
        this.logs.push(new Log(lg));
      });
      this.logs.sort((a,b) => a.compareTo(b));
    }
  }
}
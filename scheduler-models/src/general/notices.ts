/**
 * This interface defines the notice data fields so they can be passed to the
 * database and user interfaces.
 */
export interface INotice {
  id?: string;
  date?: Date;
  to: string;
  from: string;
  message: string;
}

/**
 * This class defines a notice object which provides the user with recorded notice
 * messages.
 */
export class Notice implements INotice {
  public id: string;
  public date: Date;
  public to: string;
  public from: string;
  public message: string;

  constructor(note?: INotice) {
    this.id = (note && note.id) ? note.id : '';
    this.date = (note && note.date) ? new Date(note.date) : new Date();
    this.to = (note) ? note.to : '';
    this.from = (note) ? note.from : '';
    this.message = (note) ? note.message : '';
  }

  /**
   * This method will be used to compare one Notice from another, especially 
   * during sorting
   * @param other (optional) a notice object used for comparison
   * @returns a numeric value to indicate whether this object is before (-1) or
   * after the other (1).
   */
  compareTo(other?: Notice): number {
    if (other) {
      return (this.date.getTime() < other.date.getTime()) ? -1 : 1;
    }
    return -1;
  }
}

export interface NewNotice {
  receiver: string;
  sender: string;
  message: string;
}

export interface DeleteNotices {
  notes: string[];
}
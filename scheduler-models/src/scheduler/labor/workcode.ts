export interface IWorkcode {
  id: string;
  title: string;
  start: number;
  shiftCode: string;
  altcode?: string;
  search?: string;
  isLeave: boolean;
  textcolor: string;
  backcolor: string;
}

export class Workcode implements IWorkcode {
  public id: string;
  public title: string;
  public start: number;
  public shiftCode: string;
  public altcode?: string;
  public search?: string;
  public isLeave: boolean;
  public textcolor: string;
  public backcolor: string;

  constructor(wc?: IWorkcode) {
    this.id = (wc) ? wc.id : '';
    this.title = (wc) ? wc.title : '';
    this.start = (wc) ? wc.start : 7;
    this.shiftCode = (wc) ? wc.shiftCode : '';
    this.altcode = (wc && wc.altcode) ? wc.altcode : undefined;
    this.search = (wc && wc.search) ? wc.search : undefined;
    this.isLeave = (wc) ? wc.isLeave : false;
    this.textcolor = (wc) ? wc.textcolor : '000000';
    this.backcolor = (wc) ? wc.backcolor : 'ffffff';
  }

  compareTo(other?: Workcode): number {
    if (other) {
      if (this.isLeave === other.isLeave) {
        return (this.id < other.id) ? -1 : 1;
      }
      return (this.isLeave && !other.isLeave) ? -1 : 1;
    }
    return -1;
  }
}

export interface CompareWorkCode {
  code: string;
  isLeave: boolean;
}
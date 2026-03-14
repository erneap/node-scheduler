/**
 * This interface defines the data members for an image type
 */
export interface IImageType {
  id: string;
  collected?: number;
  notcollected?: number;
  sortID: number;
  subtypes?: IImageType[];
}

/**
 * this class implements the data members for an image type, plus actions for use
 */
export class ImageType implements IImageType {
  public id: string;
  public collected?: number;
  public notcollected?: number;
  public sortID: number;
  public subtypes?: ImageType[];

  constructor(it?: IImageType) {
    this.id = (it) ? it.id : '';
    this.collected = (it && it.collected) ? it.collected : undefined;
    this.notcollected = (it && it.notcollected) ? it.notcollected : undefined;
    this.sortID = (it && it.sortID) ? it.sortID : 0;
    if (it && it.subtypes) {
      this.subtypes = [];
      it.subtypes.forEach(st => {
        this.subtypes?.push(new ImageType(st));
      });
      this.subtypes.sort((a,b) => a.compareTo(b));
    }
  }

  compareTo(other?: ImageType): number {
    if (other) {
      return (this.sortID < other.sortID) ? -1 : 1;
    }
    return -1;
  }
}
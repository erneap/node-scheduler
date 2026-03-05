/**
 * Class and interface for the user permission 
 */
export interface IPermission {
  application: string;
  job: string;
}

export class Permission implements IPermission {
  public application: string;
  public job: string;

  constructor(perm?: IPermission) {
    this.application = (perm) ? perm.application : '';
    this.job = (perm) ? perm.job : '';
  }

  compareTo(other?: Permission): number {
    if (other) {
      if (this.application === other.application) {
        return (this.job < other.job) ? -1 : 1;
      }
      return (this.application < other.application) ? -1 : 1;
    }
    return 0;
  }
}
import { IUser, User } from "../users";

export interface IMenuItem {
  id: number;
  name: string;
  link: string;
  showMenu: boolean;
  application: string;
  groups: string[];
}

export class MenuItem implements IMenuItem {
  public id: number;
  public name: string;
  public link: string;
  public showMenu: boolean;
  public application: string;
  public groups: string[];

  constructor(item?: IMenuItem) {
    this.id = (item) ? item.id : 0;
    this.name = (item) ? item.name : '';
    this.link = (item) ? item.link : '';
    this.showMenu = (item) ? item.showMenu : false;
    this.application = (item) ? item.application : 'scheduler';
    this.groups = [];
    if (item && item.groups && item.groups.length > 0) {
      item.groups.forEach(gp => {
        this.groups.push(gp);
      })
    }
  }

  compareTo(other?: MenuItem): number {
    if (other) {
      return (this.id < other.id) ? -1 : 1;
    }
    return -1;
  }

  use(iuser: IUser): boolean {
    const user = new User(iuser);
    let answer = false;
    this.groups.forEach(grp => {
      if (user.hasPermission(this.application, grp)) {
        answer = true;
      }
    });
    return answer;
  }
}

export interface IMenuGroup {
  id: number;
  name: string;
  items?: IMenuItem[];
}

export class MenuGroup implements IMenuGroup {
  public id: number;
  public name: string;
  public items: MenuItem[];

  constructor(group?: IMenuGroup) {
    this.id = (group) ? group.id : 0;
    this.name = (group) ? group.name : '';
    this.items = [];
    if (group && group.items && group.items.length > 0) {
      group.items?.forEach(item => {
        this.items.push(new MenuItem(item));
      });
      this.items.sort((a,b) => a.compareTo(b));
    }
  }

  compareTo(other?: MenuGroup): number {
    if (other) {
      return (this.id < other.id) ? -1 : 1;
    }
    return -1;
  }

  useGroup(iuser: IUser): boolean {
    let answer = false;
    this.items.forEach(item => {
      if (item.use(iuser)) {
        answer = true;
      }
    });
    return answer;
  }
}
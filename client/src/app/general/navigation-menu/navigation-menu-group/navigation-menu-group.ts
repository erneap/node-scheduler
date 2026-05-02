import { Component, Input, output, signal } from '@angular/core';
import { MenuGroup } from 'scheduler-models/general';
import { User } from 'scheduler-models/users';
import { AuthService } from '../../../services/auth-service';
import { NavigationMenuGroupItem } from './navigation-menu-group-item/navigation-menu-group-item';

@Component({
  selector: 'app-navigation-menu-group',
  imports: [
    NavigationMenuGroupItem
  ],
  templateUrl: './navigation-menu-group.html',
  styleUrl: './navigation-menu-group.scss',
})
export class NavigationMenuGroup {
  toggle = output<boolean>();
  user = signal<User>(new User());
  private _group: MenuGroup = new MenuGroup();
  @Input()
  get group(): MenuGroup {
    return this._group;
  }
  set group(grp: MenuGroup) {
    this._group = new MenuGroup(grp);
    const iuser = this.authService.getUser();
    if (iuser) {
      this.user.set(new User(iuser));
    }
  }

  constructor(
    private authService:AuthService
  ) {}

  onToggle(toggle: boolean) {
    this.toggle.emit(toggle);
  }
}

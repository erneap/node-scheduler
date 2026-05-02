import { Component, Input, output, signal } from '@angular/core';
import { MenuItem } from 'scheduler-models/general';
import { User } from 'scheduler-models/users';
import { AuthService } from '../../../../services/auth-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navigation-menu-group-item',
  imports: [],
  templateUrl: './navigation-menu-group-item.html',
  styleUrl: './navigation-menu-group-item.scss',
})
export class NavigationMenuGroupItem {
  user = signal<User>(new User());
  toggle = output<boolean>();
  private _item: MenuItem = new MenuItem();
  @Input()
  get item(): MenuItem {
    return this._item;
  }
  set item(item: MenuItem) {
    this._item = new MenuItem(item);
    const iuser = this.authService.getUser();
    if (iuser) {
      this.user.set(new User(iuser));
    }
  }

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  goLink() {
    this.toggle.emit(this.item.showMenu);
    this.router.navigate([this.item.link]);
  }
}

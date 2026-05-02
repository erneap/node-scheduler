import { Component, computed, output, signal } from '@angular/core';
import { AuthService } from '../../services/auth-service';
import { NavigationMenuGroup } from './navigation-menu-group/navigation-menu-group';

@Component({
  selector: 'app-navigation-menu',
  imports: [
    NavigationMenuGroup
  ],
  templateUrl: './navigation-menu.html',
  styleUrl: './navigation-menu.scss',
})
export class NavigationMenu {
  toggle = output<boolean>();
  constructor(
    public authService: AuthService
  ) {  }

  onToggle(toggle: boolean) {
    this.toggle.emit(toggle);
  }
}

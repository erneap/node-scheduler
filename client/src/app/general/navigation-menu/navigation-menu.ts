import { Component } from '@angular/core';
import { AuthService } from '../../services/auth-service';
import { Router } from '@angular/router';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-navigation-menu',
  imports: [
    MatExpansionModule,
    MatListModule
  ],
  templateUrl: './navigation-menu.html',
  styleUrl: './navigation-menu.scss',
})
export class NavigationMenu {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  isInGroup(role: string): boolean {
    const user = this.authService.getUser();
    let answer = false;
    if (user) {
      answer = user.hasPermission('scheduler', role);
    }
    return answer;
  }

  goToLink(url: string) {
    this.router.navigateByUrl(url);
  }
}

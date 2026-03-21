import { Component, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon, MatIconRegistry } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { version } from '../../package.json';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from './services/auth-service';
import { environment } from '../environments/environment';
import { EmployeeService } from './services/employee-service';
import { SiteService } from './services/site-service';
import { TeamService } from './services/team-service';
import { NoticeService } from './services/notice-service';
import { NavigationMenu } from './authentication/navigation-menu/navigation-menu';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    MatToolbarModule,
    MatButtonModule,
    MatIcon,
    MatSidenavModule,
    NavigationMenu
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('Osan Scheduler');
  protected readonly appVersion = signal('0.0.0');

  constructor(
    private iconRegistry: MatIconRegistry,
    private sanitizer: DomSanitizer,
    public authService: AuthService,
    public empService: EmployeeService,
    public siteService: SiteService,
    public teamService: TeamService,
    public msgService: NoticeService,
    private router: Router
  ) {
    this.appVersion.set(environment.version);
    this.title.set(environment.title);
    iconRegistry.addSvgIcon('calendar',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/images/icons/calendar.svg'));
    if (this.authService.isAuthenticated) {
      this.msgService.startNotices();
    }
  }

  logout() {
    this.authService.logout();
    this.empService.removeEmployee();
    this.siteService.removeSite();
    this.teamService.removeTeam();
    this.msgService.stopNotices();
    this.router.navigate(['/login'])
  }
}

import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../services/auth-service';
import { EmployeeService } from '../../services/employee-service';
import { SiteService } from '../../services/site-service';
import { TeamService } from '../../services/team-service';
import { NoticeService } from '../../services/notice-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-not-authorized',
  imports: [
    MatCardModule,
    MatButtonModule,],
  templateUrl: './not-authorized.html',
  styleUrl: './not-authorized.scss',
})
export class NotAuthorized {
  constructor(
    private authService: AuthService,
    private empService: EmployeeService,
    private siteService: SiteService,
    private teamService: TeamService,
    private noticeService: NoticeService,
    private router: Router
  ) {}

  acknowledge() {
    this.noticeService.stopNotices();
    this.teamService.removeTeam();
    this.siteService.removeSite();
    this.empService.removeEmployee();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

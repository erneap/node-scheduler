import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon, MatIconRegistry } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { version } from '../../package.json';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from './services/auth-service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    MatToolbarModule,
    MatButtonModule,
    MatIcon,
    MatSidenavModule
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
    public authService: AuthService
  ) {
    this.appVersion.set(environment.version);
    this.title.set(environment.title);
    iconRegistry.addSvgIcon('calendar',
      sanitizer.bypassSecurityTrustResourceUrl(
        'assets/images/icons/calendar.svg'));
  }
}


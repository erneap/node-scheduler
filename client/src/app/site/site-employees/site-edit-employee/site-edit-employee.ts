import { Component, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterOutlet, Router } from '@angular/router';

@Component({
  selector: 'app-site-edit-employee',
  imports: [
    RouterOutlet,
    MatToolbarModule,
    MatButtonModule
],
  templateUrl: './site-edit-employee.html',
  styleUrl: './site-edit-employee.scss',
})
export class SiteEditEmployee {
  url = signal<string>('');

  constructor(
    private router: Router
  ) {
    const url = window.location.pathname;
    if (url.toLowerCase().startsWith('/site/editor')) {
      this.url.set('/site/editor/employees/edit');
    } else if (url.toLowerCase().startsWith('/team/sites/edit/employees')) {
      this.url.set('/team/sites/edit/employees/edit');
    } else {
      this.url.set('/site/employees/edit');
    }
  }

  choose(section: string) {
    let url = '';
    switch (section.toLowerCase()) {
      case "pto":
      case "leaves":
      case "balances":
      case "leaverequests":
      case "personal":
      case "security":
      case "company":
      case "contacts":
      case "specialties":
      case "assignment":
      case "variation":
      case "permissions":
        url = `${this.url()}/${section.toLowerCase()}`;
    }
    if (url !== '') {
      this.router.navigate([url]);
    }
  }
}

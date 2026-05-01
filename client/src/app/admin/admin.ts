import { Component } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin',
  imports: [
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatToolbarModule,
    RouterOutlet,
    MatButtonModule
  ],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class Admin {

  constructor(
    private router: Router
  ) {}

  style(): string {
    const height = window.innerHeight - 70;
    return `height: ${height}px;`;
  }

  choose(id: string) {
    let link = '';
    switch (id.toLowerCase()) {
      case "teams":
        link = '/admin/teams';
        break;
      case "accounts":
        link = '/admin/accounts';
        break;
      case "purge":
        link = '/admin/purge';
        break;
    }
    if (link !== '') {
      this.router.navigate([link]);
    }
  }
}

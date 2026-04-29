import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-complete',
  imports: [
    MatButtonModule
  ],
  templateUrl: './forgot-complete.html',
  styleUrl: './forgot-complete.scss',
})
export class ForgotComplete {
  constructor(
    private router: Router
  ) {

  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}

import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { SiteCoverageMonth } from './site-coverage-month/site-coverage-month';

@Component({
  selector: 'app-site-coverage',
  imports: [
    MatCardModule,
    SiteCoverageMonth
  ],
  templateUrl: './site-coverage.html',
  styleUrl: './site-coverage.scss',
})
export class SiteCoverage {}

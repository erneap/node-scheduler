import { Component } from '@angular/core';
import { SiteModTimeView } from './site-mod-time-view/site-mod-time-view';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-site-mod-time',
  imports: [
    MatCardModule,
    SiteModTimeView
  ],
  templateUrl: './site-mod-time.html',
  styleUrl: './site-mod-time.scss',
})
export class SiteModTime {}

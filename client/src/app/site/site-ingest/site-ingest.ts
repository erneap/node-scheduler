import { Component } from '@angular/core';
import { SiteIngestChart } from './site-ingest-chart/site-ingest-chart';

@Component({
  selector: 'app-site-ingest',
  imports: [
    SiteIngestChart
  ],
  templateUrl: './site-ingest.html',
  styleUrl: './site-ingest.scss',
})
export class SiteIngest {}

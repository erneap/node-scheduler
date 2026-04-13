import { Component, computed } from '@angular/core';
import { TeamService } from '../../../services/team-service';
import { SiteEditorForecastEditor } from './site-editor-forecast-editor/site-editor-forecast-editor';

@Component({
  selector: 'app-site-editor-forecasts',
  imports: [
    SiteEditorForecastEditor
  ],
  templateUrl: './site-editor-forecasts.html',
  styleUrl: './site-editor-forecasts.scss',
})
export class SiteEditorForecasts {
  site = computed(() => this.teamService.selectedSite());
  constructor(
    private teamService: TeamService
  ) {  }
}

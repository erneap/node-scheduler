import { Component, computed, signal } from '@angular/core';
import { List } from '../../../../general/list/list';
import { form, FormField, required } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Employee } from 'scheduler-models/scheduler/employees';
import { Item } from '../../../../general/list/list.model';
import { AuthService } from '../../../../services/auth-service';
import { SiteService } from '../../../../services/site-service';
import { TeamService } from '../../../../services/team-service';
import { MatDialog } from '@angular/material/dialog';
import { Team } from 'scheduler-models/scheduler/teams';
import { ISite, Site } from 'scheduler-models/scheduler/sites';
import { HttpErrorResponse } from '@angular/common/http';
import { ConfirmationDialog } from '../../../../general/confirmation-dialog/confirmation-dialog';
import { SiteEditorWorkcenterPositionEditor } from './site-editor-workcenter-position-editor/site-editor-workcenter-position-editor';

@Component({
  selector: 'app-site-editor-workcenter-position',
  imports: [
    SiteEditorWorkcenterPositionEditor
  ],
  templateUrl: './site-editor-workcenter-position.html',
  styleUrl: './site-editor-workcenter-position.scss',
})
export class SiteEditorWorkcenterPosition {
  workcenter = computed(() => this.siteService.selectedWorkcenter());

  constructor(
    private siteService: SiteService,
  ) { }
}

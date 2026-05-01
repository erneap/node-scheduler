import { Component, computed, signal } from '@angular/core';
import { AdminService } from '../../../services/admin-service';
import { AdminTeamsEditDisplay } from './admin-teams-edit-display/admin-teams-edit-display';

@Component({
  selector: 'app-admin-teams-edit',
  imports: [
    AdminTeamsEditDisplay
  ],
  templateUrl: './admin-teams-edit.html',
  styleUrl: './admin-teams-edit.scss',
})
export class AdminTeamsEdit {
  team = computed(() => this.adminService.selectedTeam())

  constructor(
    private adminService: AdminService
  ) {}
}

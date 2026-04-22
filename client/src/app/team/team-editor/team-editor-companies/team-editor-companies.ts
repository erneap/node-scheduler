import { Component, signal } from '@angular/core';
import { Item } from '../../../general/list/list.model';
import { AuthService } from '../../../services/auth-service';
import { TeamService } from '../../../services/team-service';
import { MatDialog } from '@angular/material/dialog';
import { Team } from 'scheduler-models/scheduler/teams';
import { form, FormField, required } from '@angular/forms/signals';
import { List } from '../../../general/list/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { TeamEditorCompaniesHolidays } from './team-editor-companies-holidays/team-editor-companies-holidays';
import { TeamEditorCompaniesModtime } from './team-editor-companies-modtime/team-editor-companies-modtime';
import { ConfirmationDialog } from '../../../general/confirmation-dialog/confirmation-dialog';

interface CompanyData {
  id: string;
  name: string;
  ingest: string;
  period: string;
  start: string;
  holidays: boolean;
  modtime: boolean;
}

@Component({
  selector: 'app-team-editor-companies',
  imports: [
    List,
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    TeamEditorCompaniesHolidays,
    TeamEditorCompaniesModtime,
  ],
  templateUrl: './team-editor-companies.html',
  styleUrl: './team-editor-companies.scss',
})
export class TeamEditorCompanies {
  team = signal<string>('');
  list = signal<Item[]>([]);
  selectedItem = signal<string>('new');
  ingestTypes: Item[] = [{id: 'mexcel', value: 'Manual Excel Files'}, 
    {id: 'sap', value: 'ADP/SAP Excel Files'}];
  ingestPeriods: Item[] = [
    { id: '7', value: 'Weekly'},
    { id: '14', value: 'Bi-weekly'},
    { id: '30', value: 'Monthly'},
    { id: '60', value: 'Bi-monthly'},
  ];
  weekdays: string[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday',
    'Saturday' ];
  companyModel = signal<CompanyData>({
    id: '',
    name: '',
    ingest: 'mexcel',
    period: '7',
    start: '5',
    holidays: false,
    modtime: false
  });
  companyForm = form(this.companyModel, (s) => {
    required(s.id);
    required(s.name);
  });

  constructor(
    private authService: AuthService,
    private teamService: TeamService,
    private dialog: MatDialog
  ) {
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      this.team.set(team.id);
      this.setCompanyList();
    }
  }

  setCompanyList() {
    const list: Item[] = [];
    list.push({id: 'new', value: 'Add New Company'});
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      team.companies.forEach(co => {
        list.push({id: co.id, value: co.name})
      });
    }
    this.list.set(list);
  }

  selectItem(id: string) {
    this.selectedItem.set(id);
    if (id.toLowerCase() === 'new') {
      this.companyForm.id().value.set('');
      this.companyForm.name().value.set('');
      this.companyForm.ingest().value.set('mexcel');
      this.companyForm.period().value.set('7');
      this.companyForm.start().value.set('5');
      this.companyForm.holidays().value.set(false);
      this.companyForm.modtime().value.set(false);
    } else {
      const iTeam = this.teamService.getTeam();
      if (iTeam) {
        const team = new Team(iTeam);
        team.companies.forEach(co => {
          if (co.id.toLowerCase() === id.toLowerCase()) {
            this.companyForm.id().value.set(co.id);
            this.companyForm.name().value.set(co.name);
            this.companyForm.ingest().value.set(co.ingest);
            this.companyForm.period().value.set(`${co.ingestPeriod}`);
            this.companyForm.start().value.set(`${co.startDay}`);
            this.companyForm.holidays().value.set(co.holidays && co.holidays.length > 0);
            this.companyForm.modtime().value.set(co.modperiods && co.modperiods.length > 0);
          }
        });
      }
    }
  }

  onUpdate(field: string) {

  }

  onAdd() {

  }

  onDelete() {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: {
        title: 'Team Company Delete Confirmation',
        message: 'Are you sure you want to delete this company?',
        negativeButtonTitle: 'No',
        affirmativeButtonTitle: 'Yes'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.toLowerCase() === 'yes') {
      }
    });
  }
}

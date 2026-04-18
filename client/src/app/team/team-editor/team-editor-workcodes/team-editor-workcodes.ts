import { Component, signal } from '@angular/core';
import { Item } from '../../../general/list/list.model';
import { Workcode } from 'scheduler-models/scheduler/labor';
import { AuthService } from '../../../services/auth-service';
import { TeamService } from '../../../services/team-service';
import { MatDialog } from '@angular/material/dialog';
import { ITeam, Team } from 'scheduler-models/scheduler/teams';
import { List } from '../../../general/list/list';
import { MatFormFieldModule } from "@angular/material/form-field";
import { form, FormField, required } from "@angular/forms/signals";
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { HttpErrorResponse } from '@angular/common/http';
import { Work } from 'scheduler-models/scheduler/employees';
import { ConfirmationDialog } from '../../../general/confirmation-dialog/confirmation-dialog';

interface WorkcodeData {
  id: string;
  title: string;
  start: number;
  premimumcode: string;
  altcode: string;
  search: string;
  isleave: boolean;
  backcolor: string;
  textcolor: string;
}

@Component({
  selector: 'app-team-editor-workcodes',
  imports: [
    List,
    MatFormFieldModule,
    FormField,
    MatCheckboxModule,
    MatInputModule,
    MatButtonModule
],
  templateUrl: './team-editor-workcodes.html',
  styleUrl: './team-editor-workcodes.scss',
})
export class TeamEditorWorkcodes {
  team = signal<string>('');
  list = signal<Item[]>([]);
  workcodes = signal<Workcode[]>([]);
  selectedWorkcode = signal<string>('new');
  inputColorStyle = signal<string>('background-color: #ffffff;color: #000000;width: 250px;');
  workcodeModel = signal<WorkcodeData>({
    id: '',
    title: '',
    start: 0,
    premimumcode: '1',
    search: '',
    altcode: '',
    isleave: false,
    backcolor: 'ffffff',
    textcolor: '000000'
  });
  workcodeForm = form(this.workcodeModel, (s) => {
    required(s.id);
    required(s.title);
    required(s.textcolor);
    required(s.backcolor);
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
      this.setWorkcodes();
    }
  }

  setWorkcodes() {
    const list: Item[] = [];
    const codes: Workcode[] = [];
    list.push({
      id: 'new',
      value: 'New Work/Leave Code'
    });
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      team.workcodes.sort((a,b) => {
        return (a.title < b.title) ? -1 : 1;
      });
      team.workcodes.forEach(wc => {
        const wcode = new Workcode(wc);
        list.push({
          id: wcode.id,
          value: wcode.title
        });
        codes.push(wcode);
      });
    }
    this.list.set(list);
    this.workcodes.set(codes);
  }

  onSelectWorkcode(id: string) {
    this.selectedWorkcode.set(id);
    this.setWorkcode();
  }

  setWorkcode() {
    if (this.selectedWorkcode().toLowerCase() === 'new') {
      this.workcodeForm.id().value.set('');
      this.workcodeForm.title().value.set('');
      this.workcodeForm.isleave().value.set(false);
      this.workcodeForm.start().value.set(0);
      this.workcodeForm.premimumcode().value.set('');
      this.workcodeForm.search().value.set('');
      this.workcodeForm.textcolor().value.set('000000');
      this.workcodeForm.backcolor().value.set('ffffff');
      const style = `background-color: #ffffff;color: #000000;`
        + `width: 100%;`;
      this.inputColorStyle.set(style);
    } else {
      this.workcodes().forEach(wc => {
        if (wc.id.toLowerCase() === this.selectedWorkcode().toLowerCase()) {
          this.workcodeForm.id().value.set(wc.id);
          this.workcodeForm.title().value.set(wc.title);
          this.workcodeForm.isleave().value.set(wc.isLeave);
          this.workcodeForm.start().value.set(wc.start);
          this.workcodeForm.premimumcode().value.set(wc.shiftCode);
          this.workcodeForm.search().value.set((wc.search) ? wc.search : '');
          this.workcodeForm.textcolor().value.set(wc.textcolor);
          this.workcodeForm.backcolor().value.set(wc.backcolor);
          const style = `background-color: #${wc.backcolor};color: #${wc.textcolor};`
            + `width: 100%;`;
          this.inputColorStyle.set(style);
        }
      });
    }
  }

  onChange(field: string) {
    if (field.toLowerCase() === 'textcolor' || field.toLowerCase() === 'backcolor') {
      const style = `background-color: #${this.workcodeForm.backcolor().value()};`
        + `color: #${this.workcodeForm.textcolor().value()};width: 100%;`;
      this.inputColorStyle.set(style);
    }
    if (this.selectedWorkcode().toLowerCase() !== 'new') {
      let value = '';
      switch (field.toLowerCase()) {
        case "id":
          value = this.workcodeForm.id().value();
          break;
        case "title":
          value = this.workcodeForm.title().value();
          break;
        case "isleave":
          value = (this.workcodeForm.isleave().value()) ? 'true' : 'false';
          break;
        case "start":
          value = `${this.workcodeForm.start().value()}`;
          break;
        case "shiftcode":
          value = this.workcodeForm.premimumcode().value();
          break;
        case "altcode":
          value = this.workcodeForm.altcode().value();
          break;
        case "search":
          value = this.workcodeForm.search().value();
          break;
        case "textcolor":
          value = this.workcodeForm.textcolor().value();
          break;
        case "backcolor":
          value = this.workcodeForm.backcolor().value();
          break;
      }
      this.teamService.updateWorkcode(this.team(), this.selectedWorkcode(), field, value).subscribe({
        next: (res) => {
          const iTeam = (res.body as ITeam);
          if (iTeam) {
            const team = new Team(iTeam);
            const list: Item[] = [];
            const codes: Workcode[] = [];
            list.push({
              id: 'new',
              value: 'New Work/Leave Code'
            });
            team.workcodes.forEach(wc => {
              codes.push(new Workcode(wc));
              list.push({
                id: wc.id,
                value: wc.title
              });
            });
            this.list.set(list);
            this.workcodes.set(codes);
            this.setWorkcode();
          }
        },
        error: (err) => {
          if (err instanceof HttpErrorResponse) {
            if (err.status >= 400 && err.status < 500) {
              this.authService.statusMessage.set(`${err.status} - ${err.error.message}`)
            }
          }
        }
      })
    }
  }

  onClear() {
    this.workcodeForm().reset();
  }

  onAdd() {
    if (this.workcodeForm().valid()) {
      this.teamService.addWorkcode(this.team(), this.workcodeForm.id().value(), 
        this.workcodeForm.title().value(), this.workcodeForm.start().value(),
        this.workcodeForm.premimumcode().value(), this.workcodeForm.altcode().value(),
        this.workcodeForm.search().value(), this.workcodeForm.isleave().value(), 
        this.workcodeForm.textcolor().value(), this.workcodeForm.backcolor().value())
        .subscribe({
        next: (res) => {
          const iTeam = (res.body as ITeam);
          if (iTeam) {
            const team = new Team(iTeam);
            this.selectedWorkcode.set(this.workcodeForm.id().value());
            const list: Item[] = [];
            const codes: Workcode[] = [];
            list.push({
              id: 'new',
              value: 'New Work/Leave Code'
            });
            team.workcodes.forEach(wc => {
              codes.push(new Workcode(wc));
              list.push({
                id: wc.id,
                value: wc.title
              });
            });
            this.list.set(list);
            this.workcodes.set(codes);
            this.setWorkcode();
          }
        },
        error: (err) => {
          if (err instanceof HttpErrorResponse) {
            if (err.status >= 400 && err.status < 500) {
              this.authService.statusMessage.set(`${err.status} - ${err.error.message}`)
            }
          }
        }
      });
    }
  }

  onDelete() {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: {
        title: 'Team Work/Leave Code Delete Confirmation',
        message: 'Are you sure you want to delete this work/leave code?',
        negativeButtonTitle: 'No',
        affirmativeButtonTitle: 'Yes'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.toLowerCase() === 'yes') {
        this.teamService.deleteWorkcode(this.team(), this.selectedWorkcode())
          .subscribe({
          next: (res) => {
            const iTeam = (res.body as ITeam);
            if (iTeam) {
              const team = new Team(iTeam);
              this.selectedWorkcode.set('new');
              const list: Item[] = [];
              const codes: Workcode[] = [];
              list.push({
                id: 'new',
                value: 'New Work/Leave Code'
              });
              team.workcodes.forEach(wc => {
                codes.push(new Workcode(wc));
                list.push({
                  id: wc.id,
                  value: wc.title
                });
              });
              this.list.set(list);
              this.workcodes.set(codes);
              this.setWorkcode();
            }
          },
          error: (err) => {
            if (err instanceof HttpErrorResponse) {
              if (err.status >= 400 && err.status < 500) {
                this.authService.statusMessage.set(`${err.status} - ${err.error.message}`)
              }
            }
          }
        });
      }
    });
  }
}

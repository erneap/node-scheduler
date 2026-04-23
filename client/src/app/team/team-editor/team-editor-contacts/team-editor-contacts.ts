import { Component, signal } from '@angular/core';
import { Item } from '../../../general/list/list.model';
import { AuthService } from '../../../services/auth-service';
import { TeamService } from '../../../services/team-service';
import { MatDialog } from '@angular/material/dialog';
import { Team } from 'scheduler-models/scheduler/teams';
import { form, FormField, required } from '@angular/forms/signals';
import { ConfirmationDialog } from '../../../general/confirmation-dialog/confirmation-dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { List } from '../../../general/list/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface ContactData {
  name: string;
}

@Component({
  selector: 'app-team-editor-contacts',
  imports: [
    List,
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './team-editor-contacts.html',
  styleUrl: './team-editor-contacts.scss',
})
export class TeamEditorContacts {
  team = signal<string>('');
  list = signal<Item[]>([]);
  selectedItem = signal<string>('new');
  contactModel = signal<ContactData>({
    name: ''
  });
  contactForm = form(this.contactModel, (s) => {
    required(s.name);
  });
  contactPos = signal<number>(-1);
  contactsLength = signal<number>(0);

  constructor(
    private authService: AuthService,
    private teamService: TeamService,
    private dialog: MatDialog
  ) {
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      this.team.set(team.id);
      this.setContactInfoList();
    }
  }

  setContactInfoList() {
    const list: Item[] = [];
    list.push({id: 'new', value: 'Add New Contact Info Type'});
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      team.contacttypes.forEach(ct => {
        list.push({id: `${ct.id}`, value: ct.name});
      });
      this.contactsLength.set(team.contacttypes.length);
    }
    this.list.set(list);
  }

  selectItem(id: string) {
    this.selectedItem.set(id);
    this.contactPos.set(-1);
    if (id.toLowerCase() === 'new') {
      this.contactForm.name().value.set('');
    } else {
      const tid = Number(id);
      const iTeam = this.teamService.getTeam();
      if (iTeam) {
        const team = new Team(iTeam);
        team.contacttypes.forEach((ct, c) => {
          if (ct.id === tid) {
            console.log(c);
            this.contactPos.set(c);
            this.contactForm.name().value.set(ct.name);
          }
        })
      }
    }
  }

  /**
   * This method is for updating the contact information type, either name or its 
   * order in the list.  This is performed by using the teamUpdate service method with 
   * the "changecontact" as the action/field or if change is sort order use "movecontact".
   * The results of the response from the service will require a reset of the contact
   * information type list.
   * @param field The string value for the field to pull data from or direction of travel.
   */
  onUpdate(field: string) {
    if (this.selectedItem().toLowerCase() !== 'new') {
      let useField = '';
      let value = '';
      switch (field.toLowerCase()) {
        case "name":
          useField = 'changecontact';
          value = this.contactForm.name().value();
          break;
        case "up":
        case "down":
          useField = 'movecontact';
          value = field;
          break;
      }
      console.log(`${useField}-${value}`);
      this.teamService.updateTeam(this.team(), useField, value, this.selectedItem())
        .subscribe({
        next: (res) => {
          // the team is already handled, so we need to update the list and then select
          // the new company for display.
          this.setContactInfoList();
          const id = this.selectedItem();
          this.selectItem(id);
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

  onAdd() {
    if (this.selectedItem().toLowerCase() === 'new' && this.contactForm().valid()) {
      const useField = 'addcontact';
      const value = this.contactForm.name().value();
      this.teamService.updateTeam(this.team(), useField, value, this.selectedItem())
        .subscribe({
        next: (res) => {
          // the team is already handled, so we need to update the list and then select
          // the new company for display.
          this.setContactInfoList();
          const iTeam = this.teamService.getTeam();
          if (iTeam) {
            const team = new Team(iTeam);
            const ct = team.contacttypes[team.contacttypes.length - 1];
            this.selectItem(`${ct.id}`);
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
        title: 'Contact Information Type Confirmation',
        message: 'Are you sure you want to delete this Contact Info Type?',
        negativeButtonTitle: 'No',
        affirmativeButtonTitle: 'Yes'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.toLowerCase() === 'yes') {
        const useField = 'removecontact';
        const value = '';
        this.teamService.updateTeam(this.team(), useField, value, this.selectedItem())
          .subscribe({
          next: (res) => {
            // the team is already handled, so we need to update the list and then select
            // the new company for display.
            this.setContactInfoList();
            this.selectItem('new');
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

import { Component, Input, output, signal } from '@angular/core';
import { email, form, FormField, required, validate } from '@angular/forms/signals';
import { Item } from '../../../../../general/list/list.model';
import { List } from '../../../../../general/list/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { NewSitePersonnel } from 'scheduler-models/scheduler/sites/web';

interface PersonelData {
  id: number;
  email: string;
  first: string;
  middle: string;
  last: string;
  password1: string;
  password2: string;
  position: string;
}
interface ErrorMessage {
  field: string;
  message: string;
}

@Component({
  selector: 'app-team-editor-site-new-personnel',
  imports: [
    List,
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './team-editor-site-new-personnel.html',
  styleUrl: './team-editor-site-new-personnel.scss',
})
export class TeamEditorSiteNewPersonnel {
  private _personnelList: NewSitePersonnel[] = [];
  @Input()
  get personnel(): NewSitePersonnel[] {
    return this._personnelList;
  }
  set personnel(people: NewSitePersonnel[]) {
    this._personnelList = [];
    people.forEach(person => {
      this._personnelList.push({
        id: person.id,
        email: person.email,
        first: person.first,
        middle: (person.middle) ? person.middle : '',
        last: person.last,
        position: person.position,
        password: person.password,
      });
    });
    this.setList();
  }
  personModel = signal<PersonelData>({
    id: -1,
    email: '',
    first: '',
    middle: '',
    last: '',
    password1: '',
    password2: '',
    position: ''
  });
  personForm = form(this.personModel, (schema) => {
    required(schema.email, {message: 'required'});
    email(schema.email, {message: 'must be in email format'});
    required(schema.first, {message: 'required'});
    required(schema.last, {message: 'required'});
    required(schema.password1, {message: 'required'});
    required(schema.password2, {message: 'required'});
    required(schema.position, {message: 'required'});
    validate(schema.password1, ({value}) => {
      let upper = 0;
      let lower = 0;
      let numeric = 0;
      const reUpper = new RegExp('[A-Z]');
      const reLower = new RegExp('[a-z]');
      const reNumeric = new RegExp('[0-9]');
      for (let i=0; i < value().length; i++) {
        const ch = value().substring(i,i+1);
        if (reUpper.test(ch)) {
          upper++;
        }
        if (reLower.test(ch)) {
          lower++;
        }
        if (reNumeric.test(ch)) {
          numeric++;
        }
      }
      if (upper < 2 || lower < 2 || numeric < 2 || value().length < 10) {
        let message = '';
        if (value().length < 10) {
          message = 'minimum length 10 characters'
        }
        if (upper < 2) {
          if (message !== '') {
            message += ', ';
          }
          message += 'requires 2 uppercase'
        }
        if (lower < 2) {
          if (message !== '') {
            message += ', ';
          }
          message += 'requires 2 lowercase'
        }
        if (numeric < 2) {
          if (message !== '') {
            message += ', ';
          }
          message += 'requires 2 numeric'
        }
        return {
          kind: 'minimums',
          message: message,
        };
      }
      return null;
    });
    validate(schema.password2, ({value, valueOf}) => {
      const confirm = value();
      const passwd = valueOf(schema.password1);
      if (confirm !== passwd) {
        return {
          kind: 'passwordMismatch',
          message: 'passwords do not match',
        }
      }
      return null;
    });
  });
  list = signal<Item[]>([]);
  addPerson = output<string>();
  selectedPerson = signal<string>('new');
  errors = signal<ErrorMessage[]>([]);

  setList() {
    const list: Item[] = [];
    list.push({id: 'new', value: 'Add New Site Person'});
    this._personnelList.forEach(person => {
      list.push({id: `${person.id}`, value: `${person.first} ${person.last}`});
    });
    this.list.set(list);
  }

  updatePerson() {
    if (this.personForm().valid()) {
      let max = -1;
      let found = false;
      this._personnelList.forEach((person, p) => {
        if (person.id > max) {
          max = person.id;
        }
        if (!found 
          && person.last.toLowerCase() === this.personForm.last().value().toLowerCase()
          && person.first.toLowerCase() === this.personForm.first().value().toLowerCase()) {
          found = true;
          const output = `mod|${this.personForm.id().value()}`
            + `|${this.personForm.email().value()}`
            + `|${this.personForm.first().value()}|${this.personForm.middle().value()}`
            + `|${this.personForm.last().value()}|${this.personForm.position().value()}`
            + `|${this.personForm.password1().value()}`;
          this.addPerson.emit(output);
          person.email = this.personForm.email().value();
          person.first = this.personForm.first().value();
          person.middle = this.personForm.middle().value();
          person.last = this.personForm.last().value();
          person.position = this.personForm.position().value();
          person.password = this.personForm.password1().value();
          this._personnelList[p] = person;
        }
      });
      if (!found) {
        max++;
        const output = `add|${max}|${this.personForm.email().value()}`
          + `|${this.personForm.first().value()}|${this.personForm.middle().value()}`
          + `|${this.personForm.last().value()}|${this.personForm.position().value()}`
          + `|${this.personForm.password1().value()}`;
        this.addPerson.emit(output);
        const person: NewSitePersonnel = {
          id: max,
          email: this.personForm.email().value(),
          first: this.personForm.first().value(),
          middle: this.personForm.middle().value(),
          last: this.personForm.last().value(),
          position: this.personForm.position().value(),
          password: this.personForm.password1().value(),
        }
        this._personnelList.push(person);
        this.selectedPerson.set(`${max}`);
      }
      this.setList();
    }
  }

  selectPerson(id: string) {
    this.selectedPerson.set(id);
    if (id.toLowerCase() === 'new') {
      this.personForm.id().value.set(-1);
      this.personForm.email().value.set('');
      this.personForm.first().value.set('');
      this.personForm.middle().value.set('');
      this.personForm.last().value.set('');
      this.personForm.position().value.set('');
      this.personForm.password1().value.set('');
      this.personForm.password2().value.set('');
    } else {
      const nid = Number(id);
      this._personnelList.forEach(person => {
        if (person.id === nid) {
          this.personForm.id().value.set(nid);
          this.personForm.email().value.set(person.email);
          this.personForm.first().value.set(person.first);
          this.personForm.middle().value.set((person.middle) ? person.middle : '');
          this.personForm.last().value.set(person.last);
          this.personForm.position().value.set(person.position);
          this.personForm.password1().value.set(person.password);
          this.personForm.password2().value.set(person.password);
        }
      });
    }
  }
  
  checkErrors() {
    const list: ErrorMessage[] = [];
    if (this.personForm().invalid()) {
      this.personForm.email().errors().forEach(err => {
        list.push({
          field: 'Email',
          message: (err.message) ? err.message : 'problem',
        });
      });
      this.personForm.first().errors().forEach(err => {
        list.push({
          field: 'First Name',
          message: (err.message) ? err.message : 'problem',
        });
      });
      this.personForm.last().errors().forEach(err => {
        list.push({
          field: 'Last Name',
          message: (err.message) ? err.message : 'problem',
        });
      });
      this.personForm.position().errors().forEach(err => {
        list.push({
          field: 'Permission Job',
          message: (err.message) ? err.message : 'problem',
        });
      });
      this.personForm.password1().errors().forEach(err => {
        list.push({
          field: 'Password',
          message: (err.message) ? err.message : 'problem',
        });
      });
      this.personForm.password2().errors().forEach(err => {
        list.push({
          field: 'Confirm Password',
          message: (err.message) ? err.message : 'problem',
        });
      });
    }
    this.errors.set(list);
  }
}

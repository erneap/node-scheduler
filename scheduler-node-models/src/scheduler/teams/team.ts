import { ObjectId } from "mongodb";
import { IWorkcode, Workcode } from "../labor";
import { ISite, Site } from "../sites";
import { Company, ICompany } from "./company";
import { Contact, IContact } from "./contact";
import { ISpecialty, Specialty } from "./specialty";

export interface ITeam {
  _id?: ObjectId;
  id?: string;
  name: string;
  workcodes: IWorkcode[];
  sites: ISite[];
  companies?: ICompany[];
  contacttypes?: IContact[];
  specialties?: ISpecialty[];
}

export class Team implements ITeam {
  public id: string;
  public name: string;
  public workcodes: Workcode[];
  public sites: Site[];
  public companies: Company[];
  public contacttypes: Contact[];
  public specialties: Specialty[];

  constructor(team?: ITeam) {
    this.id = (team && team.id) ? team.id : '';
    if (this.id === '') {
      this.id = (team && team._id) ? team._id.toString() : '';
    }
    this.name = (team) ? team.name : '';
    this.workcodes = [];
    if (team && team.workcodes.length > 0) {
      team.workcodes.forEach(wc => {
        this.workcodes.push(new Workcode(wc));
      });
      this.workcodes.sort((a,b) => a.compareTo(b));
    }
    this.sites = [];
    if (team && team.sites.length > 0) {
      team.sites.forEach(site => {
        this.sites.push(new Site(site));
      });
      this.sites.sort((a,b) => a.compareTo(b));
    }
    this.companies = [];
    if (team && team.companies && team.companies.length > 0) {
      team.companies.forEach(co => {
        this.companies.push(new Company(co));
      });
      this.companies.sort((a,b) => a.compareTo(b));
    }
    this.contacttypes = [];
    if (team && team.contacttypes && team.contacttypes.length > 0) {
      team.contacttypes.forEach(ct => {
        this.contacttypes.push(new Contact(ct));
      });
      this.contacttypes.sort((a,b) => a.compareTo(b));
    }
    this.specialties = [];
    if (team && team.specialties && team.specialties.length > 0) {
      team.specialties.forEach(sp => {
        this.specialties.push(new Specialty(sp));
      });
      this.specialties.sort((a,b) => a.compareTo(b));
    }
  }

  /**
   * Workcode section (CRUD)
   */

  /**
   * This function will add a new work code to the team's work/leave code list.
   * @param id The string value for the use code and identifier for the work or leave 
   * code.
   * @param title The string value for the short explanation of the code.
   * @param start The numeric value for the hour the work shift normally starts work.
   * @param shift The string value for any paycode designator
   * @param isLeave A boolean value to signify if the code is for leaves
   * @param text A string 6-character hexadecimal value for the color of text for this 
   * code.
   * @param back A string 6-character hexadecimal value for the color of the background 
   * for this code.
   * @param search (optional) A string value to search time records to recognize the code.
   */
  addWorkcode(id: string, title: string, start: number, shift: string, isLeave: boolean, 
    text: string, back: string, search?: string) {
    if (id !== '') {
      let found = false;
      this.workcodes.forEach((wc, w) => {
        if (wc.id.toLowerCase() === id.toLowerCase()) {
          found = true;
          const code = new Workcode({
            id: id,
            title: title,
            start: start,
            shiftCode: shift,
            isLeave: isLeave,
            textcolor: text,
            backcolor: back,
            search: search
          });
          this.workcodes[w] = code;
        }
      });
      if (!found) {
        const code = new Workcode({
          id: id,
          title: title,
          start: start,
          shiftCode: shift,
          isLeave: isLeave,
          textcolor: text,
          backcolor: back,
          search: search
        });
        this.workcodes.push(code);
      }
      this.workcodes.sort((a,b) => a.compareTo(b));
    }
  }

  /**
   * This function is used to update a single work/leave code, based on the identifier,
   * a field designator and value for that field.
   * @param id The string value for the identifier of the code to change
   * @param field The string value to identify the field/data member to update
   * @param value The string value for the new value.
   */
  updateWorkcode(id: string, field: string, value: string) {
    this.workcodes.forEach((wc, w) => {
      if (wc.id.toLowerCase() === id.toLowerCase()) {
        switch (field.toLowerCase()) {
          case "id":
            wc.id = value;
            break;
          case "title":
            wc.title = value;
            break;
          case "start":
          case "starthour":
            wc.start = Number(value);
            break;
          case "shift":
          case "shiftcode":
            wc.shiftCode = value;
            break;
          case "isleave":
          case "leave":
            wc.isLeave = (value.toLowerCase() === 'true');
            break;
          case "textcolor":
          case "text":
            wc.textcolor = value.substring(0,6);
            break;
          case "backcolor":
          case "back":
          case "background":
            wc.backcolor = value.substring(0,6);
            break;
          case "search":
            if (value === '') {
              wc.search = undefined;
            } else {
              wc.search = value;
            }
        }
        this.workcodes[w] = wc;
      }
    });
    this.workcodes.sort((a,b) => a.compareTo(b));
  }

  /**
   * This function will delete 
   * @param id The string value for the identifier of the work/leave code to delete
   */
  deleteWorkcode(id: string) {
    let found = -1;
    this.workcodes.forEach((wc, w) => {
      if (wc.id.toLowerCase() === id.toLowerCase()) {
        found = w;
      }
    });
    if (found >= 0) {
      this.workcodes.splice(found, 1);
      this.workcodes.sort((a,b) => a.compareTo(b));
    }
  }

  /**
   * Contact Types section
   */
  /**
   * This function will add a new contact type, after checking to ensure the contact type
   * name isn't already listed
   * @param name The string value for the new contact type.
   */
  addContactType(name: string) {
    let next = 0;
    let sort = -1;
    let found = false;
    this.contacttypes.forEach(ct => {
      if (ct.name.toLowerCase() === name.toLowerCase()) {
        found = true;
      }
      if (ct.id > next) {
        next = ct.id;
      }
      if (ct.sort > sort) {
        sort = ct.sort;
      }
    });
    if (!found) {
      this.contacttypes.push(new Contact({
        id: next + 1,
        name: name,
        sort: sort + 1
      }));
      this.contacttypes.sort((a,b) => a.compareTo(b));
    }
  }

  /**
   * This function will be used to update a contact type within the list
   * @param id The numeric identifer for the contact type.
   * @param field The string value to identify the data member to update
   * @param value The string value for the modification.
   */
  updateContactType(id: number, field: string, value: string) {
    this.contacttypes.sort((a,b) => a.compareTo(b));
    this.contacttypes.forEach((ct, c) => {
      if (ct.id === id) {
        switch (field.toLowerCase()) {
          case "name":
          case "title":
            ct.name = value;
            break;
          case "move":
          case "sort":
            if (value.toLowerCase().substring(0,2) === 'up') {
              if (c > 0) {
                const other = this.contacttypes[c-1];
                const old = other.sort;
                other.sort = ct.sort;
                ct.sort = old;
                this.contacttypes[c-1] = other;
              }
            } else {
              if (c < this.contacttypes.length - 1) {
                const other = this.contacttypes[c+1];
                const old = other.sort;
                other.sort = ct.sort;
                ct.sort = old;
                this.contacttypes[c+1] = other;
              }
            }
            break;
        }
        this.contacttypes[c] = ct;
      }
    });
  }

  /**
   * This function will remove a designated contact type by identifier from the list.
   * @param id The numeric identifier to the designated contact type.
   */
  deleteContactType(id: number) {
    let found = -1;
    this.contacttypes.forEach((ct, c) => {
      if (ct.id === id) {
        found = c;
      }
    });
    if (found >= 0) {
      this.contacttypes.splice(found, 1);
    }
  }

  /**
   * This function will add a new specialty type, if the name isn't already in the list.
   * @param name The string value for the new specialty name.
   */
  addSpecialtyType(name: string) {
    let next = 0;
    let sort = -1;
    let found = false;
    this.specialties.forEach(sp => {
      if (sp.name.toLowerCase() === name.toLowerCase()) {
        found = true;
      }
      if (sp.id > next) {
        next = sp.id;
      }
      if (sp.sort > sort) {
        sort = sp.sort;
      }
    });
    if (!found) {
      this.specialties.push(new Specialty({
        id: next + 1,
        name: name,
        sort: sort + 1
      }));
      this.specialties.sort((a,b) => a.compareTo(b));
    }
  }

  /**
   * This function will update a specialty type within the list
   * @param id The numeric value for the identifier for the contact type to update
   * @param field The string value for the field/data member to update
   * @param value The string value for the new value.
   */
  updateSpecialtyType(id: number, field: string, value: string) {
    this.specialties.sort((a,b) => a.compareTo(b));
    this.specialties.forEach((ct, c) => {
      if (ct.id === id) {
        switch (field.toLowerCase()) {
          case "name":
          case "title":
            ct.name = value;
            break;
          case "move":
          case "sort":
            if (value.toLowerCase().substring(0,2) === 'up') {
              if (c > 0) {
                const other = this.specialties[c-1];
                const old = other.sort;
                other.sort = ct.sort;
                ct.sort = old;
                this.specialties[c-1] = other;
              }
            } else {
              if (c < this.specialties.length - 1) {
                const other = this.specialties[c+1];
                const old = other.sort;
                other.sort = ct.sort;
                ct.sort = old;
                this.specialties[c+1] = other;
              }
            }
            break;
        }
        this.specialties[c] = ct;
      }
    });
  }

  /**
   * This function will remove a specialty type from the list.
   * @param id The numeric value for the identifier to remove.
   */
  deleteSpecialtyType(id: number) {
    let found = -1;
    this.specialties.forEach((ct, c) => {
      if (ct.id === id) {
        found = c;
      }
    });
    if (found >= 0) {
      this.specialties.splice(found, 1);
    }
  }
}
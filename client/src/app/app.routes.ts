import { Routes } from '@angular/router';
import { Login } from './authentication/login/login';
import { MustChange } from './authentication/must-change/must-change';
import { EmployeeSchedule } from './employee/employee-schedule/employee-schedule';
import { NotAuthorized } from './authentication/not-authorized/not-authorized';
import { EmployeeLeaves } from './employee/employee-leaves/employee-leaves';
import { EmployeeProfile } from './employee/employee-profile/employee-profile';
import { EmployeeCompany } from './employee/employee-company/employee-company';
import { EmployeeSecurity } from './employee/employee-security/employee-security';
import { EmployeeLeaveRequests } from './employee/employee-leave-requests/employee-leave-requests';
import { EmployeeContactInformation } from './employee/employee-contact-information/employee-contact-information';
import { EmployeeSpecialties } from './employee/employee-specialties/employee-specialties';
import { SiteSchedule } from './site//site-schedules/site-schedule/site-schedule';
import { SiteCoverage } from './site/site-schedules/site-coverage/site-coverage';
import { SiteMidsListing } from './site/site-schedules/site-mids-listing/site-mids-listing';
import { TeamQuery } from './team/team-query/team-query';
import { SiteEmployees } from './site/site-employees/site-employees';
import { SiteEditEmployeePTO } from './site/site-employees/site-edit-employee/site-edit-employee-pto/site-edit-employee-pto';
import { SiteNewEmployee } from './site/site-employees/site-new-employee/site-new-employee';
import { SiteEditEmployee } from './site/site-employees/site-edit-employee/site-edit-employee';
import { SiteEditEmployeeLeaveRequests } from './site/site-employees/site-edit-employee/site-edit-employee-leave-requests/site-edit-employee-leave-requests';
import { SiteEditEmployeeProfile } from './site/site-employees/site-edit-employee/site-edit-employee-profile/site-edit-employee-profile';
import { SiteEditEmployeeSecurity } from './site/site-employees/site-edit-employee/site-edit-employee-security/site-edit-employee-security';
import { SiteEditEmployeeCompany } from './site/site-employees/site-edit-employee/site-edit-employee-company/site-edit-employee-company';
import { SiteEditEmployeeContacts } from './site/site-employees/site-edit-employee/site-edit-employee-contacts/site-edit-employee-contacts';
import { SiteEditEmployeeSpecialties } from './site/site-employees/site-edit-employee/site-edit-employee-specialties/site-edit-employee-specialties';
import { SiteEditEmployeeLeaves } from './site/site-employees/site-edit-employee/site-edit-employee-leaves/site-edit-employee-leaves';
import { SiteEditEmployeeLeaveBalances } from './site/site-employees/site-edit-employee/site-edit-employee-leave-balances/site-edit-employee-leave-balances';
import { SiteEditEmployeeAssignment } from './site/site-employees/site-edit-employee/site-edit-employee-assignment/site-edit-employee-assignment';
import { SiteEditEmployeeVariation } from './site/site-employees/site-edit-employee/site-edit-employee-variation/site-edit-employee-variation';
import { SiteLeaveApproval } from './site/site-leave-approval/site-leave-approval';
import { SiteModTime } from './site/site-mod-time/site-mod-time';
import { PathNotFound } from './general/path-not-found/path-not-found';
import { SiteEditor } from './site/site-editor/site-editor';
import { SiteEditorWorkcenters } from './site/site-editor/site-editor-workcenters/site-editor-workcenters';
import { SiteEditorForecasts } from './site/site-editor/site-editor-forecasts/site-editor-forecasts';
import { SiteEditorCofs } from './site/site-editor/site-editor-cofs/site-editor-cofs';
import { SiteEditorWorkcenterPosition } from './site/site-editor/site-editor-workcenters/site-editor-workcenter-position/site-editor-workcenter-position';
import { SiteEditorWorkcenterShift } from './site/site-editor/site-editor-workcenters/site-editor-workcenter-shift/site-editor-workcenter-shift';
import { SiteIngest } from './site/site-ingest/site-ingest';
import { TeamEditor } from './team/team-editor/team-editor';
import { TeamEditorWorkcodes } from './team/team-editor/team-editor-workcodes/team-editor-workcodes';
import { TeamEditorCompanies } from './team/team-editor/team-editor-companies/team-editor-companies';
import { TeamEditorContacts } from './team/team-editor/team-editor-contacts/team-editor-contacts';
import { TeamEditorSpecialties } from './team/team-editor/team-editor-specialties/team-editor-specialties';
import { TeamEditorSites } from './team/team-editor/team-editor-sites/team-editor-sites';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'mustchange', component: MustChange },
  { path: 'unauthorized', component: NotAuthorized },
  { path: 'employee',
    children: [
      { path: '', redirectTo: 'employee/schedule', pathMatch: 'full'},
      { path: 'schedule', component: EmployeeSchedule},
      { path: 'leaveschart', component: EmployeeLeaves },
      { path: 'profile', component: EmployeeProfile },
      { path: 'company', component: EmployeeCompany },
      { path: 'security', component: EmployeeSecurity },
      { path: 'leaverequest', component: EmployeeLeaveRequests },
      { path: 'contacts', component: EmployeeContactInformation },
      { path: 'specialties', component: EmployeeSpecialties },
      { path: '**', component: EmployeeSchedule},
    ]
  },
  { path: 'site', 
    children: [
      { path: '', redirectTo: 'site/schedule/schedule', pathMatch: 'full'},
      { path: 'schedule',
        children: [
          { path: '', redirectTo: 'site/schedule/schedule', pathMatch: 'full' },
          { path: 'schedule', component: SiteSchedule },
          { path: 'coverage', component: SiteCoverage },
          { path: 'mids', component: SiteMidsListing },
          { path: '**', component: SiteSchedule },
        ]
      },
      { path: 'employees', component: SiteEmployees,
        children: [
          {path: 'new', component: SiteNewEmployee },
          { path: 'edit', component: SiteEditEmployee,
            children: [
              { path: '', redirectTo: '/site/employees/edit/pto', pathMatch: 'full' },
              { path: 'pto', component: SiteEditEmployeePTO },
              { path: 'leaves', component: SiteEditEmployeeLeaves },
              { path: 'balances', component: SiteEditEmployeeLeaveBalances },
              { path: 'leaverequests', component: SiteEditEmployeeLeaveRequests },
              { path: 'personal', component: SiteEditEmployeeProfile },
              { path: 'security', component: SiteEditEmployeeSecurity },
              { path: 'company', component: SiteEditEmployeeCompany },
              { path: 'contacts', component: SiteEditEmployeeContacts },
              { path: 'specialties', component: SiteEditEmployeeSpecialties },
              { path: 'assignment', component: SiteEditEmployeeAssignment },
              { path: 'variation', component: SiteEditEmployeeVariation },
              { path: '**', component: SiteEditEmployeePTO }
            ]
          }
        ]
      },
      { path: 'editor', component: SiteEditor,
        children: [
          { path: '', redirectTo: '/site/editor/workcenters', pathMatch: 'full' },
          { path: 'workcenters', component: SiteEditorWorkcenters,
            children: [
              {path: 'positions', component: SiteEditorWorkcenterPosition },
              {path: 'shifts', component: SiteEditorWorkcenterShift },
            ]
           },
          { path: 'forecasts', component: SiteEditorForecasts },
          { path: 'cofs', component: SiteEditorCofs },
          { path: '**', component: PathNotFound }
        ]
      },
      { path: 'leaveapproval', component: SiteLeaveApproval },
      { path: 'modtime', component: SiteModTime },
      { path: 'ingest', component: SiteIngest },
      { path: '**', component: PathNotFound },
    ]
  },
  { path: 'query', component: TeamQuery },
  { path: 'team', component: TeamEditor,
    children: [
      {path: '', redirectTo: '/team/workcodes', pathMatch: 'full'},
      {path: 'workcodes', component: TeamEditorWorkcodes },
      {path: 'companies', component: TeamEditorCompanies },
      {path: 'contacts', component: TeamEditorContacts },
      {path: 'specialties', component: TeamEditorSpecialties },
      {path: 'sites', component: TeamEditorSites },
      {path: '**', component: TeamEditorWorkcodes }
    ]
   },
  { path: '**', redirectTo: '/login' }
];

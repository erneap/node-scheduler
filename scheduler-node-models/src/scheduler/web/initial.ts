import { IEmployee } from "../employees";
import { ISite } from "../sites";
import { ITeam } from "../teams";

export interface InitialResponse {
  team: ITeam,
  site: ISite,
  employee: IEmployee,
  exception: string
}
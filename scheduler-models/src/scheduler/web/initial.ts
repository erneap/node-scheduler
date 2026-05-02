import { IMenuGroup } from "../../general";
import { ISecurityQuestion } from "../../users";
import { IEmployee } from "../employees";
import { ISite } from "../sites";
import { ITeam } from "../teams";

export interface InitialResponse {
  menu: IMenuGroup[];
  team?: ITeam,
  site?: ISite,
  employee?: IEmployee,
  questions?: ISecurityQuestion[]
}
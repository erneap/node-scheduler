/**
 * The company info provides for the employee's company, company id, an alternate 
 * company id, job title, rank/grade, a cost center and division
 */

/**
 * This interface defines an employee's company information.
 */
export interface ICompanyInfo {
  company: string;
  employeeid: string;
  alternateid?: string;
  jobtitle?: string;
  rank?: string;
  costcenter?: string;
  division?: string;
}
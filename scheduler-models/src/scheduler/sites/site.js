"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Site = void 0;
const employees_1 = require("../employees");
const labor_1 = require("../labor");
const cofsReport_1 = require("./reports/cofsReport");
const forecast_1 = require("./reports/forecast");
const workcenter_1 = require("./workcenters/workcenter");
/**
 * This class implements the Site interface data members and actions.
 */
class Site {
    constructor(site) {
        this.id = (site) ? site.id : '';
        this.name = (site) ? site.name : '';
        this.utcOffset = (site) ? site.utcOffset : 0;
        this.showMids = (site) ? site.showMids : false;
        this.workcenters = [];
        if (site && site.workcenters) {
            site.workcenters.forEach(wc => {
                this.workcenters.push(new workcenter_1.Workcenter(wc));
            });
            this.workcenters.sort((a, b) => a.compareTo(b));
        }
        this.laborCodes = [];
        if (site && site.laborCodes) {
            site.laborCodes.forEach(lc => {
                this.laborCodes.push(new labor_1.LaborCode(lc));
            });
            this.laborCodes.sort((a, b) => a.compareTo(b));
        }
        this.forecasts = [];
        if (site && site.forecasts) {
            site.forecasts.forEach(fcst => {
                this.forecasts.push(new forecast_1.Forecast(fcst));
            });
            this.forecasts.sort((a, b) => a.compareTo(b));
        }
        this.cofs = [];
        if (site && site.cofs) {
            site.cofs.forEach(cofs => {
                this.cofs.push(new cofsReport_1.CofSReport(cofs));
            });
            this.cofs.sort((a, b) => a.compareTo(b));
        }
        this.employees = [];
        if (site && site.employees) {
            site.employees.forEach(emp => {
                if (this.employees) {
                    this.employees.push(new employees_1.Employee(emp));
                }
            });
            this.employees.sort((a, b) => a.compareTo(b));
        }
    }
    /**
     * This function is used for sorting sites
     * @param other another site object to use in comparison
     * @returns A numeric value for the relative position of this site to another.
     */
    compareTo(other) {
        if (other) {
            return (this.name < other.name) ? -1 : 1;
        }
        return -1;
    }
    /**
     * This method will provide a list of labor codes active during the period provided.
     * @param start The start date of the period
     * @param end The ending date of the period
     * @returns A list of active labor codes for the period.
     */
    getCurrentLaborCodes(start, end) {
        const result = [];
        this.forecasts.forEach(fcst => {
            if ((start.getTime() <= fcst.endDate.getTime())
                && (end.getTime() >= fcst.startDate.getTime())) {
                fcst.laborCodes.forEach(lc => {
                    let found = false;
                    result.forEach(rlc => {
                        if (rlc.chargeNumber === lc.chargeNumber
                            && rlc.extension === lc.extension) {
                            found = true;
                        }
                    });
                    if (!found) {
                        result.push(new labor_1.LaborCode(lc));
                    }
                });
            }
        });
        result.sort((a, b) => a.compareTo(b));
        return result;
    }
}
exports.Site = Site;

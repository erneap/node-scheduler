"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Permission = void 0;
class Permission {
    constructor(perm) {
        this.application = (perm) ? perm.application : '';
        this.job = (perm) ? perm.job : '';
    }
    compareTo(other) {
        if (other) {
            if (this.application === other.application) {
                return (this.job < other.job) ? -1 : 1;
            }
            return (this.application < other.application) ? -1 : 1;
        }
        return 0;
    }
}
exports.Permission = Permission;

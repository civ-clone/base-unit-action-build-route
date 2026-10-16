"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildingRoute = void 0;
const Busy_1 = require("@civ-clone/core-unit/Rules/Busy");
// A worker on a standing order to build a route, between squares. While it builds on one it carries the build's own
//  busy rule instead (`BuildingRoad`, say).
class BuildingRoute extends Busy_1.default {
}
exports.BuildingRoute = BuildingRoute;
exports.default = BuildingRoute;
//# sourceMappingURL=BuildingRoute.js.map
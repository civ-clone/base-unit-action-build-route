import Busy from '@civ-clone/core-unit/Rules/Busy';

// A worker on a standing order to build a route, between squares. While it builds on one it carries the build's own
//  busy rule instead (`BuildingRoad`, say).
export class BuildingRoute extends Busy {}

export default BuildingRoute;

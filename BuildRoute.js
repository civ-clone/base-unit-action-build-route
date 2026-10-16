"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildRoute = exports.handBack = exports.generateKey = exports.buildingRoute = void 0;
const PathFinderRegistry_1 = require("@civ-clone/core-world-path/PathFinderRegistry");
const core_pending_effect_1 = require("@civ-clone/core-pending-effect");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const StrategyNoteRegistry_1 = require("@civ-clone/core-strategy/StrategyNoteRegistry");
const buildRoute_1 = require("./lib/buildRoute");
const Action_1 = require("@civ-clone/core-unit/Action");
const BuildingRoute_1 = require("./Busy/BuildingRoute");
const Moved_1 = require("@civ-clone/core-unit/Rules/Moved");
const NoPathAvailable_1 = require("@civ-clone/base-unit-action-goto/Errors/NoPathAvailable");
const NoPathFinderAvailable_1 = require("@civ-clone/base-unit-action-goto/Errors/NoPathFinderAvailable");
const BusyRegistry_1 = require("@civ-clone/core-unit/BusyRegistry");
var buildRoute_2 = require("./lib/buildRoute");
Object.defineProperty(exports, "buildingRoute", { enumerable: true, get: function () { return buildRoute_2.buildingRoute; } });
Object.defineProperty(exports, "generateKey", { enumerable: true, get: function () { return buildRoute_2.generateKey; } });
Object.defineProperty(exports, "handBack", { enumerable: true, get: function () { return buildRoute_2.handBack; } });
// A standing order for a worker to go to `to`, doing a build action on each square of the way where it's offered one
//  (civ-clone/web-renderer#195): `RoadTo` and `RailroadTo` are the two a ruleset offers. The path is found once, as
//  `GoTo` finds it.
class BuildRoute extends Action_1.default {
    // `buildAction` is the build action's type name (`BuildRoad`, say).
    constructor(from, to, unit, ruleRegistry = RuleRegistry_1.instance, pathFinderRegistry = PathFinderRegistry_1.instance, strategyNoteRegistry = StrategyNoteRegistry_1.instance, pendingEffectRegistry = core_pending_effect_1.instance, buildAction = '') {
        super(from, to, unit, ruleRegistry);
        this._buildAction = buildAction;
        this._pathFinderRegistry = pathFinderRegistry;
        this._pendingEffectRegistry = pendingEffectRegistry;
        this._strategyNoteRegistry = strategyNoteRegistry;
    }
    // Finds the path, starts the order and gets on with it straight away, with the moves the worker has left.
    perform() {
        const unit = this.unit(), [PathFinder] = this._pathFinderRegistry.entries();
        if (!PathFinder) {
            throw new NoPathFinderAvailable_1.default();
        }
        const path = new PathFinder(unit, unit.tile(), this.to()).generate();
        if (!path) {
            throw new NoPathAvailable_1.default();
        }
        // The tiles, not the `Path` (see `base-unit-action-goto`), without the one the worker stands on.
        const remaining = path.entries();
        remaining.shift();
        (0, buildRoute_1.startBuildingRoute)(unit, remaining, this._buildAction, {
            pendingEffectRegistry: this._pendingEffectRegistry,
            strategyNoteRegistry: this._strategyNoteRegistry,
        });
        (0, buildRoute_1.default)(unit, {
            pendingEffectRegistry: this._pendingEffectRegistry,
            strategyNoteRegistry: this._strategyNoteRegistry,
        });
        if (!unit.destroyed()) {
            this.ruleRegistry().process(Moved_1.default, unit, this);
        }
    }
}
exports.BuildRoute = BuildRoute;
// Without this a worker saved between squares fails to load. Nothing in the rule depends on the unit: what the order
//  needs is in its note, which is saved. A build under way is the build's own delayed action, which rebuilds itself.
BusyRegistry_1.instance.register(BuildingRoute_1.default, () => (0, buildRoute_1.buildingRoute)());
exports.default = BuildRoute;
//# sourceMappingURL=BuildRoute.js.map
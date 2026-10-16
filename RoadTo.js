"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoadTo = void 0;
const PathFinderRegistry_1 = require("@civ-clone/core-world-path/PathFinderRegistry");
const core_pending_effect_1 = require("@civ-clone/core-pending-effect");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const StrategyNoteRegistry_1 = require("@civ-clone/core-strategy/StrategyNoteRegistry");
const BuildRoad_1 = require("@civ-clone/base-unit-action-build-road/BuildRoad");
const BuildRoute_1 = require("./BuildRoute");
const DataObject_1 = require("@civ-clone/core-data-object/DataObject");
// Road to: go to `to`, building a Road on each square of the way where the worker is offered `BuildRoad`.
class RoadTo extends BuildRoute_1.default {
    constructor(from, to, unit, ruleRegistry = RuleRegistry_1.instance, pathFinderRegistry = PathFinderRegistry_1.instance, strategyNoteRegistry = StrategyNoteRegistry_1.instance, pendingEffectRegistry = core_pending_effect_1.instance) {
        super(from, to, unit, ruleRegistry, pathFinderRegistry, strategyNoteRegistry, pendingEffectRegistry, (0, DataObject_1.typeNameOf)(BuildRoad_1.default));
    }
}
exports.RoadTo = RoadTo;
exports.default = RoadTo;
//# sourceMappingURL=RoadTo.js.map
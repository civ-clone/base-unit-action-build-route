"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const core_pending_effect_1 = require("@civ-clone/core-pending-effect");
const StrategyNoteRegistry_1 = require("@civ-clone/core-strategy/StrategyNoteRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const buildRoute_1 = require("../../lib/buildRoute");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Low_1 = require("@civ-clone/core-rule/Priorities/Low");
const TurnStart_1 = require("@civ-clone/core-player/Rules/TurnStart");
const getRules = (strategyNoteRegistry = StrategyNoteRegistry_1.instance, unitRegistry = UnitRegistry_1.instance, pendingEffectRegistry = core_pending_effect_1.instance) => [
    new TurnStart_1.default('base-unit-action-build-route:player/turn-start/build-route', 
    // After the units' moves have been reset and finished builds completed (`civ1-player`'s `reset-units`).
    new Low_1.default(), new Effect_1.default((player) => unitRegistry
        .getByPlayer(player)
        .filter((unit) => strategyNoteRegistry.getByKey((0, buildRoute_1.generateKey)(unit)) !== undefined)
        .forEach((unit) => {
        // One unit's failure ends its own order and nothing else: a throw here would stop the rest of the player's
        //  turn-start rules.
        try {
            (0, buildRoute_1.default)(unit, {
                pendingEffectRegistry,
                strategyNoteRegistry,
            });
        }
        catch (e) {
            (0, buildRoute_1.handBack)(unit, { pendingEffectRegistry, strategyNoteRegistry });
        }
    }))),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=turn-start.js.map
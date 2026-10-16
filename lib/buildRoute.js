"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startBuildingRoute = exports.buildRouteUnit = exports.handBack = exports.buildingRoute = exports.generateKey = void 0;
// Builds a route with one worker for one turn, as a standing order from its player (civ-clone/web-renderer#195): along a
//  path to a destination, the worker does a build action (`BuildRoad`, say) on each square where it's offered one, and
//  walks on where it isn't. The order lives in a `StrategyNote`, so it is saved with the game. Between squares the
//  worker carries the `BuildingRoute` busy rule; while it builds it carries the build's own (`BuildingRoad`, say), and
//  the note records the build's `PendingEffect`, so the next turn can tell a build still under way from one the player
//  called off, as `base-unit-action-automate` does.
const core_pending_effect_1 = require("@civ-clone/core-pending-effect");
const StrategyNote_1 = require("@civ-clone/core-strategy/StrategyNote");
const StrategyNoteRegistry_1 = require("@civ-clone/core-strategy/StrategyNoteRegistry");
const BuildingRoute_1 = require("../Busy/BuildingRoute");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const moveOneStep_1 = require("@civ-clone/base-unit-action-goto/lib/moveOneStep");
const DataObject_1 = require("@civ-clone/core-data-object/DataObject");
const generateKey = (unit) => (0, StrategyNote_1.generateKey)(unit, 'buildRoute');
exports.generateKey = generateKey;
const registriesWith = (registries) => ({
    pendingEffectRegistry: core_pending_effect_1.instance,
    strategyNoteRegistry: StrategyNoteRegistry_1.instance,
    ...registries,
});
// The `BuildingRoute` rule, built the same way fresh or restored. It never ends by itself: the order ends when the
//  worker arrives or can't go on, or when the player gives it other orders.
const buildingRoute = () => new BuildingRoute_1.default(new Criterion_1.default(() => false), new Effect_1.default(() => { }));
exports.buildingRoute = buildingRoute;
const forget = (unit, registries) => {
    const note = registries.strategyNoteRegistry.getByKey((0, exports.generateKey)(unit));
    if (note) {
        registries.strategyNoteRegistry.unregister(note);
    }
};
// Ends the order and gives the worker back to its player, with whatever moves it has left.
const handBack = (unit, registries = {}) => {
    forget(unit, registriesWith(registries));
    if (unit.destroyed()) {
        return;
    }
    unit.setBusy();
    unit.setActive();
};
exports.handBack = handBack;
// Whether the worker is still at the build the order started: it carries the build's busy rule, and the build's effect
//  is the latest it owes (re-ordering a busy worker leaves the old effect owed, with a different busy rule or a newer
//  effect).
const stillWorking = (registries, unit, working) => {
    const busy = unit.busy();
    if (busy === null || (0, DataObject_1.typeNameOf)(busy.constructor) !== working.busy) {
        return false;
    }
    if (working.effect === null) {
        return true;
    }
    const owed = registries.pendingEffectRegistry.getByTarget(unit);
    return owed[owed.length - 1] === working.effect;
};
// The build action the worker is offered where it stands, if any.
const buildHere = (unit, order) => unit
    .actions()
    .find((action) => (0, DataObject_1.typeNameOf)(action.constructor) === order.action);
// Runs the order for the worker's turn, with the moves it has. Returns whether the order still stands. Synchronous, as
//  a `TurnStart` rule has to be.
const buildRouteUnit = (unit, registries = {}) => {
    var _a;
    const resolved = registriesWith(registries), note = resolved.strategyNoteRegistry.getByKey((0, exports.generateKey)(unit));
    if (!note) {
        return false;
    }
    const order = note.value();
    if (unit.destroyed() || order.player !== unit.player()) {
        forget(unit, resolved);
        return false;
    }
    if (order.working !== null) {
        if (stillWorking(resolved, unit, order.working)) {
            return true;
        }
        // Not working, and the build's effect was discharged: the build is done, so on along the route.
        if (unit.busy() === null &&
            (order.working.effect === null ||
                !resolved.pendingEffectRegistry
                    .getByTarget(unit)
                    .includes(order.working.effect))) {
            order.working = null;
            unit.setBusy((0, exports.buildingRoute)());
        }
    }
    // Selecting a busy unit clears its busy rule, so the player has given it other orders: the order is over, and the
    //  unit is left as it is.
    if (!(unit.busy() instanceof BuildingRoute_1.default)) {
        forget(unit, resolved);
        return false;
    }
    // A busy unit isn't made active at the start of its turn, and only an active one is offered actions.
    unit.setActive();
    while (unit.moves().value() > 0.25) {
        const build = buildHere(unit, order);
        if (build) {
            build.perform();
            const after = unit.busy();
            // Something other than a build changed what the worker is doing: the order is over.
            if (after === null || after instanceof BuildingRoute_1.default) {
                forget(unit, resolved);
                return false;
            }
            const owed = resolved.pendingEffectRegistry.getByTarget(unit);
            order.working = {
                busy: (0, DataObject_1.typeNameOf)(after.constructor),
                effect: (_a = owed[owed.length - 1]) !== null && _a !== void 0 ? _a : null,
            };
            return true;
        }
        // Arrived, with nothing more to build: the order is done.
        if (order.path.length === 0) {
            (0, exports.handBack)(unit, resolved);
            return false;
        }
        const result = (0, moveOneStep_1.default)(unit, order.path[0], order.path.length === 1);
        // The route no longer works, or the last square asks the player to choose: hand the worker back.
        if (result === 'blocked' || result === 'halted') {
            (0, exports.handBack)(unit, resolved);
            return false;
        }
        // Short of the moves the square costs: try it again next turn.
        if (result === 'failed') {
            break;
        }
        order.path.shift();
    }
    if (unit.destroyed()) {
        forget(unit, resolved);
        return false;
    }
    unit.setActive(false);
    return true;
};
exports.buildRouteUnit = buildRouteUnit;
// Starts the order for the worker along `path` (the squares after the one it stands on, to the destination), replacing
//  any it had. `action` is the build action's type name.
const startBuildingRoute = (unit, path, action, registries = {}) => {
    unit.setBusy((0, exports.buildingRoute)());
    registriesWith(registries).strategyNoteRegistry.replace(new StrategyNote_1.StrategyNote((0, exports.generateKey)(unit), {
        player: unit.player(),
        path,
        action,
        working: null,
    }));
};
exports.startBuildingRoute = startBuildingRoute;
exports.default = exports.buildRouteUnit;
//# sourceMappingURL=buildRoute.js.map
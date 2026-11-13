"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeOrders = void 0;
const PlayerResearchRegistry_1 = require("@civ-clone/core-science/PlayerResearchRegistry");
const Terraforms_1 = require("@civ-clone/base-unit-trait-terraforms/Terraforms");
/**
 * The route orders (`RoadTo`, say) `unit` may be given for a distant square: none unless it has `trait`, and otherwise
 * each order in `table` whose advance its player knows, in the table's order. A player with no research of its own (a
 * barbarian, say) knows nothing. A renderer can offer the same list beside Go to, so the rule is in one place.
 */
const routeOrders = (table, trait = Terraforms_1.default) => (unit, playerResearchRegistry = PlayerResearchRegistry_1.instance) => {
    if (!unit.hasTrait(trait)) {
        return [];
    }
    let research = null;
    return table
        .filter(([, Required]) => {
        if (Required === null) {
            return true;
        }
        if (research === null) {
            research = playerResearchRegistry.getBy('player', unit.player());
        }
        return research.some((playerResearch) => playerResearch.completed(Required));
    })
        .map(([Order]) => Order);
};
exports.routeOrders = routeOrders;
exports.default = exports.routeOrders;
//# sourceMappingURL=routeOrders.js.map
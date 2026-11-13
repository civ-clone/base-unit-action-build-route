import { PlayerResearchRegistry } from '@civ-clone/core-science/PlayerResearchRegistry';
import Advance from '@civ-clone/core-science/Advance';
import { TraitType } from '@civ-clone/core-unit/UnitTrait';
import Unit from '@civ-clone/core-unit/Unit';
/**
 * A ruleset's route orders, in the order it offers them, each with the `Advance` its player must know first, or `null`
 * for none.
 */
export type RouteOrderTable<Order> = [Order, typeof Advance | null][];
/**
 * The route orders (`RoadTo`, say) `unit` may be given for a distant square: none unless it has `trait`, and otherwise
 * each order in `table` whose advance its player knows, in the table's order. A player with no research of its own (a
 * barbarian, say) knows nothing. A renderer can offer the same list beside Go to, so the rule is in one place.
 */
export declare const routeOrders: <Order>(
  table: RouteOrderTable<Order>,
  trait?: TraitType
) => (unit: Unit, playerResearchRegistry?: PlayerResearchRegistry) => Order[];
export default routeOrders;

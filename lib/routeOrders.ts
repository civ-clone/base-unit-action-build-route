import {
  PlayerResearchRegistry,
  instance as playerResearchRegistryInstance,
} from '@civ-clone/core-science/PlayerResearchRegistry';
import Advance from '@civ-clone/core-science/Advance';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import Terraforms from '@civ-clone/base-unit-trait-terraforms/Terraforms';
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
export const routeOrders =
  <Order>(table: RouteOrderTable<Order>, trait: TraitType = Terraforms) =>
  (
    unit: Unit,
    playerResearchRegistry: PlayerResearchRegistry = playerResearchRegistryInstance
  ): Order[] => {
    if (!unit.hasTrait(trait)) {
      return [];
    }

    let research: PlayerResearch[] | null = null;

    return table
      .filter(([, Required]): boolean => {
        if (Required === null) {
          return true;
        }

        if (research === null) {
          research = playerResearchRegistry.getBy('player', unit.player());
        }

        return research.some((playerResearch: PlayerResearch): boolean =>
          playerResearch.completed(Required)
        );
      })
      .map(([Order]): Order => Order);
  };

export default routeOrders;

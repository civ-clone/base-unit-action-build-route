import {
  PathFinderRegistry,
  instance as pathFinderRegistryInstance,
} from '@civ-clone/core-world-path/PathFinderRegistry';
import {
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import {
  StrategyNoteRegistry,
  instance as strategyNoteRegistryInstance,
} from '@civ-clone/core-strategy/StrategyNoteRegistry';
import BuildRoad from '@civ-clone/base-unit-action-build-road/BuildRoad';
import BuildRoute from './BuildRoute';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import { typeNameOf } from '@civ-clone/core-data-object/DataObject';

// Road to: go to `to`, building a Road on each square of the way where the worker is offered `BuildRoad`.
export class RoadTo extends BuildRoute {
  constructor(
    from: Tile,
    to: Tile,
    unit: Unit,
    ruleRegistry: RuleRegistry = ruleRegistryInstance,
    pathFinderRegistry: PathFinderRegistry = pathFinderRegistryInstance,
    strategyNoteRegistry: StrategyNoteRegistry = strategyNoteRegistryInstance,
    pendingEffectRegistry: PendingEffectRegistry = pendingEffectRegistryInstance
  ) {
    super(
      from,
      to,
      unit,
      ruleRegistry,
      pathFinderRegistry,
      strategyNoteRegistry,
      pendingEffectRegistry,
      typeNameOf(BuildRoad)
    );
  }
}

export default RoadTo;

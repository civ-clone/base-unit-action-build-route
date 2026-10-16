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
import BuildRailroad from '@civ-clone/base-unit-action-build-railroad/BuildRailroad';
import BuildRoute from './BuildRoute';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import { typeNameOf } from '@civ-clone/core-data-object/DataObject';

// Railroad to: go to `to`, building a Railroad on each square of the way where the worker is offered `BuildRailroad`.
export class RailroadTo extends BuildRoute {
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
      typeNameOf(BuildRailroad)
    );
  }
}

export default RailroadTo;

import { PathFinderRegistry } from '@civ-clone/core-world-path/PathFinderRegistry';
import { PendingEffectRegistry } from '@civ-clone/core-pending-effect';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { StrategyNoteRegistry } from '@civ-clone/core-strategy/StrategyNoteRegistry';
import BuildRoute from './BuildRoute';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
export declare class RoadTo extends BuildRoute {
  constructor(
    from: Tile,
    to: Tile,
    unit: Unit,
    ruleRegistry?: RuleRegistry,
    pathFinderRegistry?: PathFinderRegistry,
    strategyNoteRegistry?: StrategyNoteRegistry,
    pendingEffectRegistry?: PendingEffectRegistry
  );
}
export default RoadTo;

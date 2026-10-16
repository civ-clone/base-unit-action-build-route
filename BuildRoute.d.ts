import { PathFinderRegistry } from '@civ-clone/core-world-path/PathFinderRegistry';
import { PendingEffectRegistry } from '@civ-clone/core-pending-effect';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { StrategyNoteRegistry } from '@civ-clone/core-strategy/StrategyNoteRegistry';
import Action from '@civ-clone/core-unit/Action';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
export type { BuildRouteNote } from './lib/buildRoute';
export { buildingRoute, generateKey, handBack } from './lib/buildRoute';
export declare class BuildRoute extends Action {
  private _buildAction;
  private _pathFinderRegistry;
  private _pendingEffectRegistry;
  private _strategyNoteRegistry;
  constructor(
    from: Tile,
    to: Tile,
    unit: Unit,
    ruleRegistry?: RuleRegistry,
    pathFinderRegistry?: PathFinderRegistry,
    strategyNoteRegistry?: StrategyNoteRegistry,
    pendingEffectRegistry?: PendingEffectRegistry,
    buildAction?: string
  );
  perform(): void;
}
export default BuildRoute;

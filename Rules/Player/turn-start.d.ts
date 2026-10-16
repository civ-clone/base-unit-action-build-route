import { PendingEffectRegistry } from '@civ-clone/core-pending-effect';
import { StrategyNoteRegistry } from '@civ-clone/core-strategy/StrategyNoteRegistry';
import { UnitRegistry } from '@civ-clone/core-unit/UnitRegistry';
import TurnStart from '@civ-clone/core-player/Rules/TurnStart';
export declare const getRules: (
  strategyNoteRegistry?: StrategyNoteRegistry,
  unitRegistry?: UnitRegistry,
  pendingEffectRegistry?: PendingEffectRegistry
) => TurnStart[];
export default getRules;

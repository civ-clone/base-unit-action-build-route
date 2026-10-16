import {
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect';
import {
  StrategyNoteRegistry,
  instance as strategyNoteRegistryInstance,
} from '@civ-clone/core-strategy/StrategyNoteRegistry';
import {
  UnitRegistry,
  instance as unitRegistryInstance,
} from '@civ-clone/core-unit/UnitRegistry';
import buildRouteUnit, { generateKey, handBack } from '../../lib/buildRoute';
import Effect from '@civ-clone/core-rule/Effect';
import Low from '@civ-clone/core-rule/Priorities/Low';
import Player from '@civ-clone/core-player/Player';
import TurnStart from '@civ-clone/core-player/Rules/TurnStart';
import Unit from '@civ-clone/core-unit/Unit';

export const getRules = (
  strategyNoteRegistry: StrategyNoteRegistry = strategyNoteRegistryInstance,
  unitRegistry: UnitRegistry = unitRegistryInstance,
  pendingEffectRegistry: PendingEffectRegistry = pendingEffectRegistryInstance
): TurnStart[] => [
  new TurnStart(
    'base-unit-action-build-route:player/turn-start/build-route',
    // After the units' moves have been reset and finished builds completed (`civ1-player`'s `reset-units`).
    new Low(),
    new Effect((player: Player): void =>
      unitRegistry
        .getByPlayer(player)
        .filter(
          (unit: Unit): boolean =>
            strategyNoteRegistry.getByKey(generateKey(unit)) !== undefined
        )
        .forEach((unit: Unit): void => {
          // One unit's failure ends its own order and nothing else: a throw here would stop the rest of the player's
          //  turn-start rules.
          try {
            buildRouteUnit(unit, {
              pendingEffectRegistry,
              strategyNoteRegistry,
            });
          } catch (e) {
            handBack(unit, { pendingEffectRegistry, strategyNoteRegistry });
          }
        })
    )
  ),
];

export default getRules;

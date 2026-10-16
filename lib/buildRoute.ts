// Builds a route with one worker for one turn, as a standing order from its player (civ-clone/web-renderer#195): along a
//  path to a destination, the worker does a build action (`BuildRoad`, say) on each square where it's offered one, and
//  walks on where it isn't. The order lives in a `StrategyNote`, so it is saved with the game. Between squares the
//  worker carries the `BuildingRoute` busy rule; while it builds it carries the build's own (`BuildingRoad`, say), and
//  the note records the build's `PendingEffect`, so the next turn can tell a build still under way from one the player
//  called off, as `base-unit-action-automate` does.
import {
  PendingEffect,
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect';
import {
  StrategyNote,
  generateKey as generateRawKey,
} from '@civ-clone/core-strategy/StrategyNote';
import {
  StrategyNoteRegistry,
  instance as strategyNoteRegistryInstance,
} from '@civ-clone/core-strategy/StrategyNoteRegistry';
import Action from '@civ-clone/core-unit/Action';
import BuildingRoute from '../Busy/BuildingRoute';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import moveOneStep from '@civ-clone/base-unit-action-goto/lib/moveOneStep';
import { typeNameOf } from '@civ-clone/core-data-object/DataObject';

export const generateKey = (unit: Unit): string =>
  generateRawKey(unit, 'buildRoute');

// What a save keeps of the order: the player who gave it; the squares still to go, as tiles (never a `Path`, which a
//  save restores as a plain array: see `base-unit-action-goto`); the build action, by its type name; and, while a build
//  is under way, the build's busy rule (its name) and the `PendingEffect` that finishes it.
export interface BuildRouteNote {
  player: Player;
  path: Tile[];
  action: string;
  working: {
    busy: string;
    effect: PendingEffect | null;
  } | null;
}

// The registries the order reads.
export type BuildRouteRegistries = {
  pendingEffectRegistry: PendingEffectRegistry;
  strategyNoteRegistry: StrategyNoteRegistry;
};

const registriesWith = (
  registries: Partial<BuildRouteRegistries>
): BuildRouteRegistries => ({
  pendingEffectRegistry: pendingEffectRegistryInstance,
  strategyNoteRegistry: strategyNoteRegistryInstance,
  ...registries,
});

// The `BuildingRoute` rule, built the same way fresh or restored. It never ends by itself: the order ends when the
//  worker arrives or can't go on, or when the player gives it other orders.
export const buildingRoute = (): BuildingRoute =>
  new BuildingRoute(
    new Criterion((): boolean => false),
    new Effect((): void => {})
  );

const forget = (unit: Unit, registries: BuildRouteRegistries): void => {
  const note = registries.strategyNoteRegistry.getByKey(generateKey(unit));

  if (note) {
    registries.strategyNoteRegistry.unregister(note);
  }
};

// Ends the order and gives the worker back to its player, with whatever moves it has left.
export const handBack = (
  unit: Unit,
  registries: Partial<BuildRouteRegistries> = {}
): void => {
  forget(unit, registriesWith(registries));

  if (unit.destroyed()) {
    return;
  }

  unit.setBusy();
  unit.setActive();
};

// Whether the worker is still at the build the order started: it carries the build's busy rule, and the build's effect
//  is the latest it owes (re-ordering a busy worker leaves the old effect owed, with a different busy rule or a newer
//  effect).
const stillWorking = (
  registries: BuildRouteRegistries,
  unit: Unit,
  working: NonNullable<BuildRouteNote['working']>
): boolean => {
  const busy = unit.busy();

  if (busy === null || typeNameOf(busy.constructor) !== working.busy) {
    return false;
  }

  if (working.effect === null) {
    return true;
  }

  const owed = registries.pendingEffectRegistry.getByTarget(unit);

  return owed[owed.length - 1] === working.effect;
};

// The build action the worker is offered where it stands, if any.
const buildHere = (unit: Unit, order: BuildRouteNote): Action | undefined =>
  unit
    .actions()
    .find(
      (action: Action): boolean =>
        typeNameOf(action.constructor as typeof Action) === order.action
    );

// Runs the order for the worker's turn, with the moves it has. Returns whether the order still stands. Synchronous, as
//  a `TurnStart` rule has to be.
export const buildRouteUnit = (
  unit: Unit,
  registries: Partial<BuildRouteRegistries> = {}
): boolean => {
  const resolved = registriesWith(registries),
    note = resolved.strategyNoteRegistry.getByKey<BuildRouteNote>(
      generateKey(unit)
    );

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
    if (
      unit.busy() === null &&
      (order.working.effect === null ||
        !resolved.pendingEffectRegistry
          .getByTarget(unit)
          .includes(order.working.effect))
    ) {
      order.working = null;
      unit.setBusy(buildingRoute());
    }
  }

  // Selecting a busy unit clears its busy rule, so the player has given it other orders: the order is over, and the
  //  unit is left as it is.
  if (!(unit.busy() instanceof BuildingRoute)) {
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
      if (after === null || after instanceof BuildingRoute) {
        forget(unit, resolved);

        return false;
      }

      const owed = resolved.pendingEffectRegistry.getByTarget(unit);

      order.working = {
        busy: typeNameOf(after.constructor),
        effect: owed[owed.length - 1] ?? null,
      };

      return true;
    }

    // Arrived, with nothing more to build: the order is done.
    if (order.path.length === 0) {
      handBack(unit, resolved);

      return false;
    }

    const result = moveOneStep(unit, order.path[0], order.path.length === 1);

    // The route no longer works, or the last square asks the player to choose: hand the worker back.
    if (result === 'blocked' || result === 'halted') {
      handBack(unit, resolved);

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

// Starts the order for the worker along `path` (the squares after the one it stands on, to the destination), replacing
//  any it had. `action` is the build action's type name.
export const startBuildingRoute = (
  unit: Unit,
  path: Tile[],
  action: string,
  registries: Partial<BuildRouteRegistries> = {}
): void => {
  unit.setBusy(buildingRoute());

  registriesWith(registries).strategyNoteRegistry.replace(
    new StrategyNote<BuildRouteNote>(generateKey(unit), {
      player: unit.player(),
      path,
      action,
      working: null,
    })
  );
};

export default buildRouteUnit;

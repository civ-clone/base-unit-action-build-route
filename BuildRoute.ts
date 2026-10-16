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
import buildRouteUnit, {
  buildingRoute,
  startBuildingRoute,
} from './lib/buildRoute';
import Action from '@civ-clone/core-unit/Action';
import BuildingRoute from './Busy/BuildingRoute';
import Moved from '@civ-clone/core-unit/Rules/Moved';
import NoPathAvailable from '@civ-clone/base-unit-action-goto/Errors/NoPathAvailable';
import NoPathFinderAvailable from '@civ-clone/base-unit-action-goto/Errors/NoPathFinderAvailable';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import { instance as busyRegistryInstance } from '@civ-clone/core-unit/BusyRegistry';

export type { BuildRouteNote } from './lib/buildRoute';
export { buildingRoute, generateKey, handBack } from './lib/buildRoute';

// A standing order for a worker to go to `to`, doing a build action on each square of the way where it's offered one
//  (civ-clone/web-renderer#195): `RoadTo` and `RailroadTo` are the two a ruleset offers. The path is found once, as
//  `GoTo` finds it.
export class BuildRoute extends Action {
  private _buildAction: string;
  private _pathFinderRegistry: PathFinderRegistry;
  private _pendingEffectRegistry: PendingEffectRegistry;
  private _strategyNoteRegistry: StrategyNoteRegistry;

  // `buildAction` is the build action's type name (`BuildRoad`, say).
  constructor(
    from: Tile,
    to: Tile,
    unit: Unit,
    ruleRegistry: RuleRegistry = ruleRegistryInstance,
    pathFinderRegistry: PathFinderRegistry = pathFinderRegistryInstance,
    strategyNoteRegistry: StrategyNoteRegistry = strategyNoteRegistryInstance,
    pendingEffectRegistry: PendingEffectRegistry = pendingEffectRegistryInstance,
    buildAction: string = ''
  ) {
    super(from, to, unit, ruleRegistry);

    this._buildAction = buildAction;
    this._pathFinderRegistry = pathFinderRegistry;
    this._pendingEffectRegistry = pendingEffectRegistry;
    this._strategyNoteRegistry = strategyNoteRegistry;
  }

  // Finds the path, starts the order and gets on with it straight away, with the moves the worker has left.
  perform(): void {
    const unit = this.unit(),
      [PathFinder] = this._pathFinderRegistry.entries();

    if (!PathFinder) {
      throw new NoPathFinderAvailable();
    }

    const path = new PathFinder(unit, unit.tile(), this.to()).generate();

    if (!path) {
      throw new NoPathAvailable();
    }

    // The tiles, not the `Path` (see `base-unit-action-goto`), without the one the worker stands on.
    const remaining = path.entries();

    remaining.shift();

    startBuildingRoute(unit, remaining, this._buildAction, {
      pendingEffectRegistry: this._pendingEffectRegistry,
      strategyNoteRegistry: this._strategyNoteRegistry,
    });

    buildRouteUnit(unit, {
      pendingEffectRegistry: this._pendingEffectRegistry,
      strategyNoteRegistry: this._strategyNoteRegistry,
    });

    if (!unit.destroyed()) {
      this.ruleRegistry().process(Moved, unit, this);
    }
  }
}

// Without this a worker saved between squares fails to load. Nothing in the rule depends on the unit: what the order
//  needs is in its note, which is saved. A build under way is the build's own delayed action, which rebuilds itself.
busyRegistryInstance.register(
  BuildingRoute,
  (): BuildingRoute => buildingRoute()
);

export default BuildRoute;

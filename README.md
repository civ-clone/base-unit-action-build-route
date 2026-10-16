# base-unit-action-build-route

Road to and Railroad to: standing orders for a worker to go to a distant square, building a Road (or Railroad) on each
square of the way where it's offered the build (civ-clone/web-renderer#195).

- `BuildRoute`: `new BuildRoute(from, to, unit, ruleRegistry, pathFinderRegistry, strategyNoteRegistry,
  pendingEffectRegistry, buildAction)`, where `buildAction` is the build action's type name. Its `perform` finds the
  path once, as `GoTo` does, records the order in a `StrategyNote` (`generateKey(unit)`) and gets on with it straight
  away with the moves the worker has left.
- `RoadTo` and `RailroadTo`: `BuildRoute` with `BuildRoad` and `BuildRailroad`, the two orders a ruleset offers.
- Between squares the worker carries `BuildingRoute`. While it builds it carries the build's own busy rule
  (`BuildingRoad`, say), and the note records that rule's name and the build's `PendingEffect`, as
  [`base-unit-action-automate`](https://github.com/civ-clone/base-unit-action-automate) does.
- `Rules/Player/turn-start`: at the start of each of the player's turns (`Low`, after the units' moves are reset and
  finished builds completed), each worker with the order carries on. It builds where it stands if it's offered the
  build there, and otherwise walks on one square at a time (`moveOneStep` from
  [`base-unit-action-goto`](https://github.com/civ-clone/base-unit-action-goto)).
- The order ends, and the worker is handed back (no longer busy, active, the note dropped), when it arrives with nothing
  left to build, or when the way is blocked. Selecting the worker (which clears its busy rule) or setting it to
  something else ends the order and leaves the worker be.
- The order is saved with the game, between squares and part way through a build.

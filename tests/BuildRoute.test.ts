import buildRouteUnit, { BuildRouteNote, generateKey } from '../lib/buildRoute';
import { Railroad, Road } from '@civ-clone/civ1-world/TileImprovements';
import testGame, { TestGame } from './lib/testGame';
import BuildingRoute from '../Busy/BuildingRoute';
import Civilization from '@civ-clone/core-civilization/Civilization';
import { Game } from '@civ-clone/core-game/Game';
import Player from '@civ-clone/core-player/Player';
import RailroadTo from '../RailroadTo';
import { Railroad as RailroadAdvance } from '@civ-clone/civ1-science/Advances';
import RoadTo from '../RoadTo';
import { Settlers } from '@civ-clone/civ1-unit/Units';
import Tile from '@civ-clone/core-world/Tile';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
import TurnStart from '@civ-clone/core-player/Rules/TurnStart';
import Unit from '@civ-clone/core-unit/Unit';
import { instance as busyRegistryInstance } from '@civ-clone/core-unit/BusyRegistry';
import { expect } from 'chai';
import { gameForLoad } from '@civ-clone/core-save-game/gameForLoad';
import { hydrate } from '@civ-clone/core-save-game/hydrate';
import { instance as pendingEffectRegistryInstance } from '@civ-clone/core-pending-effect';
import { registerClasses } from '@civ-clone/core-save-game/registerClasses';
import { save } from '@civ-clone/core-save-game/save';
import turnStart from '../Rules/Player/turn-start';

const at = (tile: Tile): string => `${tile.x()},${tile.y()}`;

type Setup = TestGame & { player: Player; settlers: Settlers };

// Grassland everywhere, and Settlers at 1,3.
const setUp = async (): Promise<Setup> => {
  const setup = await testGame('49G', 7, 7),
    player = setup.addPlayer();

  setup.game.rules.register(
    ...turnStart(
      setup.game.strategyNotes,
      setup.game.units,
      pendingEffectRegistryInstance
    )
  );

  return {
    ...setup,
    player,
    settlers: setup.addUnit(Settlers, player, 1, 3),
  };
};

const order = (
  { game }: Setup,
  unit: Unit,
  to: Tile,
  Order: typeof RoadTo | typeof RailroadTo = RoadTo
): void =>
  unit.action(
    new Order(
      unit.tile(),
      to,
      unit,
      game.rules,
      game.pathFinders,
      game.strategyNotes,
      pendingEffectRegistryInstance
    )
  );

// The start of the player's next turn, as `civ1-player`'s `reset-units` has it (moves given back, a finished busy rule
//  processed, a busy unit left inactive), then the turn-start rules.
const nextTurn = ({ game, player }: Setup): void => {
  game.turn.increment();
  game.units.getByPlayer(player).forEach((unit: Unit): void => {
    unit.moves().set(unit.movement());

    const busy = unit.busy();

    if (!busy) {
      unit.setActive();

      return;
    }

    if (busy.validate()) {
      busy.process();
    }
  });
  game.rules.process(TurnStart, player);
};

const noteFor = ({ game }: Setup, unit: Unit): BuildRouteNote | undefined =>
  game.strategyNotes.getByKey<BuildRouteNote>(generateKey(unit))?.value();

const busyName = (unit: Unit): string | null =>
  unit.busy()?.constructor.name ?? null;

const has = (
  { game }: Setup,
  tile: Tile,
  Improvement: typeof TileImprovement
): boolean =>
  game.tileImprovements
    .getByTile(tile)
    .some((improvement) => improvement instanceof Improvement);

describe('BuildRoute', (): void => {
  it('should build a Road on each square of the way, starting where it stands, and hand the worker back on arrival', async (): Promise<void> => {
    const setup = await setUp(),
      { settlers, world } = setup,
      start = settlers.tile();

    order(setup, settlers, world.get(4, 3));

    // At work where it stands, with the rest of the way to go.
    expect(busyName(settlers)).to.equal('BuildingRoad');
    expect(noteFor(setup, settlers)!.action).to.equal('BuildRoad');

    const squares = [start, ...noteFor(setup, settlers)!.path];

    expect(squares).length(4);
    expect(at(squares[3])).to.equal('4,3');

    for (let turn = 0; turn < 12 && noteFor(setup, settlers); turn++) {
      nextTurn(setup);
    }

    expect(squares.every((tile: Tile): boolean => has(setup, tile, Road))).true;
    expect(at(settlers.tile())).to.equal('4,3');
    expect(noteFor(setup, settlers)).to.equal(undefined);
    expect(settlers.busy()).to.equal(null);
  });

  it('should walk on past a square that has a Road already', async (): Promise<void> => {
    const setup = await setUp(),
      { settlers, world } = setup;

    // Roads on every square but 3,3.
    setup.game.tileImprovements.register(
      ...world
        .entries()
        .filter((tile: Tile): boolean => at(tile) !== '3,3')
        .map((tile: Tile): Road => new Road(tile))
    );

    order(setup, settlers, world.get(3, 3));

    // Nothing to build where it stands: it walks on straight away, along the Roads.
    expect(settlers.busy()).instanceOf(BuildingRoute);

    for (let turn = 0; turn < 4 && at(settlers.tile()) !== '3,3'; turn++) {
      nextTurn(setup);
    }

    expect(at(settlers.tile())).to.equal('3,3');
    // No second Road anywhere.
    expect(
      world
        .entries()
        .some(
          (tile: Tile): boolean =>
            setup.game.tileImprovements
              .getByTile(tile)
              .filter((improvement) => improvement instanceof Road).length > 1
        )
    ).false;

    nextTurn(setup);

    if (settlers.busy() instanceof BuildingRoute) {
      nextTurn(setup);
    }

    expect(busyName(settlers)).to.equal('BuildingRoad');
  });

  it('should end the order, leaving the worker be, when the player gives it other orders', async (): Promise<void> => {
    const setup = await setUp(),
      { settlers, world } = setup;

    order(setup, settlers, world.get(4, 3));

    // What selecting a busy unit does (`civ1-unit`'s `activate/clear-busy`).
    settlers.setBusy();
    settlers.setActive();

    nextTurn(setup);

    expect(at(settlers.tile())).to.equal('1,3');
    expect(noteFor(setup, settlers)).to.equal(undefined);
    expect(settlers.busy()).to.equal(null);
  });

  it('should build a Railroad only on the squares with a Road', async (): Promise<void> => {
    const setup = await setUp(),
      { game, player, settlers, world } = setup;

    game.playerResearch.getByPlayer(player).addAdvance(RailroadAdvance);

    order(setup, settlers, world.get(4, 3), RailroadTo);

    // No Road where it stands, so nothing to build: it set off.
    expect(settlers.busy()).instanceOf(BuildingRoute);

    const squares = [world.get(1, 3), ...noteFor(setup, settlers)!.path],
      withRoad = squares[2];

    game.tileImprovements.register(new Road(withRoad));

    for (let turn = 0; turn < 20 && noteFor(setup, settlers); turn++) {
      nextTurn(setup);
    }

    expect(has(setup, withRoad, Railroad)).true;
    expect(
      squares
        .filter((tile: Tile): boolean => tile !== withRoad)
        .some((tile: Tile): boolean => has(setup, tile, Railroad))
    ).false;
    expect(at(settlers.tile())).to.equal('4,3');
  });

  it('should rebuild the busy rule after a load', async (): Promise<void> => {
    const { settlers } = await setUp(),
      busy = busyRegistryInstance.rebuild('BuildingRoute', settlers);

    expect(busy).instanceOf(BuildingRoute);
    expect(busy.validate()).false;
  });

  // Saves the game and loads it into another, as a player loading a saved game does: the game's own registries are
  //  fresh, and its players new objects.
  const saveAndLoad = (setup: Setup): Game => {
    const { game, player, settlers, world } = setup;

    player.setCivilization(new Civilization());
    game.pendingEffects.register(
      ...pendingEffectRegistryInstance
        .getByTarget(settlers)
        .filter((effect) => !game.pendingEffects.includes(effect))
    );
    game.engine.registerPlugins({
      '@civ-clone/base-unit-action-build-route': 'test',
    });
    registerClasses(game);
    game.classes.register(
      Settlers,
      Road,
      Railroad,
      ...world.entries().map((tile: Tile) => tile.terrain().sourceClass())
    );

    const loaded = gameForLoad({
      classes: game.classes,
      engine: game.engine,
      pathFinders: game.pathFinders,
      rules: game.rules,
    });

    hydrate(save(game, { name: 'test', createdAt: 0 }), loaded);

    return loaded;
  };

  it('should be saved with the game between squares, and carry on after a load', async (): Promise<void> => {
    const setup = await setUp(),
      { settlers, world } = setup;

    setup.game.tileImprovements.register(new Road(world.get(1, 3)));
    order(setup, settlers, world.get(4, 3));

    // It walked on from the Road it stood on, with no moves left to build.
    expect(settlers.busy()).instanceOf(BuildingRoute);

    const path = noteFor(setup, settlers)!.path.map(at);

    const loaded = saveAndLoad(setup),
      [restored] = loaded.units.entries(),
      [restoredPlayer] = loaded.players.entries(),
      note = loaded.strategyNotes
        .getByKey<BuildRouteNote>(generateKey(restored))!
        .value();

    expect(restored).to.not.equal(settlers);
    expect(restored.busy()).instanceOf(BuildingRoute);
    expect(note.player).to.equal(restoredPlayer);
    expect(note.path.map(at)).to.deep.equal(path);

    restored.moves().set(1);

    expect(
      buildRouteUnit(restored, {
        pendingEffectRegistry: loaded.pendingEffects,
        strategyNoteRegistry: loaded.strategyNotes,
      })
    ).true;
  });

  it('should be saved with the game part way through a build, and still be at it after a load', async (): Promise<void> => {
    const setup = await setUp(),
      { settlers, world } = setup;

    order(setup, settlers, world.get(4, 3));

    const loaded = saveAndLoad(setup),
      [restored] = loaded.units.entries(),
      note = loaded.strategyNotes
        .getByKey<BuildRouteNote>(generateKey(restored))!
        .value();

    expect(busyName(restored)).to.equal('BuildingRoad');
    expect(note.working!.busy).to.equal('BuildingRoad');
    expect(loaded.pendingEffects.getByTarget(restored)).to.deep.equal([
      note.working!.effect,
    ]);
    expect(
      buildRouteUnit(restored, {
        pendingEffectRegistry: loaded.pendingEffects,
        strategyNoteRegistry: loaded.strategyNotes,
      })
    ).true;
    expect(busyName(restored)).to.equal('BuildingRoad');
  });
});

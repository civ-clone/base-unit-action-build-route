// A small Civ1 world for testing a worker's orders: a game with Civ1's unit and world rules, a path finder, and players
//  who each know the whole map and have their own research. Its tile improvements and pending effects are the modules'
//  registries, emptied first, as the default game's are: the build actions register what they build there.
import BasePathFinder from '@civ-clone/simple-world-path/BasePathFinder';
import { Game } from '@civ-clone/core-game/Game';
import Player from '@civ-clone/core-player/Player';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import PlayerWorld from '@civ-clone/core-player-world/PlayerWorld';
import Unit from '@civ-clone/core-unit/Unit';
import World from '@civ-clone/core-world/World';
import { instance as pendingEffectRegistryInstance } from '@civ-clone/core-pending-effect';
import { instance as tileImprovementRegistryInstance } from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import simpleRLELoader from '@civ-clone/simple-world-generator/tests/lib/simpleRLELoader';
import unitRules from '@civ-clone/civ1-unit/registerRules';
import worldRules from '@civ-clone/civ1-world/registerRules';

export type TestGame = {
  game: Game;
  world: World;
  addPlayer: () => Player;
  addUnit: <T extends Unit>(
    UnitType: new (...args: any[]) => T,
    player: Player,
    x: number,
    y: number
  ) => T;
};

// `map` is a `simpleRLELoader` map, `height` rows of `width` tiles.
export const testGame = async (
  map: string,
  height: number,
  width: number
): Promise<TestGame> => {
  tileImprovementRegistryInstance.unregister(
    ...tileImprovementRegistryInstance.entries()
  );
  pendingEffectRegistryInstance.unregister(
    ...pendingEffectRegistryInstance.entries()
  );

  const game = new Game({
    pendingEffects: pendingEffectRegistryInstance,
    tileImprovements: tileImprovementRegistryInstance,
  });

  unitRules(game);
  worldRules(game);
  game.pathFinders.register(BasePathFinder);

  const world = await simpleRLELoader(game.rules, game.terrainFeatures)(
    map,
    height,
    width
  );

  return {
    game,
    world,
    addPlayer: (): Player => {
      const player = new Player(game.rules);

      game.players.register(player);
      game.playerWorlds.register(new PlayerWorld(player, world));
      game.playerWorlds.getByPlayer(player).register(...world.entries());
      game.playerResearch.register(
        new PlayerResearch(player, game.advances, game.rules)
      );

      return player;
    },
    addUnit: <T extends Unit>(
      UnitType: new (...args: any[]) => T,
      player: Player,
      x: number,
      y: number
    ): T => {
      const unit = new UnitType(null, player, world.get(x, y), game.rules);

      if (!game.units.includes(unit)) {
        game.units.register(unit);
      }

      return unit;
    },
  };
};

export default testGame;

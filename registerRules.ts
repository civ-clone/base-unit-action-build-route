import { Game, defaultGame } from '@civ-clone/core-game';
import turnStart from './Rules/Player/turn-start';

export const register = (game: Game): void =>
  game.rules.register(
    ...turnStart(game.strategyNotes, game.units, game.pendingEffects)
  );

// The plugin loader imports each package for this side effect, as it does for `base-unit-action-goto`.
register(defaultGame);

export default register;

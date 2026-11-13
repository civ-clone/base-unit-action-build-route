import Advance from '@civ-clone/core-science/Advance';
import Player from '@civ-clone/core-player/Player';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import PlayerResearchRegistry from '@civ-clone/core-science/PlayerResearchRegistry';
import RailroadTo from '../RailroadTo';
import RoadTo from '../RoadTo';
import Terraforms from '@civ-clone/base-unit-trait-terraforms/Terraforms';
import { TraitType, UnitTrait } from '@civ-clone/core-unit/UnitTrait';
import Unit from '@civ-clone/core-unit/Unit';
import { expect } from 'chai';
import routeOrders from '../lib/routeOrders';

class Rails extends Advance {}
class Canals extends Advance {}
class Digs extends UnitTrait {}

describe('routeOrders', (): void => {
  const table: [typeof RoadTo | typeof RailroadTo, typeof Advance | null][] = [
      [RoadTo, null],
      [RailroadTo, Rails],
    ],
    // A stand-in unit of `player` with `traits`.
    unitOf = (player: Player, ...traits: TraitType[]): Unit =>
      ({
        hasTrait: (Trait: TraitType): boolean => traits.includes(Trait),
        player: (): Player => player,
      } as unknown as Unit),
    // A registry holding one research for `player` that has completed `known`.
    researchOf = (
      player: Player,
      ...known: (typeof Advance)[]
    ): PlayerResearchRegistry => {
      const registry = new PlayerResearchRegistry();

      registry.register(
        Object.assign(Object.create(PlayerResearch.prototype), {
          player: (): Player => player,
          completed: (CompleteAdvance: typeof Advance): boolean =>
            known.includes(CompleteAdvance),
        })
      );

      return registry;
    };

  it('should offer nothing to a unit without the trait, without asking about research', (): void => {
    const player = new Player(),
      registry = new PlayerResearchRegistry();

    registry.getBy = (): never => {
      throw new Error('research was asked');
    };

    expect(routeOrders(table)(unitOf(player), registry)).eql([]);
  });

  it('should offer only the orders that need no advance while the advance is unknown', (): void => {
    const player = new Player();

    expect(
      routeOrders(table)(unitOf(player, Terraforms), researchOf(player))
    ).eql([RoadTo]);
  });

  it('should offer an order once its advance is known, in the order of the table', (): void => {
    const player = new Player();

    expect(
      routeOrders(table)(unitOf(player, Terraforms), researchOf(player, Rails))
    ).eql([RoadTo, RailroadTo]);
    expect(
      routeOrders([...table].reverse())(
        unitOf(player, Terraforms),
        researchOf(player, Rails)
      )
    ).eql([RailroadTo, RoadTo]);
  });

  it('should only count the advance named for each order', (): void => {
    const player = new Player();

    expect(
      routeOrders(table)(unitOf(player, Terraforms), researchOf(player, Canals))
    ).eql([RoadTo]);
  });

  it('should know nothing for a player with no research of its own', (): void => {
    const player = new Player();

    expect(
      routeOrders(table)(
        unitOf(player, Terraforms),
        researchOf(new Player(), Rails)
      )
    ).eql([RoadTo]);
  });

  it('should ask for the trait it was given', (): void => {
    const player = new Player(),
      research = researchOf(player, Rails);

    expect(routeOrders(table, Digs)(unitOf(player, Terraforms), research)).eql(
      []
    );
    expect(routeOrders(table, Digs)(unitOf(player, Digs), research)).eql([
      RoadTo,
      RailroadTo,
    ]);
  });

  it('should return a new list each time', (): void => {
    const player = new Player(),
      orders = routeOrders(table),
      unit = unitOf(player, Terraforms),
      research = researchOf(player, Rails),
      first = orders(unit, research);

    expect(orders(unit, research)).not.equal(first);
    expect(orders(unit, research)).eql(first);
  });
});

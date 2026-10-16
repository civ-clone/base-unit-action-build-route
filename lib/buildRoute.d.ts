import {
  PendingEffect,
  PendingEffectRegistry,
} from '@civ-clone/core-pending-effect';
import { StrategyNoteRegistry } from '@civ-clone/core-strategy/StrategyNoteRegistry';
import BuildingRoute from '../Busy/BuildingRoute';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
export declare const generateKey: (unit: Unit) => string;
export interface BuildRouteNote {
  player: Player;
  path: Tile[];
  action: string;
  working: {
    busy: string;
    effect: PendingEffect | null;
  } | null;
}
export type BuildRouteRegistries = {
  pendingEffectRegistry: PendingEffectRegistry;
  strategyNoteRegistry: StrategyNoteRegistry;
};
export declare const buildingRoute: () => BuildingRoute;
export declare const handBack: (
  unit: Unit,
  registries?: Partial<BuildRouteRegistries>
) => void;
export declare const buildRouteUnit: (
  unit: Unit,
  registries?: Partial<BuildRouteRegistries>
) => boolean;
export declare const startBuildingRoute: (
  unit: Unit,
  path: Tile[],
  action: string,
  registries?: Partial<BuildRouteRegistries>
) => void;
export default buildRouteUnit;

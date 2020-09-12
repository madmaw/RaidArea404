const MAX_COLLISION_STEPS = 3;
const MAX_COLLISIONS = 3;

type EngineState = {
  keyboardInputs: {[_: number]: number },
  litEntities?: LightEntity[],
}

function addEntity(world: World, entity: Entity) {
  const [rx, ry] = getRoom(entity);
  if (entity.collisionType < 0) {
    world.tiles[entity.pos[0]|0][entity.pos[1]|0].staticEntity = entity;
  }
  const room = world.rooms[rx][ry];
  room.entities.push(entity);
}

function lineOfSightAndLit(world: World, viewerPosition: Vector3, viewerDepth: number, targetPosition: Vector3, targetDepth: number) {
  return world.tiles[targetPosition[0]|0][targetPosition[1]|0].lit
      && lineOfSight(world, viewerPosition, viewerDepth, targetPosition, targetDepth);
}

function overlapsVertically(p1: Vector3, d1: number, p2: Vector3, d2: number) {
  const minZ1 = p1[2];
  const maxZ1 = minZ1 + d1;
  const minZ2 = p2[2];
  const maxZ2 = minZ2 + d2;
  return !(maxZ2 < minZ1 || maxZ1 < minZ2);
}

function lineOfSight(world: World, viewerPosition: Vector3, viewerDepth: number, targetPosition: Vector3, targetDepth: number, beamWidthDiv2: number = 0) {
  //const viewerTile = getTile(viewer.position);
  //const targetTile = getTile(target);

  const viewerZ = viewerPosition[2] + viewerDepth;
  const targetZ = targetPosition[2] + targetDepth;

  // is there anything in the way?
  const delta = vectorNSubtract(targetPosition, viewerPosition) as Vector2;
  const distance = vectorNLength(delta.slice(0, 2));
  if (distance > 7) {
    return 0;
  }
  let d = distance;
  const a = Math.atan2(delta[1], delta[0]);
  const sin = Math.sin(a);
  const cos = Math.cos(a);
  let blocked: boolean | 1 | 0 = 0;
  const altSin = Math.sin(a + CONST_PI_ON_2_1DP);
  const altCos = Math.cos(a + CONST_PI_ON_2_1DP);

  const dirs = beamWidthDiv2 ? [1, -1]: [0];

  while (d > 0 && !blocked) {
    blocked = dirs.some(dir => {
      const x = (viewerPosition[0] + cos * d + altCos * beamWidthDiv2*dir) | 0;
      const y = (viewerPosition[1] + sin * d + altSin * beamWidthDiv2*dir) | 0;
      const tileEntity = world.tiles[x][y];
      const eyeZ = viewerZ + (targetZ - viewerZ)*d/distance;
      return tileEntity.staticEntity && tileEntity.staticEntity.pos[2] + tileEntity.staticEntity.depthZ+ERROR_MARGIN > eyeZ && tileEntity.staticEntity.pos[2]-ERROR_MARGIN < eyeZ;
    });

    d-=.5;
  }
  return !blocked;
}

function getRoom(entity: Entity) {
  const rx = entity.pos[0]/CONST_ROOM_DIMENSION | 0;
  const ry = entity.pos[1]/CONST_ROOM_DIMENSION | 0;
  return [rx, ry];
}

function getTile(position: Vector2 | Vector3 | Vector4): Vector2 {
  return position.map(v => v | 0) as Vector2;
}

function getMidTile(position: Vector3 | Vector4): Vector3 {
  return position.slice(0, 2).map(v => (v | 0) + .5).concat(position[2]) as Vector3;
}

function getAdjoiningRooms(world: World, roomX: number, roomY: number): Vector2[] {
  const room = world.rooms[roomX][roomY];
  const adjoiningRooms = room.adjoiningRooms;
  return ADJOINS.flatMap<Vector2>(([dx, dy], i) => {
    const rx = roomX + dx;
    const ry = roomY + dy;
    const adjoin = 1 << i;
    return adjoiningRooms & adjoin
        ? [[rx, ry]]
        : [];
  }).concat([[roomX, roomY]]);
}

function iterateRooms<T>(world: World, rooms: Vector2[], cb: (room: Room) => T): T[] {
  return rooms.flatMap(([rx, ry]) => {
    if (rx >= 0 && rx<world.rooms.length && ry >= 0) {
      const room = world.rooms[rx][ry];
      if (room) {
        const r = cb(room);
        if (r) {
          return [r];
        }
      }
    }
    return [];
  });
}

function costWorld(
  world: World,
  entity: Entity,
  tx: number,
  ty: number,
  tileCostFactory: (tx, ty) => number = () => 1,
  costSoFar: number = tileCostFactory(tx, ty),
  costs: number[][] = make2DArray<number>(CONST_WORLD_TILES_ACROSS, CONST_WORLD_TILES_DOWN, () => 0),
): number[][] {
  if (tx >= 0 && ty >= 0 && tx < CONST_WORLD_TILES_ACROSS && ty < CONST_WORLD_TILES_DOWN) {
    const newCostSoFar = costSoFar + tileCostFactory(tx, ty);
    const tile = world.tiles[tx][ty];
    const existingCost = costs[tx][ty];
    if ((!tile.staticEntity || !overlapsVertically(entity.pos, entity.depthZ, tile.staticEntity.pos, tile.staticEntity.depthZ)) && (!existingCost || existingCost > newCostSoFar)) {
      costs[tx][ty] = newCostSoFar;
      CANONICAL_ADJOINS.map(([dx, dy]) => costWorld(world, entity, tx+dx, ty+dy, tileCostFactory, newCostSoFar, costs));
    }
  }
  return costs;
}

function pathTo(
  costs: number[][],
  x: number,
  y: number,
) : Vector2[] {
  const path: Vector2[] = [];
  let cost: number;
  let found: 0 | 1;
  do {
    cost = costs[x][y];
    found = 0;
    if (cost != 0) {
      path.unshift([x+.5, y+.5]);
      // find a smaller neighbour
      for(let [dx, dy] of CANONICAL_ADJOINS) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < CONST_WORLD_TILES_ACROSS && ny >= 0 && ny < CONST_WORLD_TILES_DOWN) {
          const ncost = costs[nx][ny];
          if (ncost && (ncost < cost || ncost == cost && Math.random() > .5)) {
            x = nx;
            y = ny;
            found = 1;
            break;
          }
        }
      }
    }
  } while (found);
  return path;
}


function iterateEntities(world: World, rooms: Vector2[], cb: (entity: Entity) => void) {
  const updatedEntityIds: {[_: number]: number} = {};
  iterateRooms(world, rooms, (room: Room) => {
    for (let i = room.entities.length; i; ) {
      i--;
      const entity = room.entities[i];
      if (!updatedEntityIds[entity.id]) {
        updatedEntityIds[entity.id] = 1;
        cb(entity);
      }
    }
  });
  world.alwaysUpdates.map(entity => {
    // presumably this list is unique
    if (!updatedEntityIds[entity.id]) {
      cb(entity);
    }
  });
}

function entityRooms(entity: Entity): [Vector2, Vector2] {
  const mins = entity.pos.map(v => (v - entity.collisionRadius)/CONST_ROOM_DIMENSION | 0) as Vector2;
  const maxs = entity.pos.map(v => ((v + entity.collisionRadius)/CONST_ROOM_DIMENSION + 1) | 0) as Vector2;
  return [mins, maxs];
}

const KEY_CODE_SHIFT = 16;
const KEY_CODE_LEFT = 37;
const KEY_CODE_RIGHT = 39;
const KEY_CODE_UP = 38;
const KEY_CODE_DOWN = 40;


function updater(
  world: World,
  state: EngineState,
  delta: number
) {
  const dirtyLitPoints: Vector2[] = [];
  const litEntities: LightEntity[] = [];
  const originalWorldAge = world.age;
  world.age += delta;
  const [roomX, roomY] = getRoom(world.player);
  const cameraPosition = world.rooms[roomX][roomY].cameraPosition;
  const rooms = getAdjoiningRooms(world, roomX, roomY)
  iterateEntities(world, rooms, (entity: Entity) => {
    let activeActions: {
      actionId: number,
      frameDurationMultiplier?: number,
      soundMultiplier?: number,
      onComplete?: () => void,
    }[] = [];
    let activating: boolean | number;

    switch (entity.intelligence) {
      case INTELLIGENCE_USER_CONTROLLED:
        if (Math.abs(entity.deadness || 0) < CONST_MAX_DEADNESS) {
          const keyboardInputs = state.keyboardInputs;
          const turn = (keyboardInputs[KEY_CODE_RIGHT]|| 0) - (keyboardInputs[KEY_CODE_LEFT] || 0);
          entity.zRotation -= turn * delta / 400;
          const forward = (keyboardInputs[KEY_CODE_UP]|| 0) - (keyboardInputs[KEY_CODE_DOWN] || 0);
          let crouch = keyboardInputs[83]; // s
          activating = keyboardInputs[65];
          const choking = keyboardInputs[67] || entity.lastChoked > world.age - 99;
          if (choking) {
            activeActions.push({
              actionId: ACTION_CHOKING,
              frameDurationMultiplier: 1 + entity.deadness * 2 / CONST_MAX_DEADNESS,
              soundMultiplier: 1 + entity.deadness / CONST_MAX_DEADNESS,
            });
            crouch = 0;
            entity.deadness = Math.min(CONST_MAX_DEADNESS, (entity.deadness || 0) + delta);
            // exit tiles
          } else if(entity.pos[0] > 25 && entity.pos[1] > 5 && entity.pos[1] < 9) {
            entity.deadness = Math.max(-CONST_MAX_DEADNESS, (entity.deadness || 0) - delta);
          } else {
            entity.deadness *= Math.pow(.99, delta);
          }
          const run = keyboardInputs[KEY_CODE_SHIFT] && forward > 0 && !choking && !crouch; // shift
          const choker = keyboardInputs[66];
          if (choker) {
            activeActions.push({
              actionId: ACTION_CHOKER,
            });
          }
          if (!crouch && forward || turn) {
            activeActions.push({
              actionId: run ? ACTION_RUN : ACTION_WALK
            });
          }
          if (crouch) {
            activeActions.push({
              actionId: ACTION_CROUCH,
            });
          }
          if (run) {
            // running alerts the monster
            world.monster.lastDetectedPlayer = entity.pos.slice() as Vector3;
            if (!world.monster.anger) {
              world.monster.anger = 1;
            }
          }
          const v = crouch ? 0 : (forward * (run ? 2 : 1)) / 899;

          const targetVelocity = [
            Math.cos(entity.zRotation) * v,
            Math.sin(entity.zRotation) * v,
            crouch ? -1/350 : 1/350
          ];
          entity.velocity = entity.velocity.map((v, i) => v + (targetVelocity[i] - v) * delta / 99) as Vector3;
        }
        break;
      case INTELLIGENCE_ARTIFICIAL_SHADOW_MONSTER:
        const los = lineOfSight(world, getMidTile(world.player.pos), world.player.depthZ, getMidTile(entity.pos), entity.depthZ);
        const canSeePlayer = los;
        const playerCanSee = los;
        const playerTile = getTile(world.player.pos);
        const [px, py] = playerTile;
        const [ex, ey] = getTile(entity.pos);
        const playerIsInLight = world.tiles[px][py].lit;
        const entityIsInLight = world.tiles[ex][ey].lit;
        if ((!entityIsInLight || !playerCanSee) && entity.anger < 0) {
          entity.steps = null;
          entity.anger = 0;
        }
        if (canSeePlayer) {
          entity.lastDetectedPlayer = world.player.pos.slice() as Vector3;
          if (!entity.anger) {
            entity.anger = 1;
          }
        }

        // avoid lit squares if we can
        // experiment since
        const lightCost = Math.random() * 9;
        let tileCostFactory: (x: number, y: number) => number = (x, y) => 1 + (world.tiles[x][y].lit ? lightCost : 0);
        if (entityIsInLight && playerCanSee && entity.anger >= 0) {
          // Is the next step still safe? Maybe we can just go there?
          const nextStep = entity.steps && entity.steps[0];
          if (!nextStep
            || lineOfSightAndLit(world, getMidTile(world.player.pos), world.player.depthZ, nextStep.concat(0) as Vector3, entity.depthZ)
            || vectorNLength(vectorNSubtract(nextStep, entity.pos))>3
          ) {
            // run away! Avoid light and player!
            entity.steps = null;
            entity.anger = -1;
            tileCostFactory = (x, y) => 1 + (world.tiles[x][y].lit ? 9 : 0) + Math.max(1, CONST_MAX_VIEW_DISTANCE-vectorNLength(vectorNSubtract([x, y], world.player.pos)));
            // remove any animations that might be running
            entity.activeAnimations = (entity.activeAnimations || []).filter(a => a.actionId != ACTION_ACTIVATE);
          }
        }
        let targetPoint: Vector2;
        let targetAngle: number;

        const frustrated = entity.waitDuration > 999;

        const potentialSwitchEntities: Entity[] = world.switches
            // only turn off lights/open doors and only do it if the player has done it first
            .filter(s => world.activatedCircuits[s.circuit]);

        if (
          // there's no path
          !entity.steps || !entity.steps.length
          // we've been waiting too long
          || frustrated
          // we can see the player and they're attackable and we don't see to be heading toward them already
          || canSeePlayer && !playerIsInLight && ((entity.steps[entity.steps.length-1].some((v, i) => (v | 0) != playerTile[i])))
        ) {
          entity.waitDuration = 0;
          // attempt to find something on the map
          if (!targetPoint) {
            // w is attractiveness
            const potentialTargetPoints: Vector4[] = potentialSwitchEntities.map(s => s.pos.concat(3) as Vector4);
            if (canSeePlayer) {
              potentialTargetPoints.push(
                world.player.pos.concat(
                  entity.anger < 0
                      ? -1
                      : playerIsInLight
                          ? 2
                          : 4
                ) as Vector4
              );
            }
            if (entity.anger >= 0) {
              if (entity.lastDetectedPlayer && !potentialTargetPoints.length) {
                potentialTargetPoints.push(entity.lastDetectedPlayer.concat(2) as Vector4);
              }
            }
            let tx = ex;
            let ty = ey;
            const t = world.tiles[ex][ey].staticEntity;
            if (t && overlapsVertically(t.pos, t.depthZ, entity.pos, entity.depthZ)) {
              // we're standing the same spot as a static entity (probably a closed door)
              // path from somewhere nearby and see if we can unjam ourselves
              tx += (Math.random() * 3 | 0) - 1;
              ty += (Math.random() * 3 | 0) - 1;
            }

            const costs = costWorld(world, entity, tx, ty, tileCostFactory);
            const reachableTargets = potentialTargetPoints
                // only use valid targets
                .filter(p => {
                  const [x, y] = getTile(p );
                  const cost = costs[x][y];
                  return cost;
                });

            const preferredTargets = reachableTargets
                // only use valid targets
                .filter(p => {
                  return (entity.anger >= 0 || !lineOfSightAndLit(world, getMidTile(world.player.pos), world.player.depthZ, getMidTile(p), entity.depthZ));
                })
                // sort by cheapness/appeal
                .sort((p1, p2) => {
                  const [x1, y1] = getTile(p1);
                  const [x2, y2] = getTile(p2);
                  return (costs[x1][y1]||CONST_LARGE_NUMBER)/p1[3] - (costs[x2][y2]||CONST_LARGE_NUMBER)/p2[3];
                });
                //.filter(p => vectorNDotProduct(vectorNSubtract(p, entity.position), vectorNSubtract(p, world.player.position))>0);

            // upgrade to angry if there are any valid, reachable targets
            if (reachableTargets.length && !entity.anger) {
              entity.anger = 1;
            }
            // only wander around if we don't already have a path we're trying to follow or we have something with negative appeal (the player in the light)
            // or we are fleeing
            if ((!preferredTargets.length || preferredTargets[0][3]<0) && (!entity.steps || !entity.steps.length) || entity.anger < 0) {
              // find the cheapest dark/furthest place we can get to
              let bestScore: number;
              let bestPoint: Vector4;
              for (let x=0; x<CONST_WORLD_TILES_ACROSS; x++) {
                for (let y=0; y<CONST_WORLD_TILES_DOWN; y++) {
                  const d = vectorNLength(vectorNSubtract([x, y], entity.pos));
                  if (d > 1) {
                    let score = entity.anger < 0
                        ? world.tiles[x][y].lit
                            ? 0
                            : costs[x][y]
                        : costs[x][y]/(d*d)
                    if (score && (!bestScore || bestScore > score)) {
                      bestScore = score;
                      bestPoint = [x, y, 0, 1];
                    }
                  }
                }
              }
              // fleeing or seeking
              if (bestPoint) {
                if (entity.anger > 0) {
                  entity.anger = 0;
                }
                // we can go somewhere safe
                preferredTargets.unshift(bestPoint)
              }
            }
            // if there's nowhere safe, just attack!
            const targets = preferredTargets.length ? preferredTargets : reachableTargets;
            const targetPosition = targets[frustrated ? (Math.random() * targets.length) | 0 : 0];
            if (targetPosition) {
              const [tx, ty] = getTile(targetPosition);
              entity.steps = pathTo(costs, tx, ty);
            } else if (frustrated){
              // throw away our path, it's making us angry
              entity.steps = null;
            }
          }
        }

        // attempt to follow path
        if (!targetPoint) {
          let i = 0;
          let targetPointValid: boolean | number = 1;
          if (entity.steps && entity.steps.length > 0 && !targetPoint) {
            // attempt to follow path
            // find the furthest point we can walk directly to
            while (i < entity.steps.length
                && lineOfSight(world, entity.pos, 0, entity.steps[i].concat(0) as Vector3, 0, entity.collisionRadius)
                // don't want to go too far (slightly more than sqrt 2, which is one diagonal)
                && vectorNLength(vectorNSubtract(entity.steps[i], entity.pos)) < 1.5
            ) {
              const losAndLit = lineOfSightAndLit(world, getMidTile(world.player.pos), world.player.depthZ, entity.steps[i].concat(0) as Vector3, entity.depthZ);
              if (!(targetPointValid = entity.anger < 0 && losAndLit || entity.anger >= 0 && !losAndLit)) {
                break;
              }
              i++;
            }
            const end = Math.min(entity.steps.length - 1, i-(entity.anger < 0 && !targetPointValid ? 0 : 1));
            // for (let j=0; j<end; j++) {
            //   console.log('removing step', entity.position, entity.path[j], lineOfSight(world,  entity.position, 0, entity.path[j].concat(0) as Vector3, 0, entity.collisionRadius));
            // }
            // only keep the last point we can reach
            if (end > 0) {
              entity.steps.splice(0, end);
              entity.waitDuration = 0;
            }
            targetPoint = entity.steps[0];
          }
          if (entity.anger >= 0 && !targetPointValid && !i) {
            // our path is broken
            targetPoint = null;
            entity.steps = null;
          }
        }

        // attempt to interact with something nearby
        if ((!entity.steps || entity.steps.length < 2) && !frustrated) {
          const potentialTargetEntities: Entity[] = potentialSwitchEntities
              .concat(world.player)
              // no target point indicates we are backed into corner so will ignore lighting and player los
              // .filter(e =>
              //     !targetPoint
              //     || !lineOfSight(world, world.player.pos, world.player.depthZ, e.pos, e.depthZ)
              //         && !world.tiles[e.pos[0]|0][e.pos[1]|0].lit)
              .sort((e1, e2) =>
                  vectorNLength(vectorNSubtract(e1.pos.slice(0, 2), entity.pos)) - vectorNLength(vectorNSubtract(e2.pos.slice(0, 2), entity.pos))
              );
          const potentialTargetEntity = potentialTargetEntities[0];
          if (potentialTargetEntity) {
            const relativePosition = vectorNSubtract(potentialTargetEntity.pos.slice(0, 2), entity.pos);
            const relativeDistance = vectorNLength(relativePosition);
            if (relativeDistance < CONST_MONSTER_FREE_MOVEMENT_RADIUS) {

              if (relativeDistance < entity.collisionRadius + potentialTargetEntity.collisionRadius) {
                switch (potentialTargetEntity.intelligence) {
                  case INTELLIGENCE_USER_CONTROLLED:
                    // choke it
                    activeActions.push({
                      actionId: ACTION_CHOKER,
                      onComplete: () => {
                        world.player.lastChoked = world.age;
                      }
                    });
                    break;
                  case INTELLIGENCE_ARTIFICIAL_SWITCH:
                    // flip it
                    activating = 1;
                    break;
                }
              }
              // move toward the optimal position
              targetAngle = Math.atan2(relativePosition[1], relativePosition[0]);
              targetPoint = [
                potentialTargetEntity.pos[0] - Math.cos(targetAngle) * entity.collisionRadius,
                potentialTargetEntity.pos[1] - Math.sin(targetAngle) * entity.collisionRadius,
              ]
            }
          }
        }

        if (targetPoint) {
          let targetLateralVelocity: number;
          const targetDelta = vectorNSubtract(targetPoint, entity.pos);
          const targetDistance = vectorNLength(targetDelta) - .1;
          targetLateralVelocity = delta
              ? Math.min((targetDistance / delta), entity.anger < 0 ? .01 : .001 + entity.anger * .003)
              : 0;
          if (targetLateralVelocity < ERROR_MARGIN) {
            targetLateralVelocity = 0;
            if (entity.steps?.length < 2) {
              // we're here
              if (entity.steps && entity.steps.length && entity.lastDetectedPlayer && vectorNLength(vectorNSubtract(entity.steps[0], entity.lastDetectedPlayer))<1) {
                entity.lastDetectedPlayer = null;
              }
              entity.steps = null;
            }
          }
          if (targetLateralVelocity) {
            activeActions.push({
              actionId: entity.anger ? ACTION_RUN : ACTION_WALK
            });
            if (targetAngle == null) {
              // rotate to direction of travel
              const targetNormal = vectorNSubtract(targetPoint, entity.pos);
              targetAngle = Math.atan2(targetNormal[1], targetNormal[0]);
            }
          } else if (targetAngle == null) {
            // look at the camera
            const cameraDelta = vectorNSubtract(cameraPosition, entity.pos);
            targetAngle = Math.atan2(cameraDelta[1], cameraDelta[0]);
          }

          entity.zRotation = targetAngle;

          const targetVelocityAngle = Math.atan2(targetDelta[1], targetDelta[0]);

          const targetVelocity: Vector3 = [
            Math.cos(targetVelocityAngle) * targetLateralVelocity,
            Math.sin(targetVelocityAngle) * targetLateralVelocity,
            entity.velocity[2]
          ];
          entity.velocity = targetVelocity;
        } else {
          entity.velocity = [0, 0, 0];
        }
        // no matter what we do, start getting impatient
        entity.waitDuration += delta;
        break;
      case INTELLIGENCE_ARTIFICIAL_DOOR:
        // xor
        const closed = world.activatedCircuits[entity.circuit] ? !entity.reversed : entity.reversed;
        const currentVelocityZ = entity.velocity[2];
        if (
          !closed && entity.zPositionRange[1] - entity.pos[2] < ERROR_MARGIN ||
          closed && entity.pos[2] - entity.zPositionRange[0] < ERROR_MARGIN
        ) {
          // it's fully open/closed
          entity.velocity = [0, 0, 0];
          if (Math.abs(currentVelocityZ) > ERROR_MARGIN) {
            dirtyLitPoints.push(entity.pos);
          }
        } else {
          entity.velocity = [0, 0, closed ? -CONST_DOOR_VELOCITY : CONST_DOOR_VELOCITY];
          // did we crush anything? We're a nice door, open back up
          if (closed && entity.lastCollision >= world.age - CONST_MAX_DELTA) {
            world.activatedCircuits[entity.circuit] = entity.reversed ? world.age : 0;
          }
        }
        break;
      // case INTELLIGENCE_ARTIFICIAL_CAMERA:
      //   entity.zRotation = Math.atan2(world.player.position[1] - entity.position[1], world.player.position[0] - entity.position[0]);
      //   break;
      case INTELLIGENCE_ARTIFICIAL_LIGHT:
        const litAt = world.activatedCircuits[entity.circuit] || 0;

        if (litAt != entity.litAt) {
          entity.litAt = litAt;
          dirtyLitPoints.push(entity.pos);
        }
        if (FLAG_FLICKERING_LIGHTS) {
          const litAge = world.age - litAt;
          const lightIntensity = entity.circuit == 9
              ? 2
              : litAt
                  ? Math.max(0, Math.min(1, Math.pow(Math.sin(world.age/9), 4)+litAge/(litAge+999) - 1.2*((entity.flicker>>((litAge/199|0)%32))&1)))
                  : 0;
          entity.lightIntensity = lightIntensity;
        } else {
          entity.lightIntensity = litAt ? 1 : 0;
        }
        entity.palette[0] = [.5+entity.lightIntensity/2, .5+entity.lightIntensity/2, .5+entity.lightIntensity/2, 1];
        if (litAt) {
          litEntities.push(entity);
        };
        break;
      case INTELLIGENCE_ARTIFICIAL_SWITCH:
        if (entity.circuit < CONST_DOOR_SWITCH_CUT_OFF) {
          if (world.activatedCircuits[entity.circuit]) {
            entity.palette.splice(1, 2, COLOR_GREY, COLOR_RED);
          } else {
            entity.palette.splice(1, 2, COLOR_GREEN, COLOR_GREY);
          }
        } else {
          // light switch
          if (world.activatedCircuits[entity.circuit]) {
            entity.palette[2] = COLOR_GREEN;
          } else {
            entity.palette[2] = COLOR_RED;
          }
        }
        break;
    }

    if (entity.collisionType > 0) {
      // find all the rooms that overlap with this entity
      const startingRooms = entityRooms(entity);

      let collisions = 0;
      let timeRemaining = delta;
      let entityOverlappedWithSomethingStatic: boolean | number | undefined;
      do {
        let minCollisionTime = timeRemaining + 1;
        let minCollisionNormalAngle: number;
        let minCollisionEntity: Entity | 0 = 0;
        entityOverlappedWithSomethingStatic = 0;

        // NOTE: we're not really interested in the z velocity, but less code this way
        const effectiveRadius = entity.collisionRadius + Math.max(...entity.velocity.map(v => Math.abs(v * timeRemaining))) + ERROR_MARGIN;
        const [minRx, minRy] = entity.pos.map(p => Math.max(0, ((p - effectiveRadius)/CONST_ROOM_DIMENSION) | 0));
        const [maxRx, maxRy] = entity.pos.map((p, i) => (Math.min(CONST_WORLD_BOUNDS[i] || 0) - 1, ((p + effectiveRadius)/CONST_ROOM_DIMENSION) | 0));
        //const targetPosition = entity.position.map((p, i) => p + entity.velocity[i] * timeRemaining) as Vector3;

        for (let rx=minRx; rx<=maxRx; rx++) {
          for (let ry=minRy; ry<=maxRy; ry++) {
            const r = world.rooms[rx][ry];
            if (r) {
              // does the new position overlap with anything?
              r.entities.map(compare => {

                const collisionSteps = compare == entity || !compare.collisionType
                    ? 0
                    : compare.collisionType < 0
                      // solid collisions
                      ? MAX_COLLISION_STEPS
                      // sensor or dynamic
                      : 1;
                // try and find if/when it overlapped
                let maxTime = timeRemaining * 2; // start by multiplying by 2, so when we halve it below, we check the maxmium time first
                let minTime = 0;
                let collisionNormal: Vector2;
                let compareOverlapedAtLeastOnce: number | undefined;
                // always expect a collision on the first iteration, otherwise there is no collision to resolve
                for (let i=0; i<collisionSteps && (!i || compareOverlapedAtLeastOnce); i++) {
                  const testTime = (minTime + maxTime)/2;
                  const testPosition = entity.pos.map((p, i) => p + entity.velocity[i] * testTime) as Vector3;
                  const d = vectorNLength(vectorNSubtract(testPosition.slice(0, 2), compare.pos));
                  let compareOverlaps = 0;
                  if (d < compare.collisionRadius + entity.collisionRadius && overlapsVertically(compare.pos, compare.depthZ, entity.pos, entity.depthZ)) {
                    if (compare.perimeter) {
                      const effectivePerimieter = compare.perimeter
                          .map(v => vector2Rotate(compare.zRotation, v).map((v, i) => v + compare.pos[i]) as Vector2);
                      const collisionClosestPoint = vector2PolyEdgeOverlapsCircle(effectivePerimieter, entity.collisionRadius, testPosition);
                      if (collisionClosestPoint) {
                        compareOverlaps = 1;
                        //collisionNormal = Math.atan2(entity.position[1] - collisionClosestPoint[1], entity.position[0] - collisionClosestPoint[0]);
                        collisionNormal = vectorNSubtract(testPosition, collisionClosestPoint.concat(0)) as Vector2;
                      }
                    } else {
                      compareOverlaps = 1;
                      collisionNormal = vectorNSubtract(testPosition, compare.pos) as Vector2;
                    }
                  }
                  if (compareOverlaps) {
                    maxTime = testTime;
                    compareOverlapedAtLeastOnce = 1;
                  } else {
                    minTime = testTime;
                  }
                }
                const dv = vectorNSubtract(entity.velocity, compare.velocity);
                if (compareOverlapedAtLeastOnce) {
                  if (compare.collisionType < 0) {
                    if (minTime < minCollisionTime && vectorNDotProduct(collisionNormal.slice(0, 2), dv) < 0 && dv.some(v => Math.abs(v) > ERROR_MARGIN)) {
                      entityOverlappedWithSomethingStatic = 1;
                      minCollisionEntity = compare;
                      minCollisionNormalAngle = Math.atan2(collisionNormal[1], collisionNormal[0]);
                      minCollisionTime = minTime - ERROR_MARGIN;
                    }
                  } else {
                    // handle it in place
                    // TODO ensure that these interactions only happen once per entity combination, per update
                    if (activating && compare.intelligence == INTELLIGENCE_ARTIFICIAL_SWITCH) {
                      activeActions.push({
                        actionId: ACTION_ACTIVATE,
                        onComplete: () => {
                          world.activatedCircuits[compare.circuit] = world.activatedCircuits[compare.circuit] ? 0 : world.age;
                        }
                      });
                    }
                  }
                }
              });
            }
          }
        }

        entity.pos = entity.pos.map((p, i) => p + entity.velocity[i] * minCollisionTime) as Vector3;
        // check the floor
        if (entity.zPositionRange) {
          entity.pos[2] = Math.min(entity.zPositionRange[1], Math.max(entity.zPositionRange[0], entity.pos[2]));
        }

        if (minCollisionEntity) {
          const v = vector2Rotate(-minCollisionNormalAngle, entity.velocity);
          // not sure why this cast is required?
          entity.lastCollision = (minCollisionEntity as any as Entity).lastCollision = world.age;
          v[0] *= -((entity.restitution || 0.001) + ((minCollisionEntity as any as Entity).restitution || 0.001));
          entity.velocity = vector2Rotate(minCollisionNormalAngle, v) as Vector3;
          timeRemaining -= minCollisionTime;
          collisions++;
          if (entity.intelligence == INTELLIGENCE_ARTIFICIAL_SHADOW_MONSTER) {
            // should never collide with something, if we do, then increment the wait timer, multiple collisions will result in a reset of the path
            entity.waitDuration += delta;
          }
        }
      } while (entityOverlappedWithSomethingStatic && timeRemaining > ERROR_MARGIN && collisions < MAX_COLLISIONS);

      // check we haven't moved into different room(s)
      const endingRooms = entityRooms(entity);
      for (let x=startingRooms[0][0]; x<=startingRooms[1][0]; x++) {
        for (let y=startingRooms[0][1]; y<=startingRooms[1][1]; y++) {
          if ((endingRooms[0][0]>x || endingRooms[1][0]<x || endingRooms[1][0]>y || endingRooms[1][1]<y) && world.rooms[x] && world.rooms[x][y]) {
            const index = world.rooms[x][y].entities.indexOf(entity);
            if (index>=0) {
              world.rooms[x][y].entities.splice(index, 1);
            }
          }
        }
      }
      for (let x=endingRooms[0][0]; x<=endingRooms[1][0]; x++) {
        for (let y=endingRooms[0][1]; y<=endingRooms[1][1]; y++) {
          if ((startingRooms[0][0]>x || startingRooms[1][0]<x || startingRooms[1][0]>y || startingRooms[1][1]<y) && world.rooms[x] && world.rooms[x][y]) {
            world.rooms[x][y].entities.push(entity);
          }
        }
      }
    } else {
      // it can still move, it just won't collide with anything or change rooms
      entity.pos = entity.pos.map((p, i) => p + entity.velocity[i] * delta) as Vector3;
      // check the floor
      if (entity.zPositionRange) {
        entity.pos[2] = Math.min(entity.zPositionRange[1], Math.max(entity.zPositionRange[0], entity.pos[2]));
      }
    }

    activeActions.map(({ actionId, onComplete }) => {
      const animation = entity.animations[actionId];
      if (animation) {
        const existing = entity.activeAnimations.find(a => a.actionId == actionId);
        if (existing) {
          existing.renewalWorldAge = world.age;
        } else {
          entity.activeAnimations.push({
            actionId,
            startWorldAge: world.age,
            onComplete,
          });
        }
      }
    });

    // remove any animations that don't have active actions or are completed
    entity.activeAnimations = (entity.activeAnimations || [])
        .filter(activeAnimation => {
          const animation = entity.animations[activeAnimation.actionId];
          const action = activeActions.find(activeAction => activeAction.actionId == activeAnimation.actionId);
          const age = world.age - activeAnimation.startWorldAge;
          const loopTime = animation.keyFrames.length * animation.frameDuration * (action && action.frameDurationMultiplier || 1);
          const loops = (age / loopTime) | 0;
          let soundLoopTime = animation.soundLoopDuration || loopTime;
          const remove = !action && animation.repeating || loops && (!animation.repeating || !action);
          (remove && !animation.repeating || loops)
              && activeAnimation.onComplete
              && activeAnimation.onComplete();
          (age/soundLoopTime | 0)
              && (age%soundLoopTime) < delta
              && animation.sound
              && animation.sound(vectorNSubtract(cameraPosition, entity.pos), (action && action.soundMultiplier || 1));
          return !remove;
        })
        .sort((a1, a2) => a1.actionId - a2.actionId);

    // apply the animations to the body parts
    const partTransforms: {[_: number]: Matrix4} = entity.partTransforms = {};
    const bodyPartLastActiveRotation: {[_: number]: LastActiveRotation} = {};
    entity.bodyPartLastActiveRotation = entity.bodyPartLastActiveRotation || {};
    entity.animations = entity.animations || [];

    entity.activeAnimations.map(activeAnimation => {
      const animation = entity.animations[activeAnimation.actionId];
      if (animation) {
        const animationDuration = originalWorldAge - activeAnimation.startWorldAge;
        const keyFrameIndex = (animationDuration / animation.frameDuration) | 0;
        const nextKeyFrameIndex = ((animationDuration + delta) / animation.frameDuration) | 0;
        if (keyFrameIndex < animation.keyFrames.length || activeAnimation.renewalWorldAge == world.age) {
          const targetKeyFrame = animation.keyFrames[keyFrameIndex % animation.keyFrames.length];
          const frameStartTime = activeAnimation.startWorldAge + animation.frameDuration * keyFrameIndex;
          const d = world.age - frameStartTime;
          const p = d / animation.frameDuration;
          for (let partId in targetKeyFrame) {
            const lastKeyFrame = entity.bodyPartLastActiveRotation[partId];
            const previousRotation = lastKeyFrame && (lastKeyFrame.actionId == activeAnimation.actionId && activeAnimation.startWorldAge != world.age
                ? lastKeyFrame.originRotation
                : lastKeyFrame.angles
            ) || [0, 0, 0];

            const targetRotation = targetKeyFrame[partId];
            const rotation = previousRotation.map((v, i) => v + (targetRotation[i] - v) * p) as Vector3;
            bodyPartLastActiveRotation[partId] = {
              actionId: activeAnimation.actionId,
              originRotation: nextKeyFrameIndex == keyFrameIndex ? previousRotation : targetRotation,
              angles: rotation,
              lastAnimatedFrameDuration: animation.frameDuration,
              lastAnimatedTime: world.age,
              lastAnimatedRotation: rotation,
            };
            partTransforms[partId] = matrix4RotateInOrder(...rotation);
          }
        }
      }
    });
    entity.bodyPartLastActiveRotation = {...entity.bodyPartLastActiveRotation, ...bodyPartLastActiveRotation};

    for (let partId in entity.bodyPartLastActiveRotation) {
      if (!partTransforms[partId]) {
        const lastActiveRotation = entity.bodyPartLastActiveRotation[partId];
        const d = world.age - lastActiveRotation.lastAnimatedTime;
        let p = 1 - d/lastActiveRotation.lastAnimatedFrameDuration;
        if (p < 0) {
          p = 0;
          // the action is done and will not continue
          lastActiveRotation.actionId = 0;
        }
        const rotation = lastActiveRotation.lastAnimatedRotation.map(v => v * p) as Vector3;
        lastActiveRotation.angles = rotation;
        lastActiveRotation.originRotation = rotation;
        partTransforms[partId] = matrix4RotateInOrder(...rotation);
      }
    }
  });

  if (dirtyLitPoints.length) {
    world.tiles.map((a, x) => {
      a.map((tile, y) => {
        const p = [x+.5, y+.5, 0] as Vector3;
        if (dirtyLitPoints.some(dirtyLitPoint => vectorNLength(vectorNSubtract(p, dirtyLitPoint)) < CONST_MAX_LIGHT_ACTIVATION_DISTANCE)) {
          tile.lit = litEntities.some(entity => {
            const d = vectorNLength(vectorNSubtract(p.slice(0, 2), entity.pos));
            return d < entity.pos[2] * entity.lightTanFOVOn2 && lineOfSight(world, entity.pos, 0, p, 1);
          });
        }
      })
    });
  }

  state.litEntities = litEntities;
}

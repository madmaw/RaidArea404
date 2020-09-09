const MAX_COLLISION_STEPS = 3;
const MAX_COLLISIONS = 3;

type EngineState = {
  keyboardInputs: {[_: number]: number },
  litEntities?: LightEntity[],
}

function addEntity(world: World, entity: Entity) {
  const [rx, ry] = getRoom(entity);
  if (entity.collisionType < 0) {
    world.tiles[entity.position[0]|0][entity.position[1]|0].staticEntity = entity;
  }
  const room = world.rooms[rx][ry];
  room.entities.push(entity);
}

function lineOfSightAndLit(world: World, viewer: Entity, target: Vector3, targetDepth: number) {
  return world.tiles[target[0]|0][target[1]|0].lightSources && lineOfSight(world, viewer, target, targetDepth);
}

function lineOfSight(world: World, viewer: Entity, target: Vector3, targetDepth: number, beamWidth: number = 0) {
  const viewerTile = getTile(viewer.position);
  const targetTile = getTile(target);

  const viewerZ = viewer.position[2] + viewer.depth;
  const targetZ = target[2] + targetDepth;

  // is there anything in the way?
  const delta = vectorNSubtract(targetTile, viewerTile) as Vector2;
  const distance = vectorNLength(delta.slice(0, 2));
  let d = distance;
  const a = Math.atan2(delta[1], delta[0]);
  const sin = Math.sin(a);
  const cos = Math.cos(a);
  let blocked = false;
  const altSin = Math.sin(a + Math.PI/2);
  const altCos = Math.cos(a + Math.PI/2);

  const dirs = beamWidth ? [1, -1]: [0];

  while (d > 0 && !blocked) {
    blocked = dirs.some(dir => {
      const x = (viewerTile[0]+.5 + cos * d + altCos * beamWidth*dir) | 0;
      const y = (viewerTile[1]+.5 + sin * d + altSin * beamWidth*dir) | 0;
      const tileEntity = world.tiles[x][y];
      const eyeZ = viewerZ + (targetZ - viewerZ)*d/distance;
      return tileEntity.staticEntity && tileEntity.staticEntity.position[2] + tileEntity.staticEntity.depth > eyeZ && tileEntity.staticEntity.position[2] < eyeZ;
    });

    d-=.7;
  }
  return !blocked;
}

function getRoom(entity: Entity) {
  const rx = entity.position[0]/CONST_ROOM_DIMENSION | 0;
  const ry = entity.position[1]/CONST_ROOM_DIMENSION | 0;
  return [rx, ry];
}

function getTile(position: Vector2): Vector2 {
  return position.map(v => v | 0) as Vector2;
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
    if (!tile.staticEntity && (!existingCost || existingCost > newCostSoFar)) {
      costs[tx][ty] = newCostSoFar;
      CANONICAL_ADJOINS.map(([dx, dy]) => costWorld(world, tx+dx, ty+dy, tileCostFactory, newCostSoFar, costs));
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
          if (ncost && ncost < cost) {
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
  // monster is special
  if (!updatedEntityIds[world.monster.id]) {
    cb(world.monster);
  }
}

function entityRooms(entity: Entity): [Vector2, Vector2] {
  const mins = entity.position.map(v => (v - entity.collisionRadius)/CONST_ROOM_DIMENSION | 0) as Vector2;
  const maxs = entity.position.map(v => ((v + entity.collisionRadius)/CONST_ROOM_DIMENSION + 1) | 0) as Vector2;
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
  const litEntities = [];
  const originalWorldAge = world.age;
  world.age += delta;
  const [roomX, roomY] = getRoom(world.player);
  const rooms = getAdjoiningRooms(world, roomX, roomY)
  iterateEntities(world, rooms, (entity: Entity) => {
    let activeActions: {
      actionId: number,
      onComplete?: () => void,
    }[] = [];
    let activating: 0 | undefined | (() => void);

    switch (entity.intelligence) {
      case INTELLIGENCE_USER_CONTROLLED:

        //player.position[0] += ((keys[39]|| 0) - (keys[37] || 0)) * diff / 400;
        //player.position[1] += ((keys[38]|| 0) - (keys[40] || 0)) * diff / 400;
        const keyboardInputs = state.keyboardInputs;
        const turn = (keyboardInputs[KEY_CODE_RIGHT]|| 0) - (keyboardInputs[KEY_CODE_LEFT] || 0);
        entity.zRotation -= turn * delta / 400;
        const forward = (keyboardInputs[KEY_CODE_UP]|| 0) - (keyboardInputs[KEY_CODE_DOWN] || 0);
        const jump = keyboardInputs[32] || 0; // space
        activating = keyboardInputs[65] && (() => {});
        const choking = keyboardInputs[67] || entity.lastChoked > world.age - 400;
        if (choking) {
          activeActions.push({
            actionId: ACTION_CHOKING
          });
        }
        const run = keyboardInputs[KEY_CODE_SHIFT] && forward > 0 && !choking; // shift
        const choker = keyboardInputs[66];
        if (choker) {
          activeActions.push({
            actionId: ACTION_CHOKER,
          });
        }
        if (forward || turn) {
          activeActions.push({
            actionId: run ? ACTION_RUN : ACTION_WALK
          });
        }
        const v = (forward * (run ? 2 : 1)) / 899;

        const targetVelocity = [
          Math.cos(entity.zRotation) * v,
          Math.sin(entity.zRotation) * v,
          entity.velocity[2] + jump / 99
        ];
        entity.velocity = entity.velocity.map((v, i) => v + (targetVelocity[i] - v) * delta / 99) as Vector3;
        break;
      case INTELLIGENCE_ARTIFICIAL_SHADOW_MONSTER:
        const los = lineOfSight(world, world.player, entity.position, entity.depth);
        const canSeePlayer = los;
        const playerCanSee = los;
        const [px, py] = getTile(world.player.position);
        const [ex, ey] = getTile(entity.position);
        const playerIsInLight = world.tiles[px][py].lightSources;
        const entityIsInLight = world.tiles[ex][ey].lightSources;
        if (!entityIsInLight || !playerCanSee) {
          if (entity.fleeing) {
            entity.path = null;
            entity.fleeing = 0;
          }
        }

        let tileCostFactory: (x: number, y: number) => number;
        if (entityIsInLight && playerCanSee && !entity.fleeing) {
          // Is the next step still safe? Maybe we can just go there?
          const nextStep = entity.path && entity.path[0];
          if (!nextStep
            || lineOfSightAndLit(world, world.player, nextStep.concat(0) as Vector3, entity.depth)
            || vectorNLength(vectorNSubtract(nextStep, entity.position))>.5
          ) {
            // run away! Avoid light and player!
            entity.path = null;
            entity.fleeing = 1;
            tileCostFactory = (x, y) => 1 + Math.max(1, world.tiles[x][y].lightSources) * 9 + Math.max(1, CONST_MAX_VIEW_DISTANCE-vectorNLength(vectorNSubtract([x, y], world.player.position)));
            // remove any animations that might be running
            entity.activeAnimations = (entity.activeAnimations || []).filter(a => a.actionId != ACTION_ACTIVATE);
          }
        }
        entity.active = canSeePlayer || entity.active;
        if (entity.active) {
          let targetPoint: Vector2;
          let targetAngle: number;

          if (!entity.path || !entity.path.length || entity.waitDuration > 999) {
            entity.waitDuration = 0;
            const potentialSwitchEntities: Entity[] = world.switches
                .filter(s => world.activatedCircuits[s.circuit]);
            // attempt to interact with something nearby
            if (!entity.fleeing) {
              const potentialTargetEntities: Entity[] = potentialSwitchEntities
                  .concat(world.player)
                  .sort((e1, e2) =>
                      vectorNLength(vectorNSubtract(e1.position.slice(0, 2), entity.position)) - vectorNLength(vectorNSubtract(e2.position.slice(0, 2), entity.position))
                  );
              const potentialTargetEntity = potentialTargetEntities[0];
              if (potentialTargetEntity) {
                const relativePosition = vectorNSubtract(potentialTargetEntity.position.slice(0, 2), entity.position);
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
                        activating = () => {};
                        break;
                    }
                  }
                  // move toward the optimal position
                  targetAngle = Math.atan2(relativePosition[1], relativePosition[0]);
                  targetPoint = [
                    potentialTargetEntity.position[0] - Math.cos(targetAngle) * entity.collisionRadius,
                    potentialTargetEntity.position[1] - Math.sin(targetAngle) * entity.collisionRadius,
                  ]
                }
              }
            }
            // attempt to find something on the map
            if (!targetPoint) {
              const potentialTargetPoints = potentialSwitchEntities.map(s => s.position);
              if(entity.fleeing) {
                // add in couple of known dark spots
                potentialTargetPoints.push(
                  [20, 5, 0],
                  [7, 15, 0],
                );
              } else {
                potentialTargetPoints.push(world.player.position);
              }
              if(potentialTargetPoints.length) {
                const costs = costWorld(world, ex, ey, tileCostFactory);
                const paths = potentialTargetPoints
                    // only use valid targets
                    .filter(p => !entity.fleeing || !lineOfSightAndLit(world, world.player, p, entity.depth))
                    // sort by cheapness
                    .sort((p1, p2) => {
                      const [x1, y1] = getTile(p1);
                      const [x2, y2] = getTile(p2);
                      return (costs[x1][y1]||CONST_LARGE_NUMBER) - (costs[x2][y2]||CONST_LARGE_NUMBER);
                    });
                    //.filter(p => vectorNDotProduct(vectorNSubtract(p, entity.position), vectorNSubtract(p, world.player.position))>0);
                const targetPosition = paths[0];
                if (targetPosition) {
                  const [tx, ty] = getTile(targetPosition);
                  entity.path = pathTo(costs, tx, ty);
                }
              }
            }
          }
          // attempt to follow path
          if (!targetPoint) {
            let i = 0;
            let targetPointValid: boolean | number = 1;
            if (entity.path && entity.path.length > 0 && !targetPoint) {
              // attempt to follow path
              // find the furthest point we can walk directly to
              while (i < entity.path.length
                  && lineOfSight(world, entity, entity.path[i].concat(0) as Vector3, 0, entity.collisionRadius)
              ) {
                const losAndLit = lineOfSightAndLit(world, world.player, entity.path[i].concat(0) as Vector3, entity.depth);
                if (!(targetPointValid = entity.fleeing && losAndLit || !entity.fleeing && !losAndLit)) {
                  break;
                }
                i++;
              }
              // only keep the last point we can reach
              entity.path.splice(0, Math.min(entity.path.length - 1, i-(entity.fleeing && !targetPointValid ? 0 : 1)));
              targetPoint = entity.path[0];
            }
            if (!targetPointValid && !i) {
              // our path is broken
              targetPoint = null;
              entity.path = null;
            }
          }
          if (targetPoint) {
            let targetLateralVelocity: number;
            const targetDelta = vectorNSubtract(targetPoint, entity.position);
            const targetDistance = vectorNLength(targetDelta) - .1;
            targetLateralVelocity = delta
                ? Math.min((targetDistance / delta), entity.fleeing ? .01 : .007)
                : 0;
            if (targetLateralVelocity < ERROR_MARGIN) {
              targetLateralVelocity = 0;
              if (entity.path?.length < 2) {
                // we're here
                entity.path = null;
              }
            }
            if (targetLateralVelocity) {
              entity.waitDuration = 0;
              activeActions.push({
                actionId: ACTION_WALK
              });
              if (targetAngle == null) {
                // rotate to direction of travel
                const targetNormal = vectorNSubtract(targetPoint, entity.position);
                targetAngle = Math.atan2(targetNormal[1], targetNormal[0]);
              }
            } else if (targetAngle == null) {
              // look at the camera
              const cameraDelta = vectorNSubtract(world.rooms[roomX][roomY].cameraPosition, entity.position);
              targetAngle = Math.atan2(cameraDelta[1], cameraDelta[0]);
              entity.waitDuration += delta;
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
        }
        break;
      case INTELLIGENCE_ARTIFICIAL_CAMERA:
        entity.zRotation = Math.atan2(world.player.position[1] - entity.position[1], world.player.position[0] - entity.position[0]);
        break;
      case INTELLIGENCE_ARTIFICIAL_LIGHT:
        const litAt = world.activatedCircuits[entity.circuit] || 0;
        const litAge = world.age - litAt;
        const lightIntensity = litAt
            ? Math.max(0, Math.min(1, Math.pow(Math.sin(world.age/9), 4)+litAge/(litAge+999) - 1.2*((entity.flicker>>((litAge/199|0)%32))&1)))
            : 0;
        entity.palette[0] = [.5+lightIntensity/2, .5+lightIntensity/2, .5+lightIntensity/2, 1];
        entity.lightIntensity = lightIntensity;

        if (litAt != entity.litAt) {
          const isLit = litAt ? 1 : 0;
          entity.litAt = litAt;
          // mark the lit tiles as lit
          world.tiles.map((a, x) => {
            a.map((tile, y) => {
              const p = [x, y, 0] as Vector3;
              const d = vectorNLength(vectorNSubtract(p, entity.position));

              if (d < CONST_MAX_LIGHT_DISTANCE * .8 && (!isLit || lineOfSight(world, entity, p, 1))) {
                tile.lightSources = isLit
                    ? tile.lightSources | (1 << entity.circuit)
                    : tile.lightSources & ~(1 << entity.circuit);
              }
            })
          })
        }
        if (entity.lightIntensity) {
          litEntities.push(entity);
        };
        break;
      case INTELLIGENCE_ARTIFICIAL_SWITCH:
        if (world.activatedCircuits[entity.circuit]) {
          entity.palette[2] = [0, 1, 0, 1];
        } else {
          entity.palette[2] = [1, 0, 0, 1];
        }
        break;
    }

    if (entity.collisionType > 0) {
      // find all the rooms that overlap with this entity
      const startingRooms = entityRooms(entity);

      // gravity
      if (entity.collisionType == COLLISION_TYPE_DYNAMIC) {
        entity.velocity[2] -= CONST_GRAVITY;
      }

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
        const [minRx, minRy] = entity.position.map(p => Math.max(0, ((p - effectiveRadius)/CONST_ROOM_DIMENSION) | 0));
        const [maxRx, maxRy] = entity.position.map((p, i) => (Math.min(CONST_WORLD_BOUNDS[i] || 0) - 1, ((p + effectiveRadius)/CONST_ROOM_DIMENSION) | 0));
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
                  const testPosition = entity.position.map((p, i) => p + entity.velocity[i] * testTime) as Vector3;
                  const d = vectorNLength(vectorNSubtract(testPosition.slice(0, 2), compare.position));
                  let compareOverlaps = 0;
                  if (d < compare.collisionRadius + entity.collisionRadius) {
                    if (compare.perimeter) {
                      const effectivePerimieter = compare.perimeter
                          .map(v => vector2Rotate(compare.zRotation, v).map((v, i) => v + compare.position[i]) as Vector2);
                      const collisionClosestPoint = vector2PolyEdgeOverlapsCircle(effectivePerimieter, entity.collisionRadius, testPosition);
                      if (collisionClosestPoint) {
                        compareOverlaps = 1;
                        //collisionNormal = Math.atan2(entity.position[1] - collisionClosestPoint[1], entity.position[0] - collisionClosestPoint[0]);
                        collisionNormal = vectorNSubtract(testPosition, collisionClosestPoint.concat(0)) as Vector2;
                      }
                    } else {
                      compareOverlaps = 1;
                      collisionNormal = vectorNSubtract(testPosition, compare.position) as Vector2;
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
                          activating && activating();
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

        entity.position = entity.position.map((p, i) => p + entity.velocity[i] * minCollisionTime) as Vector3;
        // check the floor
        if (entity.position[2] < 0) {
          entity.position[2] = 0;
          // don't bounce vertically
          entity.velocity[2] = 0;
        }

        if (minCollisionEntity) {
          const v = vector2Rotate(-minCollisionNormalAngle, entity.velocity);
          v[0] *= -((entity.restitution || 0.001) + (minCollisionEntity.restitution || 0.001));
          entity.velocity = vector2Rotate(minCollisionNormalAngle, v) as Vector3;
          timeRemaining -= minCollisionTime;
          collisions++;
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
    }
    activeActions.map(({ actionId, onComplete }) => {
      const animation = entity.animations[actionId];
      if (animation) {
        const existing = entity.activeAnimations.find(a => a.actionId == actionId);
        if (existing) {
          existing.renewalTime = world.age;
        } else {
          entity.activeAnimations.push({
            actionId,
            startTime: world.age,
            onComplete,
          });
        }
      }
    });

    // remove any animations that don't have active actions or are completed
    entity.activeAnimations = (entity.activeAnimations || [])
        .filter(activeAnimation => {
          const animation = entity.animations[activeAnimation.actionId];
          const looped = activeAnimation.startTime + animation.keyFrames.length * animation.frameDuration < world.age;
          const refreshed = activeActions.some(activeAction => activeAction.actionId == activeAnimation.actionId);
          const remove = !refreshed && animation.repeating || looped && (!animation.repeating || !refreshed);
          (remove && !animation.repeating || looped)
              && activeAnimation.onComplete
              && activeAnimation.onComplete();
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
        const animationDuration = originalWorldAge - activeAnimation.startTime;
        const keyFrameIndex = (animationDuration / animation.frameDuration) | 0;
        const nextKeyFrameIndex = ((animationDuration + delta) / animation.frameDuration) | 0;
        if (keyFrameIndex < animation.keyFrames.length || activeAnimation.renewalTime == world.age) {
          const targetKeyFrame = animation.keyFrames[keyFrameIndex % animation.keyFrames.length];
          const frameStartTime = activeAnimation.startTime + animation.frameDuration * keyFrameIndex;
          const d = world.age - frameStartTime;
          const p = d / animation.frameDuration;
          for (let partId in targetKeyFrame) {
            const lastKeyFrame = entity.bodyPartLastActiveRotation[partId];
            const previousRotation = (lastKeyFrame?.actionId == activeAnimation.actionId && activeAnimation.startTime != world.age
                ? lastKeyFrame?.originRotation
                : lastKeyFrame?.rotation
            ) || [0, 0, 0];

            const targetRotation = targetKeyFrame[partId];
            const rotation = previousRotation.map((v, i) => v + (targetRotation[i] - v) * p) as Vector3;
            bodyPartLastActiveRotation[partId] = {
              actionId: activeAnimation.actionId,
              originRotation: nextKeyFrameIndex == keyFrameIndex ? previousRotation : targetRotation,
              rotation,
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
        lastActiveRotation.rotation = rotation;
        lastActiveRotation.originRotation = rotation;
        partTransforms[partId] = matrix4RotateInOrder(...rotation);
      }
    }
  });
  state.litEntities = litEntities;
}

const MAX_COLLISION_STEPS = 5;

type EngineState = {
  visibleRoom: Vector2,
  player: Entity,
  keyboardInputs: {[_: number]: number },
}

function iterateAdjoiningRooms<T>(world: World, roomX: number, roomY: number, cb: (room: Room) => T): T[] {
  const result: T[] = [];
  for (let worldX = Math.max(0, roomX - 1); worldX < Math.min(world.bounds[0], roomX + 2); worldX++) {
    for (let worldY = roomY - 1; worldY < roomY + 2; worldY++) {
      const room = world.rooms[worldX][worldY];
      if (room) {
        const r = cb(room);
        if (r) {
          result.push(r);
        }
      }
    }
  }
  return result;
}

function iterateEntitiesInAdjoiningRooms(world: World, roomX: number, roomY: number, cb: (entity: Entity) => void) {
  const updatedEntityIds: {[_: number]: number} = {};
  iterateAdjoiningRooms(world, roomX, roomY, (room: Room) => {
    for (let i = room.entities.length; i; ) {
      i--;
      const entity = room.entities[i];
      if (!updatedEntityIds[entity.id]) {
        updatedEntityIds[entity.id] = 1;
        cb(entity);
      }
    }
  });
}

function updater(
  world: World,
  state: EngineState,
  delta: number
) {
  const originalWorldAge = world.age;
  world.age += delta;
  const [worldWidth] = world.bounds;
  const [roomX, roomY] = state.visibleRoom;
  iterateEntitiesInAdjoiningRooms(world, roomX, roomY, (entity: Entity) => {
    let activeActions: number[] = [];
    switch (entity.intelligence) {
      case INTELLIGENCE_USER_CONTROLLED:
        //player.position[0] += ((keys[39]|| 0) - (keys[37] || 0)) * diff / 400;
        //player.position[1] += ((keys[38]|| 0) - (keys[40] || 0)) * diff / 400;
        const keyboardInputs = state.keyboardInputs;
        entity.zRotation -= ((keyboardInputs[39]|| 0) - (keyboardInputs[37] || 0)) * delta / 400;
        const d = ((keyboardInputs[38]|| 0) - (keyboardInputs[40] || 0)) / 999;
        const jump = keyboardInputs[32] || 0;

        if (d) {
          activeActions.push(ACTION_WALK);
        }

        const targetVelocity = [
          Math.cos(entity.zRotation) * d,
          Math.sin(entity.zRotation) * d,
          entity.velocity[2] + jump / 99
        ];
        entity.velocity = entity.velocity.map((v, i) => v + (targetVelocity[i] - v) * delta / 99) as Vector3;
    }

    if (entity.collisionType > 0) {
      // find all the rooms that overlap with this entity

      // gravity
      entity.velocity[2] -= CONST_GRAVITY;

      let timeRemaining = delta;
      let entityOverlappedWithSomethingStatic: boolean | number | undefined;
      do {
        let minCollisionTime = timeRemaining + 1;
        let minCollisionNormalAngle: number;
        let minCollisionEntity: Entity | 0 = 0;
        entityOverlappedWithSomethingStatic = 0;

        // NOTE: we're not really interested in the z velocity, but less code this way
        const effectiveRadius = entity.radius + Math.max(...entity.velocity.map(v => Math.abs(v * timeRemaining))) + ERROR_MARGIN;
        const [minRx, minRy] = entity.position.map(p => Math.max(0, ((p - effectiveRadius)/ROOM_DIMENSION) | 0));
        const [maxRx, maxRy] = entity.position.map((p, i) => (Math.min(world.bounds[i] || 0) - 1, ((p + effectiveRadius)/ROOM_DIMENSION + 1) | 0));
        //const targetPosition = entity.position.map((p, i) => p + entity.velocity[i] * timeRemaining) as Vector3;

        for (let rx=Math.max(0, minRx); rx<=Math.min(maxRx, worldWidth-1); rx++) {
          for (let ry=minRy; ry<=maxRy; ry++) {
            const r = world.rooms[rx][ry];
            if (r) {
              // does the new position overlap with anything?
              r.entities.map(compare => {

                const collisionSteps =  compare == entity || !compare.collisionType
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
                for (let i=0; i<collisionSteps && (i != 1 || compareOverlapedAtLeastOnce); i++) {
                  const testTime = (minTime + maxTime)/2;
                  const testPosition = entity.position.map((p, i) => p + entity.velocity[i] * testTime) as Vector3;
                  const d = vectorNLength(vectorNSubtract(testPosition, compare.position));
                  let compareOverlaps = 0;
                  if (d < compare.radius + entity.radius) {
                    if (compare.perimeter) {
                      const effectivePerimieter = compare.perimeter
                          .map(v => vector2Rotate(compare.zRotation, v).map((v, i) => v + compare.position[i]) as Vector2);
                      const collisionClosestPoint = vector2PolyEdgeOverlapsCircle(effectivePerimieter, entity.radius, testPosition);
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
                if (compareOverlapedAtLeastOnce && vectorNDotProduct(collisionNormal, dv) < 0 && dv.some(v => Math.abs(v) > ERROR_MARGIN)) {
                  if (compare.collisionType < 0 && minTime < minCollisionTime) {
                    entityOverlappedWithSomethingStatic = 1;
                    minCollisionEntity = compare;
                    minCollisionNormalAngle = Math.atan2(collisionNormal[1], collisionNormal[0]);
                    minCollisionTime = minTime;
                  } else {
                    // handle it in place
                    // TODO do something
                    // TODO ensure that these interactions only happen once per entity combination, per update
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
          v[0] *= -((entity.restitution || 0) + (minCollisionEntity.restitution || 0));
          entity.velocity = vector2Rotate(minCollisionNormalAngle, v) as Vector3;
          timeRemaining -= minCollisionTime;
        }
      } while (entityOverlappedWithSomethingStatic && timeRemaining > ERROR_MARGIN);
    }
    // remove any animations that don't have active actions
    entity.activeAnimations = (entity.activeAnimations || []).flatMap(activeAnimation => {
      const animation = entity.animations[activeAnimation.actionId];
      const remove = activeActions.indexOf(activeAnimation.actionId) < 0
          && (
              !animation.repeating // non-repeating animations are assumed to always play out in full
              || activeAnimation.startTime + animation.keyFrames.length * animation.frameDuration < world.age
          );
      return remove
          ? []
          : [activeAnimation]
    });

    activeActions.map(actionId => {
      const animation = entity.animations[actionId];
      if (animation) {
        const existing = entity.activeAnimations.find(a => a.actionId == actionId);
        if (existing) {
          existing.renewalTime = world.age;
        } else {
          entity.activeAnimations.push({
            actionId,
            startTime: world.age,
          });
        }
      }
    });
    entity.activeAnimations.sort((a1, a2) => a1.actionId - a2.actionId);
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
}

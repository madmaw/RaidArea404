///<reference path="./math/matrix.ts"/>

const ERROR_MARGIN = .01;

const
  FACE_TOP: FaceId = 0,
  FACE_FRONT: FaceId = 1,
  FACE_LEFT: FaceId = 2,
  FACE_BOTTOM: FaceId = 3,
  FACE_BACK: FaceId = 4,
  FACE_RIGHT: FaceId = 5;
const FACE_IDS: FaceId[] = [FACE_TOP, FACE_FRONT, FACE_LEFT, FACE_BOTTOM, FACE_BACK, FACE_RIGHT];
const FACE_NAMES: string[] = ['top', 'front', 'left', 'bottom', 'back', 'right'];
const SIDE_NAMES: string[] = ['right', 'top', 'left', 'bottom'];
const FACE_TRANSFORMS: Matrix4[] = [
  matrix4Rotate(1, 0, 0, Math.PI/2),
  matrix4Identity(),
  matrix4Rotate(0, 1, 0, Math.PI/2),
  matrix4Rotate(1, 0, 0, -Math.PI/2),
  matrix4Rotate(0, 1, 0, Math.PI),
  matrix4Rotate(0, 1, 0, -Math.PI/2),
];
type FaceId = 0 | 1 | 2 | 3 | 4 | 5;
// TODO only need to do two sides
const FACE_SIDE_ROTATIONS: {
  face: FaceId,
  rotation?: number,
}[][] = [
// top face
[
  // right side
  {
    face: FACE_RIGHT,
    rotation: -Math.PI/2,
  },
  // top side
  {
    face: FACE_BACK,
    rotation: Math.PI,
  },
  /*
  // left side
  {
    face: FACE_LEFT,
    rotation: Math.PI/2,
  },
  // bottom side
  {
    face: FACE_FRONT,
    //rotation: 0,
  },
  */
],
// front face
[
  // right side
  {
    face: FACE_RIGHT,
    //rotation:0,
  },
  // top side
  {
    face: FACE_TOP,
    //rotation: 0,
  },
  /*
  // left side
  {
    face: FACE_LEFT,
    //rotation: 0,
  },
  // bottom side
  {
    face: FACE_BOTTOM,
    //rotation: 0,
  },
  */
],
// left face
[
  // right side
  {
    face: FACE_FRONT,
    //rotation: 0,
  },
  // top side
  {
    face: FACE_TOP,
    rotation: -Math.PI/2,
  },
  /*
  // left side
  {
    face: FACE_BACK,
    //rotation: 0,
  },
  // bottom side
  {
    face: FACE_BOTTOM,
    rotation: Math.PI/2,
  }
  */
],
// bottom face
[
  // right side
  {
    face: FACE_RIGHT,
    rotation: Math.PI/2,
  },
  // top side
  {
    face: FACE_FRONT,
    //rotation: 0,
  },
  /*
  // left side
  {
    face: FACE_LEFT,
    rotation: -Math.PI/2,
  },
  // bottom side
  {
    face: FACE_FRONT,
    rotation: Math.PI,
  },
  */
],
// back face
[
  // right side
  {
    face: FACE_LEFT,
    //rotation:0,
  },
  // top side
  {
    face: FACE_TOP,
    rotation: Math.PI,
  },
  /*
  // left side
  {
    face: FACE_RIGHT,
    //rotation: 0,
  },
  // bottom side
  {
    face: FACE_BOTTOM,
    rotation: Math.PI,
  },
  */
],
// right face
[
  // right side
  {
    face: FACE_BACK,
    //rotation: 0,
  },
  // top side
  {
    face: FACE_TOP,
    rotation: Math.PI/2,
  },
  /*
  // left side
  {
    face: FACE_FRONT,
    //rotation: 0,
  },
  // bottom side
  {
    face: FACE_BOTTOM,
    rotation: Math.PI
  }
  */
],
]

const DIRECTION_UP = 1;
const DIRECTION_DOWN = 2;
const DIRECTION_UP_AND_DOWN = 3;

const DIMENSION_HEIGHT: DimensionId = 6;
const DIMENSION_WIDTH: DimensionId = 7;
const DIMENSION_DEPTH: DimensionId = 8;
type DimensionId = 6 | 7 | 8;

const SIDE_TOP = 0;
const SIDE_LEFT = 1;
const SIDE_BOTTOM = 2;
const SIDE_RIGHT = 3;

const SIDE_ANGLES = [0, 3 * Math.PI/2, Math.PI, Math.PI/2];
const SIDE_ADJUSTS: Vector2[] = [[0, 0], [0, 1], [1, 1], [1, 0]];
const WALK_DELTAS: [number, number, number][] = [[1 ,-1, 1], [1, 0, 0], [0, 0, 3]];

type Surface = [PerimeterPoint, PerimeterPoint, PerimeterPoint, PerimeterPoint];

type ModelDefinition = Partial<Record<FaceId, Rect2>> & Partial<Record<DimensionId, number>>;

type PerimeterPoint = {
  position: Vector2,
  textureCoordinate?: Vector2,
  textureCoordinateOriginal?: boolean | number,
  fixed?: boolean,
  popped?: boolean | number,
  minZ?: number,
  maxZ?: number,
};

function bisectHorizontallyOnPoints(
  perimeter: PerimeterPoint[],
  points: PerimeterPoint[],
): PerimeterPoint[][] {
  return points.reduce((faces, point) => {

    return faces.flatMap(face => {
      const [above, below] = bisectHorizontallyOnY(face, point.position[1]);
      if (above.some(hasDupes) || below.some(hasDupes)) {
        console.log('what??');
        bisectHorizontallyOnY(face, point.position[1]);
      }

      return above.concat(below);
    })
  }, [perimeter]);
}

function bisectHorizontallyOnY(
  rawPerimeter: PerimeterPoint[],
  y: number,
): [PerimeterPoint[][], PerimeterPoint[][]] {
  const perimeter = normalizePerimeter(rawPerimeter);
  const intersections = strictIntersectionsAtY(perimeter, y);

  let previousIntersectionDirection = DIRECTION_UP;
  const invalid = intersections.some(([x, i, direction]) => {
    const result = direction != DIRECTION_UP_AND_DOWN && previousIntersectionDirection != DIRECTION_UP_AND_DOWN && (direction & previousIntersectionDirection);
    previousIntersectionDirection = direction;
    return result;
  })

  if (invalid || intersections.length > 0 && ((intersections[0][2] & DIRECTION_UP) || (intersections[intersections.length - 1][2] & DIRECTION_DOWN))) {
    console.log('bad intersection!', perimeter, y, intersections);
    strictIntersectionsAtY(perimeter, y);
    //intersections.splice(0, intersections.length);
  }

  if (intersections.length > 1) {
    // split into two
    const [x1, i1] = intersections[0];
    const [x2, i2] = intersections[1];

    const above: PerimeterPoint[] = [];
    const below: PerimeterPoint[] = [];

    // intentionally has no output
    perimeter.map((p, i) => {
      const copyP: PerimeterPoint = {
        ...p,
        position: [...p.position],
      };
      const pNext = perimeter[(i+1)%perimeter.length];
      const dy = pNext.position[1] - p.position[1];
      // this check is necessary v
      const proportion = Math.abs(dy) > ERROR_MARGIN
          ? (y - p.position[1])/dy
          : 0;
      const textureCoordinate: Vector2 | undefined = p.textureCoordinate && pNext.textureCoordinate
          ? [
            p.textureCoordinate[0] + (pNext.textureCoordinate[0] - p.textureCoordinate[0]) * proportion,
            p.textureCoordinate[1] + (pNext.textureCoordinate[1] - p.textureCoordinate[1]) * proportion
          ]
          : undefined;
      const textureCoordinateOriginal = p.textureCoordinateOriginal;
      const z = p.position[2] != null && pNext.position[2] != null
          ? p.position[2] + (pNext.position[2] - p.position[2]) * proportion
          // NOTE: should always be undefined, can probably remove
          //: p.position[2] || pNext.position[2];
          : undefined;
      const farY = Math.abs(y - p.position[1]) > ERROR_MARGIN;
      const nextNearY = Math.abs(y - pNext.position[1]) < ERROR_MARGIN;
      if (i < i1 || i === i1 && farY || i > i2) {
        above.push(copyP);
      }
      if (i > i1 && (i < i2 || i == i2 && farY)) {
        below.push(copyP);
      }
      // I think it's safe to do this as we always break up our polys
      const minZ = p.minZ != null && pNext.minZ != null
          ? p.minZ + (pNext.minZ - p.minZ) * proportion
          : undefined;
      const maxZ = p.maxZ != null && pNext.maxZ != null
          ? p.maxZ + (pNext.maxZ - p.maxZ) * proportion
          : undefined;
      if (i == i1) {
        const newP: PerimeterPoint = {
          position: [x1, y, z],
          textureCoordinate,
          textureCoordinateOriginal,
          popped: p.popped && !farY || pNext.popped && nextNearY,
          minZ,
          maxZ
        };
        above.push(newP);
        below.push(newP);
      }
      if (i == i2) {
        const newP: PerimeterPoint = {
          position: [x2, y, z],
          textureCoordinate,
          textureCoordinateOriginal,
          popped: p.popped && !farY || pNext.popped && nextNearY,
          minZ,
          maxZ,
        };
        above.push(newP);
        below.push(newP);
      }
    });

    const uniqueFilter =  (p: PerimeterPoint, i: number, a: PerimeterPoint[]) => {
      const pNext = a[(i+1)%a.length];
      return Math.abs(p.position[0] - pNext.position[0]) < ERROR_MARGIN
          && Math.abs(p.position[1] - pNext.position[1]) < ERROR_MARGIN
          ? []
          : [p];
    }

    const [aboveAbove, aboveBelow] = bisectHorizontallyOnY(above.flatMap(uniqueFilter), y);
    const [belowAbove, belowBelow] = bisectHorizontallyOnY(below.flatMap(uniqueFilter), y);

    return [aboveAbove.concat(belowAbove), aboveBelow.concat(belowBelow)];
  } else {
    // rotate 0 makes a copy for us
    if ((perimeter[0].position[1] + perimeter[1].position[1])/2 < y) {
      return [[rotatePerimeter(0, perimeter)], []];
    } else {
      return [[], [rotatePerimeter(0, perimeter)]];
    }
  }
}

function hasDupes(perimeter: PerimeterPoint[]) {
  let previous = perimeter[perimeter.length - 1];
  return perimeter.some(p => {
    const b = (Math.abs(p.position[0] - previous.position[0]) < ERROR_MARGIN && Math.abs(p.position[1] - previous.position[1]) < ERROR_MARGIN);
    previous = p;
    return b;
  });
}

function intersectionsAtY(
  perimeter: PerimeterPoint[],
  y: number
) {
  return perimeter.flatMap<[number, number, number]>((point, i) => {
    const nextIndex = (i+1)%perimeter.length;
    const nextPoint = perimeter[nextIndex];
    const [x1, y1] = point.position;
    const [x2, y2] = nextPoint.position;

    const currentIsNotHorizontal = Math.abs(y2 - y1) > ERROR_MARGIN;
    const up = y2 - ERROR_MARGIN < y && y < y1 + ERROR_MARGIN;
    const down = y1 - ERROR_MARGIN < y && y < y2 + ERROR_MARGIN;
    let result: [number, number, number][] = [];
    const valid = (up || down);
    const direction = (up ? DIRECTION_UP : 0) + (down ? DIRECTION_DOWN : 0);
    if (valid && currentIsNotHorizontal) {
      const ix= x1 + (x2 - x1) * (y - y1) / (y2 - y1);
      const intersection: [number, number, number] = [ix, i, direction];
      result = [intersection];
    }
    return result;
  }).sort(([x1], [x2]) => x1 - x2);
}

function strictIntersectionsAtY(
  perimeter: PerimeterPoint[],
  y: number
) {
  const intersections = intersectionsAtY(perimeter, y);
  return intersections.flatMap((p, i, a) => {
    const pNext = a[i+1];
    if (pNext && p[2] == DIRECTION_DOWN && pNext[2] == DIRECTION_UP) {
      const index = p[1];
      const indexNext = pNext[1];
      const minIndex = Math.min(index, indexNext);
      const maxIndex = Math.max(index, indexNext);
      const check = (p: PerimeterPoint) => p.position[1] + ERROR_MARGIN < y || p.position[1] - ERROR_MARGIN > y;
      const a1: PerimeterPoint[] = perimeter.slice(minIndex + 1, maxIndex + 1);
      const a2: PerimeterPoint[] = perimeter.slice(maxIndex + 1).concat(perimeter.slice(0, minIndex + 1));
      if (a1.some(check) && a2.some(check)) {
        return [p, pNext];
      }
    }
    return [];
  });
}

function intersectionsAtYOld(
  perimeter: PerimeterPoint[],
  y: number,
  strict?: boolean | number
): [number, number, number, PerimeterPoint | undefined][] {
  let prevPoint = perimeter[perimeter.length - 1];
  let previousIntersection: [number, number, number, PerimeterPoint | undefined] | undefined | 0;
  return perimeter.flatMap<[number, number, number, PerimeterPoint | undefined]>((point, i) => {
    const nextIndex = (i+1)%perimeter.length;
    const nextPoint = perimeter[nextIndex];
    const [x0, y0] = prevPoint.position;
    const [x1, y1] = point.position;
    const [x2, y2] = nextPoint.position;
    prevPoint = point;

    const errorMargin = strict ? -ERROR_MARGIN : ERROR_MARGIN;
    const near = Math.abs(y1 - y) < ERROR_MARGIN;
    const previousWasDown = y1 - y0 > ERROR_MARGIN;
    const previousWasUp = y1 - y0 < -ERROR_MARGIN;
    const currentIsNotHorizontal = Math.abs(y2 - y1) > ERROR_MARGIN;
    const up = y2 - errorMargin < y && y < y1 + ERROR_MARGIN && currentIsNotHorizontal || near && previousWasUp && x2 > x1 + ERROR_MARGIN;
    const down = y1 - ERROR_MARGIN < y && y < y2 + errorMargin && currentIsNotHorizontal || near && previousWasDown && x2 < x1 - ERROR_MARGIN;
    let result: [number, number, number, PerimeterPoint | undefined][] = [];
    const valid = (up || down) && (previousWasDown && down || previousWasUp && up || !near || !strict || down && x1 > x0 || up && x1 < x0);
    const direction = (up ? DIRECTION_UP : 0) + (down ? DIRECTION_DOWN : 0);
    if (valid) {
      const ix = currentIsNotHorizontal
          ? x1 + (x2 - x1) * (y - y1) / (y2 - y1)
          : x1;
      const intersection: [number, number, number, PerimeterPoint | undefined] = [ix, i, direction, near ? point : undefined];
      if (strict) {
        if (previousIntersection) {
          if (previousIntersection[2] != direction) {
            result = [previousIntersection];
            previousIntersection = intersection;
          } else if (near) {
            // is this intersection closer?
            previousIntersection = intersection;
          }
        } else if (down) {
          previousIntersection = intersection;
        }
      } else {
        result = [intersection];
      }
    }
    if (previousIntersection && previousIntersection[2] && !nextIndex) {
      result.push(previousIntersection);
    }
    return result;
  }).sort(([x1], [x2]) => x1 - x2);
}

function intersectionToLeftX(perimeter: PerimeterPoint[], [x, y]: Vector2): number | undefined {
  // only interested in right-facing lines
  return intersectionsAtY(perimeter, y).filter(([ix, i, up]) => ix < x && !up).map(([ix]) => ix)[0];
}

function rotatePerimeter(angle: number, perimeter: PerimeterPoint[]): PerimeterPoint[] {
  return normalizePerimeter(perimeter.map(p => ({
    ...p,
    position: vector2Rotate(angle, p.position)
  })));
}

function normalizePerimeter(perimeter: PerimeterPoint[]): PerimeterPoint[] {
  // ensure that the points still start at the top-left
  const topLeftIndex = perimeter.reduce<number>((minIndex, point, index) => {
    const minPoint = perimeter[minIndex];
    return point.position[1] < minPoint.position[1] - ERROR_MARGIN
        || Math.abs(point.position[1] - minPoint.position[1]) < ERROR_MARGIN && point.position[0] < minPoint.position[0]
        ? index
        : minIndex;
  }, 0);
  return perimeter.slice(topLeftIndex).concat(perimeter.slice(0, topLeftIndex));
}

function getPerimeter(model: ModelDefinition, perimeters: (PerimeterPoint[]|undefined)[], face: FaceId): PerimeterPoint[] {
  let perimeter = perimeters[face];
  if (!perimeter) {
    // is the opposite perimeter specified?
    perimeter = calculateOppositePerimeter(perimeters, face);
    if (!perimeter) {
      // are there adjacent perimeters?
      const adjFace1: FaceId = (face+1)%6 as any;
      const adjFace2: FaceId = (face+2)%6 as any;
      const [x1, y1, width1, height1] = bounds(
        perimeters[adjFace1] ||
        calculateOppositePerimeter(perimeters, adjFace1) ||
        defaultPerimeter(model, adjFace1)
      );
      const [x2, y2, width2, height2] = bounds(
        perimeters[adjFace2] ||
        calculateOppositePerimeter(perimeters, adjFace2) ||
        defaultPerimeter(model, adjFace2)
      );
      let width: number;
      let height: number;
      switch(face % 3) {
        // top/bottom
        case FACE_TOP:
          width = width1;
          height = width2;
          break;
        // front/back
        case FACE_FRONT:
          width = width2;
          height = height1;
          break;
        // left/right
        case FACE_LEFT:
          width = height1;
          height = height2;
          break;
      }
      return [{
        position: [-width/2, -height/2]
      }, {
        position: [-width/2, height/2]
      }, {
        position: [width/2, height/2]
      }, {
        position: [width/2, -height/2]
      }];
    }
  }
  return perimeter;
}

function bounds(perimeter: PerimeterPoint[]): Rect2 {
  const [x, y] = perimeter[0].position;
  // return perimeter.reduce<Rect2>(
  //   ([rx, ry, rw, rh], {position: [x, y]}) =>
  //     [Math.min(rx, x), Math.min(ry, y), Math.max(rw, rx + rw - x), Math.max(rh, ry + rh - y)],
  //   [x, y, 0, 0]
  // );
  const [minx, miny, maxx, maxy] = perimeter.reduce<Rect2>(
    ([minx, miny, maxx, maxy], {position: [x, y]}) =>
      [Math.min(minx, x), Math.min(miny, y), Math.max(maxx, x), Math.max(maxy, y)],
    [x, y, x, y]
  );
  return [minx, miny, maxx - minx, maxy - miny];
}

function defaultPerimeter(model: ModelDefinition, face: FaceId): PerimeterPoint[] {
  const w = model[DIMENSION_WIDTH] || 1;
  const h = model[DIMENSION_HEIGHT] || 1;
  const d = model[DIMENSION_DEPTH] || 1;

  let width = w;
  let height = h;

  switch (face % 3) {
    case FACE_LEFT:
      // top/bottom
      width = d;
      height = h;
      break;
    case FACE_TOP:
      // left/right
      width = w;
      height = d;
  }

  return [{
    position: [-width/2, -height/2]
  }, {
    position: [-width/2, height/2]
  }, {
    position: [width/2, height/2]
  }, {
    position: [width/2, -height/2]
  }];
}

function calculateOppositePerimeter(perimeters: (PerimeterPoint[]|undefined)[], face: FaceId): PerimeterPoint[] | undefined {
  const oppositePerimeter = perimeters[(face + 3) % 6];
  if (oppositePerimeter) {
    const mult = face % 3 ? -1 : 1;
    return normalizePerimeter(oppositePerimeter.map(p => ({
      ...p,
      position: [mult * p.position[0], -mult * p.position[1]] as Vector2,
    })).reverse()); // reverse maintains anti-clockwise-ness
  }
}

function extractPerimeters(model: ModelDefinition, i: HTMLImageElement, imageWidth: number, imageHeight: number): (PerimeterPoint[]|undefined)[] {
  return FACE_IDS.map(face => {
    const rect = model[face];
    if (rect) {
      const [bx, by, bw, bh] = rect;
      const cx = bw/2;
      const cy = bh/2;
      const canvas = document.createElement('canvas');
      canvas.width = bw;
      canvas.height = bh;
      const context = canvas.getContext('2d');
      context.drawImage(i, bx, by, bw, bh, 0, 0, bw, bh);
      const imageData = context.getImageData(0, 0, bw, bh);
      // find the first non-white pixel
      const index = imageData.data.findIndex(v => v < 255) / 4;
      const sx = index % bw;
      const sy = (index / bw) | 0;
      // attempt to walk the perimeter of the non-white pixels
      let wx = sx;
      let wy = sy;
      let wside = SIDE_TOP;
      let previousSide = SIDE_LEFT;
      let previousColor: number | undefined;
      const perimeter: PerimeterPoint[] = [];
      do {
        const [ax, ay] = SIDE_ADJUSTS[wside];
        const color = imageData.data[(wy * bw + wx) * 4];
        const sideAngle = SIDE_ANGLES[wside];
        if (previousSide != wside || previousColor != color) {
          const textureInsetAngle = previousSide == wside
              ? Math.PI/2
              : previousSide == (wside + 1)%4
                  ? Math.PI/4
                  : 3*Math.PI/4;
          const px = wx + ax;
          const py = wy + ay;
          perimeter.push({
            position: [px - cx, py - cy],
            textureCoordinate: [
              (px + bx + Math.cos(sideAngle + textureInsetAngle)/9)/imageWidth,
              (py + by + Math.sin(sideAngle + textureInsetAngle)/9)/imageHeight
            ],
            textureCoordinateOriginal: 1,
            fixed: previousColor != color,
          });
        }
        previousSide = wside;
        previousColor = color;
        for (const delta of WALK_DELTAS) {
          const [dx, dy] = vectorNRound(vector2Rotate(sideAngle, delta as any as Vector2));
          const px = wx + dx;
          const py = wy + dy;
          const pi = py * bw + px;
          if (px >= 0 && px < bw && py >= 0 && py < bh && imageData.data[pi * 4] < 255) {
            wx += dx;
            wy += dy;
            wside = (wside + delta[2]) % 4;
            break;
          }
        }
      } while (wx != sx || wy != sy || wside);
      // smooth it out
      let {position: previous} = perimeter[perimeter.length - 1];
      for (let i=0; i<perimeter.length; i++) {
        const currentPoint = perimeter[i];
        const {position: current, fixed} = currentPoint;
        const {position: next} = perimeter[(i+1) % perimeter.length];
        const {position: nextNext} = perimeter[(i+2) % perimeter.length];
        const [aprevious, dprevious] = vector2AngleAndDistance(previous, current);
        const [rx, ry] = vector2Rotate(-aprevious, [next[0] - current[0], next[1] - current[1]]);
        const [nnx, nny] = vector2Rotate(-aprevious, [nextNext[0] - next[0], nextNext[1] - next[1]]);
        const [anext, dnext] = vector2AngleAndDistance(current, next);
        if (ry < 0 && !fixed && (dprevious < 1.1 || dnext < 1.1)) {
          // if (nnx < 0) {
          //   current[0] += Math.cos(anext) * dnext/2;
          //   current[1] += Math.sin(anext) * dnext/2
          // } else {
          //   const [a] = vector2AngleAndDistance(vector2Rotate(-aprevious, previous), vector2Rotate(-aprevious, next));
          //   const l = Math.cos(a) * dprevious;
          //   current[0] = previous[0] + Math.cos(a + aprevious) * l;
          //   current[1] = previous[1] + Math.sin(a + aprevious) * l;
          // }
          current[0] = (previous[0] + next[0])/2;
          current[1] = (previous[1] + next[1])/2;
          currentPoint.popped = 1;
        }
        previous = current;
      }
      // TODO calcuate anti-clockwise to start with
      return perimeter.reverse();
    }
  });
}

function modelToFaces(model: ModelDefinition, i: HTMLImageElement, imageWidth: number, imageHeight: number): PerimeterPoint[][][] {
  const perimeters = extractPerimeters(model, i, imageWidth, imageHeight);
  const triangles = FACE_IDS.map(faceId => {
    const face = getPerimeter(model, perimeters, faceId);
    // break up so we always produce convex polygons
    console.log(face);
    //let faces = bisectHorizontallyOnPoints(face, face);
    let faces = [face];

    console.log('***');
    console.log(FACE_NAMES[faceId], faces);
    console.log('***');

    FACE_SIDE_ROTATIONS[faceId]?.forEach(({ face: sideFaceId, rotation = 0 }, side) => {
      const angle = side * Math.PI/2;
      const unrotatedSidePerimeter = getPerimeter(model, perimeters, sideFaceId);
      const sidePerimeter = rotatePerimeter(rotation + angle, unrotatedSidePerimeter);
      console.log(`slice against ${SIDE_NAMES[side]} maps to ${FACE_NAMES[sideFaceId]}`,  sidePerimeter);

      // bisect face against horizontally to ensure the cross-sectioning works for partial-overlapping
      const surfaces: Surface[] = bisectHorizontallyOnPoints(sidePerimeter, sidePerimeter.concat(rotatePerimeter(angle, face)))
          .flatMap(face => face.flatMap((point, i) => {
            const previousPoint = face[(i + face.length - 1)%face.length]
            const p1 = previousPoint.position;
            const p2 = point.position;
            if (p1[1] < p2[1] - ERROR_MARGIN) {
              // find the corresponding intersection point at the back of the face (should only be two intersections, this line and the back face)
              const [jx, j] = intersectionsAtY(face, (p1[1] + p2[1])/2)[1];
              return [[
                previousPoint,
                point,
                face[j],
                face[(j+1)%face.length]
              ] as Surface];
            }
            return [];
          }));

      console.log('surfaces', surfaces);
      // check each surface
      faces = faces.flatMap(face => {
        const rotatedFace = rotatePerimeter(angle, face);
        console.log('rotated face', rotatedFace);

        const faces = surfaces.flatMap(surface => {
          const [point1, point2, backPoint1, backPoint2] = surface;
          const p1 = point1.position;
          const p2 = point2.position;

          const intersections1 = intersectionsAtY(sidePerimeter, p1[1]);
          const intersections2 = intersectionsAtY(sidePerimeter, p2[1]);

          // const maxZ1 = backPoint1.position[0] + (backPoint2.position[0] - backPoint1.position[0]) * (p1[1] - backPoint1.position[1])/(backPoint2.position[1] - backPoint1.position[1]);
          // const maxZ2 = backPoint1.position[0] + (backPoint2.position[0] - backPoint1.position[0]) * (p2[1] - backPoint1.position[1])/(backPoint2.position[1] - backPoint1.position[1]);
          const maxZ1 = backPoint2.position[0];
          const maxZ2 = backPoint1.position[0];
          const minFinder = ([x, _, direction]: [number, number, number]) => (direction & DIRECTION_UP) && x < p2[0];
          const minZ1: number | undefined = (intersections1.reverse().find(minFinder) || [])[0];
          const minZ2: number | undefined = (intersections2.reverse().find(minFinder) || [])[0];

          // are the intersection points within the min/max z for this face?
          // NOTE: can probably remove Math.min Math.max and just pick one point to compare
          const below = bisectHorizontallyOnY(rotatedFace, p1[1])[1];
          const faces = below
              .flatMap(face => bisectHorizontallyOnY(face, p2[1])[0])
              .flatMap(face => {
                console.log('bisected face', surface, face);
                if (face.some(p => p.minZ != null && p.minZ > Math.min(p1[0], p2[0]) + ERROR_MARGIN)) {
                  console.log('passing through', face);
                  return [rotatePerimeter(-angle, rotatedFace)];
                } else if (face.some(p => p.maxZ != null && p.maxZ < Math.max(p1[0], p2[0]) - ERROR_MARGIN)) {
                  console.log('removing', face);
                  return [];
                } else {

                  const zMappedUnrotatedFace = rotatePerimeter(-angle, face.map(p => {
                    let minZ: number | undefined;
                    let maxZ: number | undefined;
                    const proportion = (p.position[1] - p1[1]) / (p2[1] - p1[1])
                    const z = p1[0] + (p2[0] - p1[0]) * proportion;
                    const textureCoordinate: Vector2 = point1.textureCoordinate && point2.textureCoordinate
                    ? [
                      point1.textureCoordinate[0] + (point2.textureCoordinate[0] - point1.textureCoordinate[0]) * proportion,
                      point1.textureCoordinate[1] + (point2.textureCoordinate[1] - point1.textureCoordinate[1]) * proportion
                    ]
                    : undefined;

                    if (Math.abs(p.position[1] - p1[1]) < ERROR_MARGIN) {
                      minZ = minZ1;
                      maxZ = maxZ1;
                    }
                    if (Math.abs(p.position[1] - p2[1]) < ERROR_MARGIN) {
                      minZ = minZ2;
                      maxZ = maxZ2;
                    }
                    p.textureCoordinate = p.textureCoordinate || textureCoordinate;
                    const existingZ = p.position[2];
                    if (existingZ == null || existingZ < z - ERROR_MARGIN) {
                      // if (existingZ != null) {
                      //   console.log('overwriting z', existingZ, z);
                      // }
                      p.position[2] = z;
                      // overwrite the texture coordinate it extrapolated from other orientation
                      if (!p.textureCoordinateOriginal) {
                        p.textureCoordinate = textureCoordinate;
                      }
                    }
                    if (minZ != null) {
                      // if (p.minZ != null ) {
                      //   console.log('overwriting minZ', p.minZ, minZ);
                      // }
                      p.minZ = p.minZ != null
                          ? Math.max(p.minZ, minZ)
                          : minZ;
                    }
                    if (maxZ != null) {
                      // if (p.maxZ != null ) {
                      //   console.log('overwriting maxZ', p.maxZ, maxZ);
                      // }
                      p.maxZ = p.maxZ != null
                          ? Math.min(p.maxZ, maxZ)
                          : maxZ;
                    }
                    return p;
                  }));

                  // it's the last time we will look at this poly, so tidy it up
                  if (side) {

                    // let previousPoint = zMappedUnrotatedFace[zMappedUnrotatedFace.length - 1];
                    // const normal = vector3Normalize(
                    //   vector3Divide(
                    //     zMappedUnrotatedFace.reduce((n, point, i) => {
                    //       const nextPoint = zMappedUnrotatedFace[(i+1)%zMappedUnrotatedFace.length];
                    //       // want to remove any non-flat surfaces on alternate edge, otherwise you get duplicates
                    //       const v1 = vector3Subtract(previousPoint.position as Vector3, point.position as Vector3);
                    //       const v2 = vector3Subtract(nextPoint.position as Vector3, point.position as Vector3);

                    //       const ni = vector3Normalize(vector3CrossProduct(v1, v2));
                    //       previousPoint = point;
                    //       return n.map((v, j) => v + ni[j]) as Vector3;
                    //     }, [0, 0, 0]),
                    //     zMappedUnrotatedFace.length,
                    //   )
                    // );

                    const averageZ = zMappedUnrotatedFace.reduce((v, p) => p.position[2] + v, 0) / zMappedUnrotatedFace.length;

                    let strange = true;
                    // if (zMappedUnrotatedFace.length > 3) {
                    //   const ordered = zMappedUnrotatedFace.slice(0).sort((p1, p2) => p1.position[2] - p2.position[2]);
                    //   const minZ = ordered[ordered.length - 1].position[2];
                    //   const maxZ = ordered[0].position[2];
                    //   if (maxZ - minZ > ERROR_MARGIN && ordered.some(p => p.position[2] - ERROR_MARGIN > minZ && p.position[2] + ERROR_MARGIN < maxZ )) {
                    //     console.log('we have a strange poly');
                    //     strange = true;
                    //   }
                    // }
                    if (strange) {
                      //const pivotIndex = Math.max(zMappedUnrotatedFace.findIndex(p => p.diagonalExternal), 0);
                      // let pivotIndex = 0;
                      // if (normal[0] > 0) {
                      //   pivotIndex += 2;
                      // }
                      // if (normal[1] > 0) {
                      //   pivotIndex++;
                      // }
                      // pivotIndex = Math.min(pivotIndex, zMappedUnrotatedFace.length - 1);

                      // if (Math.abs(normal[0]) > ERROR_MARGIN && Math.abs(normal[1]) > ERROR_MARGIN && zMappedUnrotatedFace.length > 3) {
                      //   console.log('two axis normal', normal, pivotIndex, zMappedUnrotatedFace);
                      // }
                      let maxDiff: undefined | number;
                      const pivotIndex = zMappedUnrotatedFace.reduce((i, p, j) => {
                        const diff = Math.abs(p.position[2] - averageZ);
                        if (maxDiff == null || diff > maxDiff + ERROR_MARGIN || diff > maxDiff - ERROR_MARGIN && diff < maxDiff + ERROR_MARGIN && p.popped) {
                          maxDiff = diff;
                          return j;
                        }
                        return i;
                      }, -1);

                      const pivotPoint = zMappedUnrotatedFace[pivotIndex];
                      // const pivotPointPosition = vector3Divide(
                      //   zMappedUnrotatedFace.reduce<Vector3>(([x, y, z], p) => [x + p.position[0], y + p.position[1], z + p.position[2]], [0, 0, 0]),
                      //   zMappedUnrotatedFace.length
                      // );
                      // const pivotPoint: PerimeterPoint = {
                      //   position: pivotPointPosition,
                      //   textureCoordinate: zMappedUnrotatedFace[0].textureCoordinate,
                      // }
                      return zMappedUnrotatedFace
                          .slice(pivotIndex+1)
                          .concat(zMappedUnrotatedFace.slice(0, pivotIndex))
                          .flatMap<PerimeterPoint[]>((point, j, a) => {
                            // want to split face up into tris
                            const nextPoint = a[j+1];
                            if (!nextPoint) {
                              return [];
                            }

                            // want to remove any non-flat surfaces on alternate edge, otherwise you get duplicates
                            const n1 = vector3Subtract(point.position as Vector3, pivotPoint.position as Vector3);
                            const n2 = vector3Subtract(nextPoint.position as Vector3, pivotPoint.position as Vector3);

                            const normal = vector3Normalize(vector3CrossProduct(n1, n2));
                            const keep = (faceId % 3 == FACE_FRONT)
                                || ((faceId % 3) == FACE_LEFT && Math.abs(normal[0]) < ERROR_MARGIN)
                                || (!(faceId % 3) && Math.abs(normal[0]) < ERROR_MARGIN && Math.abs(normal[1]) < ERROR_MARGIN);
                            // if (!keep) {
                            //   console.log('dropping face', side, normal, pivotPoint, point, nextPoint);
                            // } else {
                            //   console.log('keeping face', side, normal, pivotPoint, point, nextPoint);
                            // }
                            return keep
                                ? [[
                                    {...pivotPoint, position: [...pivotPoint.position]},
                                    {...point, position: [...point.position]},
                                    {...nextPoint, position: [...nextPoint.position]}
                                  ]]
                                : [];
                          });
                    } else {
                      const point = zMappedUnrotatedFace[0];
                      const pivotPoint = zMappedUnrotatedFace[1];
                      const nextPoint = zMappedUnrotatedFace[2];
                      // want to remove any non-flat surfaces on alternate edge, otherwise you get duplicates
                      const n1 = vector3Subtract(point.position as Vector3, pivotPoint.position as Vector3);
                      const n2 = vector3Subtract(nextPoint.position as Vector3, pivotPoint.position as Vector3);

                      const normal = vector3CrossProduct(n1, n2);
                      const keep = (faceId % 3 == FACE_FRONT)
                          || ((faceId % 3) == FACE_LEFT && Math.abs(normal[0]) < ERROR_MARGIN)
                          || (!(faceId % 3) && Math.abs(normal[0]) < ERROR_MARGIN && Math.abs(normal[1]) < ERROR_MARGIN);
                      return keep
                          ? [zMappedUnrotatedFace]
                          : [];
                    }
                  } else {
                    return [zMappedUnrotatedFace];
                  }
                }
              });

            console.log('bisected rotated faces for surface', surface, faces);
            if (faces.some(face => face.length < 3)) {
              console.log('bad face num');
              const aboveBelow = bisectHorizontallyOnY(rotatedFace, p1[1])[1];
              aboveBelow.flatMap(face => bisectHorizontallyOnY(face, p2[1])[0]);
            }
            return faces;
        });
        return faces;
      });
      console.log('bisected', faces);
    });
    return faces;
  });

  return triangles;

}
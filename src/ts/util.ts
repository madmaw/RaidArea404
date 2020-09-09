const make2DArray = <T>(w: number, h: number, f: (x: number, y: number) => T) =>
  new Array(w).fill(0).map((_, x) =>
    new Array(h).fill(0).map((_, y) =>
      f(x, y)
    )
  );
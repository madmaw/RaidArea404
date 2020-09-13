const randomValueFromArray = <T>(a: T[]): T => {
  return a[mathRandom() * a.length | 0];
}
function randomValueFromArray<T>(a: T[]): T {
  return a[Math.random() * a.length | 0];
}
// export{}
// declare global {
//   interface Array<T> {
//     // Rotate n elements of an array
//     rotate(n: number): Array<T>;

//     // Remove the current elements
//     clear(): void;

//     partition(pred: (x: T) => boolean): [Array<T>, Array<T>];
//   }
// }
Array.prototype.rotate = function (count: number) {
  const len = this.length >>> 0;
  let _count = count >> 0;
  _count = ((_count % len) + len) % len;

  // use splice.call() instead of this.splice() to make function generic
  Array.prototype.push.apply(
    this,
    Array.prototype.splice.call(this, 0, _count)
  );
  return this;
};

Array.prototype.clear = function (): void {
  Array.prototype.splice.call(this, 0, this.length);
};

Array.prototype.partition = function (pred: (e: unknown) => boolean): [Array<unknown>, Array<unknown>] {

  const part1: Array<unknown> = []
  const part2: Array<unknown> = []
  this.forEach((e: unknown) => {
    if (pred(e)) part1.push(e)
    else part2.push(e)
  })
  return [part1, part2]
}
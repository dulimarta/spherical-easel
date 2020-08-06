type Result<T, E> = Ok<T, E> | Err<T, E>;
class Ok<T, E> {
  readonly value: T;
  constructor(value: T) {
    this.value = value;
  }
}
class Err<T, E> {
  readonly err: E;
  constructor(value: E) {
    this.err = value;
  }
}

const ok = <T, E>(v: T): Result<T, E> => new Ok(v);
const err = <T, E>(e: E): Result<T, E> => new Err(e);

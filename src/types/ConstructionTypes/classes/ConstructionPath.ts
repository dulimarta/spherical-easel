export {
  MAXCONSTRUCTIONPATHLENGTH as MAXPATHLENGTH,
  ConstructionPathError,
  ConstructionPathRoots,
  ConstructionPath
};

/** maximum allowed path length; path lengths are considered invalid if they are above this value */
const MAXCONSTRUCTIONPATHLENGTH: number = 200;

/** Exhaustive list of potential construction path errors including no error */
enum ConstructionPathError {
  /** no error - path is fine */
  NONE,
  /** path has empty folder names within it (Ex. "folder1//folder3/") */
  EMPTYPATHS,
  /** path exceeds the character limit set by MAXCONSTRUCTIONPATHLENGTH */
  TOOLONG
}

enum ConstructionPathRoots {
  NONE = "",
  PUBLIC = "Public Constructions",
  OWNED = "Owned Constructions",
  STARRED = "Starred Constructions"
}

/** class representing a construction path that does some basic error checking and validation */
class ConstructionPath {
  private path: string;
  private root: ConstructionPathRoots;
  private cachedError: ConstructionPathError | undefined;

  /**
   * paths are expected to be in the format
   *    "path/to/folder/"
   * with no leading slash and no empty names (I.E., "path//to//thing" would have two empty names);
   *
   * leading slashes are automatically removed, and trailing slashes are automatically added.
   */
  constructor(path: string) {
    // initialize root to none
    this.root = ConstructionPathRoots.NONE;

    // if the path has a slash at the front, remove it
    if (path.startsWith("/")) path = path.substring(1, path.length);

    // if the path has a root, remove it; also, splice out the "NONE" option so it doesn't always get picked
    for (const [key, value] of Object.entries(ConstructionPathRoots).toSpliced(
      0,
      1
    )) {
      // remove the root and mark it under the root property
      if (path.startsWith(value)) {
        path = path.substring(value.length);
        this.root = value;
        // check the path for a starting slash again
        if (path.startsWith("/")) path = path.substring(1, path.length);
        break;
      }
    }

    // if the path lacks a slash at the end, add it
    if (!path.endsWith("/")) path = path + "/";
    this.path = path;
  }

  /** @returns a ConstructionPathError enum representing the error with the path */
  public getError(): ConstructionPathError {
    /* memoization */
    if (this.cachedError !== undefined) return this.cachedError;

    /* empty string is always okay */
    if (this.path.length == 0) {
      this.cachedError = ConstructionPathError.NONE;
      return this.cachedError;
      /* excessive path length is an error */
    } else if (this.path.length > MAXCONSTRUCTIONPATHLENGTH) {
      this.cachedError = ConstructionPathError.TOOLONG;
      return this.cachedError;
    }

    /* paths must not contain empty folder names within them */
    if (
      !this.path
        // remove the last slash from the check since it will always have an empty split after it
        .substring(0, this.path.length - 1)
        .split("/")
        .every(name => name.length > 0)
    ) {
      this.cachedError = ConstructionPathError.EMPTYPATHS;
      return this.cachedError;
    }

    this.cachedError = ConstructionPathError.NONE;
    return this.cachedError;
  }

  /** @returns true if the path is valid, false otherwise */
  public isValid(): boolean {
    return this.getError() == ConstructionPathError.NONE;
  }

  /** @returns the path as a string */
  public toString(): string {
    return this.path;
  }

  /** get the root folder as an enum */
  public getRoot(): ConstructionPathRoots {
    return this.root;
  }
}

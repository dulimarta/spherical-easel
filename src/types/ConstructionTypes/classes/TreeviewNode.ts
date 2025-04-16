import { SphericalConstruction } from "..";

/**
 * TreeviewNode representation
 */
export class TreeviewNode {
  /** node ID - the construction's id, or the filepath if the node is a folder */
  public id: string;
  /** node title - the name that appears in the treeview */
  public title: string;
  /** whether or not this node is a leaf */
  public leaf: boolean;
  /** whether or not this node should be enabled. */
  public disabled: boolean; /* NOTE - this field does not work properly in the treeview in our current version of vuetify (3.6.10) */
  /** the node's children, if it has any */
  public children?: Array<TreeviewNode>;

  /**
   * @param id the node's ID
   * @param title the node's display name
   * @param leaf whether or not the node is a leaf
   */
  constructor(id: string, title: string, leaf?: boolean) {
    this.id = id;
    this.title = title;
    this.leaf = leaf ?? false;
    this.disabled = false;
  }

  /**
   * get a copy of this node; does not copy children.
   */
  public copy(): TreeviewNode {
    return new TreeviewNode(this.id, this.title, this.leaf);
  }

  /**
   * @param path path to get the parent node for; ensures the parent node has a children array defined.
   * @returns the parent node of the requested path
   */
  public getPathParentNode(path: string): TreeviewNode {
    return this._getPathParentNode(path);
  }

  /**
   * this function is private as opposed to the public interface lacking the second argument to ensure
   * it is always called correctly by external consumers of its API.
   *
   * @param path path to ensure exists and then return reference to; follows format
   *             'folder0/folder1/folderN/'
   * @param fullpath do not explicitly define this; it is only meant to be used by recursive calls.
   */
  private _getPathParentNode(path: string, fullpath?: string): TreeviewNode {
    /* ensure fullpath is defined, as it won't be at the root */
    fullpath = fullpath ?? this.id + "/" + path;
    /* find the first slash */
    const firstSlashIndex: number = path.indexOf("/");
    if (firstSlashIndex >= 0) {
      /* if the first slash exists, split the string into the current path and the remaining path */
      const curPath: string = path.slice(0, firstSlashIndex);
      const remainingPath: string = path.slice(firstSlashIndex + 1);

      /* use the path up to this point as a unique ID since duplicate paths can't exist - note that
       * this may still cause problems if the same paths exist in private and starred constructions since
       * this function is unaware of the name of root node. */
      var fullPathChunk: string = fullpath;
      if (remainingPath.length > 0) {
        fullPathChunk = fullPathChunk.replace("/" + remainingPath, "");
        if (fullPathChunk.at(-1) != "/") {
          fullPathChunk += "/";
        }
      }

      if (!this.children) {
        /* if this node does not have a children array, give it one and add the folder to it */
        this.children = Array<TreeviewNode>();
        this.children.push(new TreeviewNode(fullPathChunk, curPath));
        /* recurse */
        return this.children[0]._getPathParentNode(remainingPath, fullpath);
      } else {
        const childNode = this.children.find(node => node.id === fullPathChunk);
        /* if the child node exists, recurse on it */
        if (childNode) {
          return childNode._getPathParentNode(remainingPath, fullpath);
        } else {
          /* if the child node does not exist, create it and then recurse on it */
          this.children.push(new TreeviewNode(fullPathChunk, curPath));
          return this.children
            .at(-1)!
            ._getPathParentNode(remainingPath, fullpath);
        }
      }
    } else {
      /* if there is no first slash, assume we are at the right place in the hierarchy for this node */
      /* ensure this node has allocated an array for children */
      this.children = this.children ?? Array<TreeviewNode>();
      /* return a reference to this node */
      return this;
    }
  }

  /**
   * add a child node to this one based on its path. Assumes the node being called is the root node in the path.
   *
   * @param child      SphericalConstruction to append
   * @param parentNode parent node to insert at; if unknown, leave blank to automatically determine.
   */
  public appendChildConstruction(
    child: SphericalConstruction,
    parentNode?: TreeviewNode
  ) {
    /* determine the path at which the child is supposed to exist */
    const path = child.path ?? "";

    parentNode = parentNode ?? this.getPathParentNode(path);
    parentNode.children!.push(
      new TreeviewNode(child.id, child.description, true)
    );
  }

  /**
   * append a TreeviewNode as a child to this node
   *
   * @param child TreeviewNode to append
   */
  public appendChildNode(child: TreeviewNode) {
    /* since nodes don't have a concept of path on their own, just append as a child
    to the callee node */
    this.children = this.children ?? Array<TreeviewNode>();
    this.children.push(child);
  }
}

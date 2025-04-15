import { TreeviewNode } from "./TreeviewNode";
import {
  ConstructionPath,
  ConstructionPathRoots,
  SphericalConstruction
} from "..";

import { Ref, ref } from "vue";

export class ConstructionTree {
  /** the root of our tree */
  private root: Array<TreeviewNode>;

  /** a number stored at the root of the object to give vue's watchers something to check */
  public updateCounter: Ref<number>;

  /** index of the public constructions in the root node's children */
  private readonly publicIdx = 0;
  /** index of the owned constructions in the root node's children */
  private readonly ownedIdx = 1;
  /** index of the starred constructions in the root node's children */
  private readonly starredIdx = 2;

  public constructor() {
    /* ensure root has space for 3 children allocated for the public/owned/starred constructions */
    this.root = Array<TreeviewNode>(3);

    /* we don't list public constructions in the view this tree is meant to represent,
     * but the user should still be able to select the "folder" containing them so that
     * they can view the public constructions */
    this.root[this.publicIdx] = new TreeviewNode(
      "Public Constructions",
      "Public Constructions",
      false
    );
    this.root[this.ownedIdx] = new TreeviewNode(
      "Owned Constructions",
      "Owned Constructions",
      false
    );
    this.root[this.starredIdx] = new TreeviewNode(
      "Starred Constructions",
      "Starred Constructions",
      false
    );

    this.updateCounter = ref(0);
  }

  /**
   * clear any existing constructions and build the tree based on the
   * given lists of public, owned, and starred constructions.
   *
   * @param ownedConstructions
   * @param starredConstructions
   */
  public fromArrays(
    ownedConstructions: Ref<Array<SphericalConstruction>>,
    starredConstructions: Ref<Array<SphericalConstruction>>
  ) {
    this.clear();
    this.addOwnedConstructions(...ownedConstructions.value);
    this.addStarredConstructions(...starredConstructions.value);
    this.updateCounter.value += 1;
  }

  /** append one or more construction to the owned constructions subtree */
  public addOwnedConstructions(...constructions: SphericalConstruction[]) {
    constructions.forEach(construction => {
      this.root[this.ownedIdx].appendChildConstruction(construction);
    });
    this.updateCounter.value += 1;
  }

  /**
   * clear the owned constructions and replace them with a new list
   */
  public setOwnedConstructions(
    constructions: Ref<Array<SphericalConstruction>>
  ) {
    this.root[this.ownedIdx].children?.clear();
    this.addOwnedConstructions(...constructions.value);
    this.updateCounter.value += 1;
  }

  /** append one or more constructions to the starred constructions subtree */
  public addStarredConstructions(...constructions: SphericalConstruction[]) {
    constructions.forEach(construction => {
      this.root[this.starredIdx].appendChildConstruction(construction);
    });
    this.updateCounter.value += 1;
  }

  /**
   * clear the starred constructions and replace them with a new list
   */
  public setStarredConstructions(
    constructions: Ref<Array<SphericalConstruction>>
  ) {
    this.root[this.starredIdx].children?.clear();
    this.addStarredConstructions(...constructions.value);
    this.updateCounter.value += 1;
  }

  /**
   * get a copy of the tree without any of the leaves, leaving only the folders
   */
  public getFolders(): Array<TreeviewNode> {
    var leafless: Array<TreeviewNode> = [];

    this.root.forEach(rootNode => {
      leafless.push(rootNode.copy());
      leafless.at(-1)!.children = this._getLeafless(rootNode);
    });

    return leafless;
  }

  /**
   * like getFolders(), but only returns the owned branch.
   */
  public getOwnedFolders(): Array<TreeviewNode> {
    var folders: Array<TreeviewNode> = [];

    folders.push(this.root[this.ownedIdx].copy());
    this.root[this.ownedIdx].children?.forEach(node => {
      folders[0].children = this._getLeafless(this.root[this.ownedIdx]);
    });

    return folders;
  }

  /**
   * recursive function to get all the non-leaf nodes in the tree. GetLeafless() without
   * the leading underscore is provided as a public interface since we can't directly recurse
   * on the top level of the tree; instead we have to iterate over the top level and recurse on
   * each root node.
   *
   * @param node current node
   */
  private _getLeafless(node: TreeviewNode): Array<TreeviewNode> | undefined {
    /* base case: node with no children */
    if (
      node.children === null ||
      node.children === undefined ||
      node.children!.length == 0
    ) {
      return undefined;
    }

    var leafless: Array<TreeviewNode> = [];

    node.children!.forEach(child => {
      if (!child.leaf) {
        /* copy the child */
        var copy: TreeviewNode = child.copy();
        /* add it to the array */
        leafless.push(copy);
        /* recurse on the child */
        const children = this._getLeafless(child);
        if (children != undefined && children.length > 0) {
          copy.children = children;
        } else {
          /* previously non-leaf nodes must now become leaf nodes to avoid looking weird
           * in the UI */
          copy.leaf = true;
        }
      }
    });

    return leafless;
  }

  /**
   * @returns an array containing the root node of the tree structure
   */
  public getRoot(): Array<TreeviewNode> {
    /*
     * I don't like this function since it returns a mutable reference to the private root element
     * this class maintains, but it's not worth it to make a deep copy every time and it is necessary for
     * the root to be accessible outside of this class since the treeview component needs to use it.
     */
    return this.root;
  }

  /**
   * add an empty folder to the tree at the given path
   */
  public addFolder(path: ConstructionPath) {
    /* only add valid paths */
    if (path.isValid()) {
      let parent: TreeviewNode;
      switch (path.getRoot()) {
        case ConstructionPathRoots.OWNED:
          parent = this.root[this.ownedIdx].getPathParentNode(path.toString());
          break;
        case ConstructionPathRoots.PUBLIC:
          parent = this.root[this.publicIdx].getPathParentNode(path.toString());
          break;
        case ConstructionPathRoots.STARRED:
          parent = this.root[this.starredIdx].getPathParentNode(
            path.toString()
          );
          break;
        default:
          /* nothing to be done */
          return;
      }
    }
  }

  /**
   *
   * @param path path to get the contents of
   * @returns the contents of that path if it is valid and can be found, otherwise undefined.
   *          empty strings do not return the root node, they return undefined.
   */
  public getFolderContents(
    path: ConstructionPath
  ): Array<TreeviewNode> | undefined {
    /* only search for valid paths */
    if (path.isValid()) {
      /* determine the parent node */
      let parent: TreeviewNode;
      switch (path.getRoot()) {
        case ConstructionPathRoots.OWNED:
          parent = this.root[this.ownedIdx];
          break;
        case ConstructionPathRoots.PUBLIC:
          parent = this.root[this.publicIdx];
          break;
        case ConstructionPathRoots.STARRED:
          parent = this.root[this.starredIdx];
          break;
        default:
          /* nothing to be done - we can't determine the parent node */
          return undefined;
      }

      /* split the path string into chunks */
      const path_chunks: Array<string> = path.toString().split("/");
      console.debug("split: " + JSON.stringify(path_chunks));
      /* remove the last chunk since it should be empty */
      path_chunks.splice(path_chunks.length - 1);
      /* iterate over the chunks */
      while (path_chunks.length > 0) {
        /* only run if the parent has children */
        if (parent.children) {
          var found: boolean = false;
          let child: TreeviewNode;
          for (child of parent.children) {
            /* only check non-leaves */
            if (!child.leaf) {
              const childSplit: Array<string> = child.id.split("/");
              /* if we found a new child, break */
              if (childSplit.at(-2) == path_chunks.at(0)) {
                found = true;
                parent = child;
                path_chunks.splice(0, 1);
                break;
              }
            }
          }
          /* if we found a child, continue; otherwise, return undefined */
          if (!found) {
            return undefined;
          }
        } else {
          /* empty children array but we have more path to go - this path doesn't exist */
          return undefined;
        }
      }

      /* return the final node's children */
      return parent.children;
    }

    return undefined;
  }

  /**
   * clear the construction tree, leaving only the 3 subtrees.
   */
  private clear() {
    this.root.forEach(x => {
      x.children?.clear();
    });
  }
}

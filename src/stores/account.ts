import { defineStore, StoreActions, StoreGetters, StoreState } from "pinia";
import {
  AccountState,
  ActionMode,
  ToolButtonGroup,
  ToolButtonType
} from "@/types";
import { toolGroups } from "@/components/toolgroups";

// Declare helper functions OUTSIDE the store definition
function insertAscending(newItem: string, arr: string[]): void {
  let k = 0;
  while (k < arr.length && newItem > arr[k]) k++;
  if (k == arr.length) arr.push(newItem);
  // append to the end of the array
  else arr.splice(k, 0, newItem); // insert in the middle somewhere
}

const DEFAULT_TOOL_NAMES: Array<Array<ActionMode>> = [
  ["undoAction", "redoAction"],
  ["resetAction"],
  ["point"],
  ["zoomIn", "zoomOut", "zoomFit"],
];

// defineStore("hans", (): => {});
export const useAccountStore = defineStore("acct", {
  state: (): AccountState => ({
    temporaryProfilePicture: "",
    userDisplayedName: undefined,
    userProfilePictureURL: undefined,
    userRole: undefined,
    /** @type { ActionMode[]} */
    includedTools: [],
    excludedTools: [],
    favoriteTools: DEFAULT_TOOL_NAMES
  }),
  actions: {
    resetToolset(includeAll = true): void {
      this.includedTools.splice(0);
      this.excludedTools.splice(0);
      const toolNames = toolGroups
        .flatMap((g: ToolButtonGroup) => g.children)
        .map((t: ToolButtonType) => t.action);
      if (includeAll) {
        this.includedTools.push(...toolNames);
      } else {
        this.excludedTools.push(...toolNames);
      }
    },
    includeToolName(name: ActionMode): void {
      const pos = this.excludedTools.findIndex((tool: string) => tool === name);
      if (pos >= 0) {
        insertAscending(name, this.includedTools);
        this.excludedTools.splice(pos, 1);
      }
    },
    excludeToolName(name: ActionMode): void {
      const pos = this.includedTools.findIndex((tool: string) => tool === name);
      if (pos >= 0) {
        insertAscending(name, this.excludedTools);
        this.includedTools.splice(pos, 1);
      }
    },
    setUserDetails(
      name: string | undefined,
      pictureURL: string | undefined,
      favTools: string
    ) {
      this.userDisplayedName = name;
      this.userProfilePictureURL = pictureURL;
      console.debug("Favorite tools", this.favoriteTools);
      if (favTools.trim().length > 0)
        this.favoriteTools = favTools
          .split("\n")
          .map((fav: string) => fav.split(",") as ActionMode[]);
      else
        this.favoriteTools = DEFAULT_TOOL_NAMES
    }
  }
});

// export type AccountStoreType = StoreActions<
//   ReturnType<typeof useAccountStore>
// > &
//   StoreGetters<ReturnType<typeof useAccountStore>> &
//   StoreState<ReturnType<typeof useAccountStore>>;

// export const useAccountStore = (): ReachableStore => useDef();

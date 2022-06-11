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

// defineStore("hans", (): => {});
export const useAccountStore = defineStore("acct", {
  state: (): AccountState => ({
    temporaryProfilePicture: "",
    userRole: undefined,
    userEmail: undefined,
    /** @type { ActionMode[]} */
    includedTools: [] as ActionMode[],
    excludedTools: []
  }),
  actions: {
    resetToolset(includeAll = true): void {
      this.includedTools.splice(0);
      this.excludedTools.splice(0);
      const toolNames = toolGroups
        .flatMap((g: ToolButtonGroup) => g.children)
        .map((t: ToolButtonType) => t.actionModeValue);
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
    }
  }
});
// @Module({ name: "acct", namespaced: true })
// export default class Acct extends VuexModule implements AccountState {
// temporaryProfilePicture = "";
// userRole: string | undefined = undefined;
// includedTools: ActionMode[] = [];
// excludedTools: ActionMode[] = [];

// @Mutation
// setTemporaryProfilePicture(imageHexString: string): void {
//   this.temporaryProfilePicture = imageHexString;
// }

// @Mutation
// setUserRole(role: string | undefined): void {
//   this.userRole = role;
// }

// @Mutation
// resetToolset(includeAll = true): void {}

// @Mutation
// @Mutation
// }

export type AccountStoreType = StoreActions<
  ReturnType<typeof useAccountStore>
> &
  StoreGetters<ReturnType<typeof useAccountStore>> &
  StoreState<ReturnType<typeof useAccountStore>>;

// export const useAccountStore = (): ReachableStore => useDef();

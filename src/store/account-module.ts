import {
  AccountState,
  ActionMode,
  ToolButtonGroup,
  ToolButtonType
} from "@/types";
import { VuexModule, Module, Mutation } from "vuex-module-decorators";
import { toolGroups } from "@/components/toolgroups";

// Declare helper functions OUTSIDE the store definition
function insertAscending(newItem: string, arr: string[]): void {
  let k = 0;
  while (k < arr.length && newItem > arr[k]) k++;
  if (k == arr.length) arr.push(newItem);
  // append to the end of the array
  else arr.splice(k, 0, newItem); // insert in the middle somewhere
}

@Module({ name: "acct", namespaced: true })
export default class Acct extends VuexModule implements AccountState {
  temporaryProfilePicture = "";
  userRole: string | undefined = undefined;
  includedTools: ActionMode[] = [];
  excludedTools: ActionMode[] = [];

  @Mutation
  setTemporaryProfilePicture(imageHexString: string): void {
    this.temporaryProfilePicture = imageHexString;
  }

  @Mutation
  setUserRole(role: string | undefined): void {
    this.userRole = role;
  }

  @Mutation
  resetToolset(): void {
    this.includedTools.splice(0);
    this.excludedTools.splice(0);
    const toolNames = toolGroups
      .flatMap((g: ToolButtonGroup) => g.children)
      .map((t: ToolButtonType) => t.actionModeValue);
    this.includedTools.push(...toolNames);
  }

  @Mutation
  includeToolName(name: ActionMode): void {
    const pos = this.excludedTools.findIndex((tool: string) => tool === name);
    if (pos >= 0) {
      insertAscending(name, this.includedTools);
      this.excludedTools.splice(pos, 1);
    }
  }
  @Mutation
  excludeToolName(name: ActionMode): void {
    const pos = this.includedTools.findIndex((tool: string) => tool === name);
    if (pos >= 0) {
      insertAscending(name, this.excludedTools);
      this.includedTools.splice(pos, 1);
    }
  }
}

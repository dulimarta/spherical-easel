import { AccountState } from "@/types";
import { VuexModule, Module, Mutation } from "vuex-module-decorators";

@Module({name: "acct", namespaced: true})
export default class Acct extends VuexModule implements AccountState {
  temporaryProfilePicture = "";
  userRole: string | undefined = undefined;

  @Mutation
  setTemporaryProfilePicture(imageHexString: string): void {
    this.temporaryProfilePicture = imageHexString;
  }

  @Mutation
  setUserRole(role: string | undefined): void {
    this.userRole = role;
  }
}
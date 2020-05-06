import { Command } from "./Comnand";
import Vertex from "@/3d-objs/Vertex";

export class AddVertexCommand extends Command {
  private arg: Vertex;
  constructor(arg: Vertex) {
    super();
    this.arg = arg;
  }

  do() {
    AddVertexCommand.store.commit("addVertex", this.arg);
  }

  saveState() {
    this.lastState = this.arg.id;
  }

  restoreState() {
    Command.store.commit("removeVertex", this.lastState);
  }
}

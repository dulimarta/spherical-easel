let NODE_COUNT = 0;
export abstract class SENode {
  public parents: SENode[] = [];
  public kids: SENode[] = [];
  public id: number;

  constructor() {
    this.id = NODE_COUNT++;
  }
}

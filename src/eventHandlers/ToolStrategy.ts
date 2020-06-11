// Use Strategy design pattern to enable switching tool behavior at runtime
export interface ToolStrategy {
  mouseMoved(event: MouseEvent): void;
  mousePressed(event: MouseEvent): void;
  mouseReleased(event: MouseEvent): void;
  mouseLeave(event: MouseEvent): void;
  activate(): void;
  deactivate(): void;
}

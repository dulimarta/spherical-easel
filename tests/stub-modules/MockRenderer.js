import { WebGLRenderer } from 'three'

// Use headless GL substitute
import createContext from 'gl';

export class MockRenderer extends WebGLRenderer {

    constructor() {
        const glContext = createContext(256, 256);
        super({ context: glContext });
        // Set domElement to null to prevent it from
        // being attached to the DOM tree
        this.domElement = glContext.canvas;
        // this.extensions = new WebGLExtensions(glContext)
    }
    setPixelRatio() {
        console.debug("Stub method")
    }
    setClearColor() {
        console.debug("Stub method")
    }

}
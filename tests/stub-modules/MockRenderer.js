import { WebGLRenderer } from 'three'

// Use headless GL substitute
import createContext from 'gl';

export class MockRenderer extends WebGLRenderer {

    constructor() {

        super({ context: createContext(256, 256) });
        // Set domElement to null to prevent it from
        // being attached to the DOM tree
        this.domElement = null;
    }
    setPixelRatio() {
        console.debug("Stub method")
    }
    setClearColor() {
        console.debug("Stub method")
    }
}
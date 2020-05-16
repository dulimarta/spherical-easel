<template>
  <div>
    <v-container fluid>
      <div cols="12" ref="content" id="content" class="pa-2">
        <!--- HTML canvas will go here --->
      </div>
    </v-container>
    <!--  
      This is the left drawer component that contains that the
      tools and a list of the objects that have been created in two tabs
      
      Use the "clipped" attribute to keep the navigation drawer 
      below the app toolbar
      Use the "bottom" attribute to have this menu appear at the bottom on mobile
      
      The line ":mini-variant="leftDrawerMinified" is shorthand for 
      'v-bind:mini-variant="leftDrawerMinified"'
      this is a bond between the attribute 'mini-varient' (a Vue property of a navigation drawer)
      and the expression 'leftDrawerMinified' (a user name bolean variable)
      this means that when the expression 'leftDrawerMinified' changes the attribute 'mini-variant' 
      will update.
    -->

    <!--  Use the "clipped" attribute to keep the navigation drawer 
    below the app toolbar, width should be specified as number only (without unit)-->
    <v-navigation-drawer
      id="leftDrawer"
      ref="leftDrawer"
      app
      clipped
      color="accent"
      permanent
      :mini-variant="leftDrawerMinified"
      bottom
      :width="leftDrawerProperties.width"
    >
      <v-container id="leftnav" fluid>
        <!-- These the navigation arrows TODO: I would like these to be in the same row as the
        tabs-->
        <div>
          <v-btn
            v-if="leftDrawerMinified"
            icon
            @click="setMinificationOfLeftDrawer(false)"
          >
            <v-icon>mdi-arrow-right</v-icon>
          </v-btn>
          <v-btn v-else icon @click="setMinificationOfLeftDrawer(true)">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
        </div>
        <!-- This the not minimized left drawer containing two tabs -->
        <div v-if="!leftDrawerMinified">
          <!-- Two tabs set up TODO: fix the behavior of the tabs-->
          <v-tabs v-model="activeLeftDrawerTab" centered grow>
            <v-tooltip
              bottom
              :open-delay="toolTipOpenDelay"
              :close-delay="toolTipCloseDelay"
            >
              <template v-slot:activator="{ on }">
                <v-tab class="mt-3" href="#toolListTab" v-on="on">
                  <v-icon left>mdi-calculator</v-icon>
                </v-tab>
              </template>
              <span>{{ $t("main.ToolsTabToolTip") }}</span>
            </v-tooltip>

            <v-tooltip
              bottom
              :open-delay="toolTipOpenDelay"
              :close-delay="toolTipCloseDelay"
            >
              <template v-slot:activator="{ on }">
                <v-tab class="mt-3" href="#objectListTab" v-on="on">
                  <v-icon left>mdi-format-list-bulleted</v-icon>
                </v-tab>
              </template>
              <span>{{ $t("main.ObjectsTabToolTip") }}</span>
            </v-tooltip>

            <v-tab-item value="toolListTab">
              <ToolButtons></ToolButtons>
            </v-tab-item>
            <v-tab-item value="objectListTab">
              <!-- <ObjectTree :scene="sphere"></ObjectTree> -->
            </v-tab-item>
          </v-tabs>
        </div>
      </v-container>
      <!-- This is the minified version of the left drawer with icon buttons for maximizing it -->
      <div
        id="leftnavicons"
        v-if="leftDrawerMinified"
        @click="setMinificationOfLeftDrawer(false)"
      >
        <v-btn
          icon
          @click="
            setMinificationOfLeftDrawer(false);
            activeLeftDrawerTab = 'toolListTab';
          "
        >
          <v-icon class="ml-3 my-2">mdi-calculator</v-icon>
        </v-btn>
        <v-btn
          icon
          @click="
            setMinificationOfLeftDrawer(false);
            activeLeftDrawerTab = 'objectListTab';
          "
        >
          <v-icon class="ml-3 my-2">mdi-format-list-bulleted</v-icon>
        </v-btn>
      </div>
    </v-navigation-drawer>
  </div>
</template>

<script lang="ts">
/* This is Vue app and we need the Watch and Prop methods(?) for the class style declarations in
TypeScript*/
import { Vue, Watch, Prop } from "vue-property-decorator";
import VueComponent from "vue";
/* Import the package two.js for rendering the sphere and objects */
import Two from "two.js";

/* The intial setup of the sphere object in two.js is done in initApp.ts */
import { setupScene } from "@/initApp";

/* ToolStrategy is an interface that lists the methods (that will be overridden with handlers)
that are need to interpret the event (mouse pressed, mouse release, moused moved etc.) depending
on the current mode. For example, if the current mode is "point", the current tools is set to
NormalPoint Handler, and the mouse pressed event creates a point at the point of mouse press
and ignores the mouse release and move events.   */
import { ToolStrategy } from "@/events/ToolStrategy";
import NormalPointHandler from "@/events/NormalPointHandler";
import LineHandler from "@/events/LineHandler";
import SegmentHandler from "@/events/SegmentHandler";
import CircleHandler from "@/events/CircleHandler";
import MoveHandler from "@/events/MoveHandler";

/* Import the global settings */
import SETTINGS from "@/global-settings";

/* Import the State so we can follow the command paradigm */
import { State } from "vuex-class";

/* Import the components for the contents of the navigation drawer */
import Component from "vue-class-component";
import ObjectTree from "@/components/ObjectTree.vue";
import ToolButtons from "@/components/ToolButtons.vue";

@Component({ components: { ObjectTree, ToolButtons } })
export default class Easel extends Vue {
  /* Declaring canvas (of HTMLCanvasElement type) as a property allows the parent of this view
  to bind a variable in the parent (called canvas) with this child variable called canvas. I
  think that this allows the router to display the different views (easel, settings, about...) */
  @Prop(SVGElement)
  readonly canvas!: SVGElement;

  /* These store the current width and height of the availble space for displaying the view.
   These are automatically updated when the window is resized. They are used to find the largest
   square to display the view in */
  private width = 300;
  private height = 300;

  /* These are use to display the current state of the sphere. The background, midground, and
  foreground are draw in that order inside of the main sphereCanvas. */
  private sphereCanvas: Two;
  private foreground: Two.Group;
  private midground: Two.Group;
  private background: Two.Group;

  /* Controls the behavior of the left drawer and which tab is active */
  private leftDrawerMinified = false; // intial the drawer is displayed
  private activeLeftDrawerTab = "toolListTab";

  /* Copy global setting to local variable */
  private toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  private toolTipCloseDelay = SETTINGS.toolTip.closeDelay;

  /*  Use the Strategy design pattern to enable switching of
  different tool algorithms at runtime, See the comment where these classes (modules?) are imported */
  private currentTool: ToolStrategy | null;
  // private pointTool: NormalPointHandler;
  // private lineTool: LineHandler;
  // private segmentTool: SegmentHandler;
  // private moveTool: MoveHandler;
  // private circleTool: CircleHandler;
  // private controls: TransformControls;

  /* Variable to control the width and border size of the left drawer */
  private leftDrawerProperties = {
    width: 300, //initial width and stores the current width (including the minified)
    borderWidth: 3, //the width for the border of the left drawer set to zero when minimfied
    minWidth: 250, //The minimum width: minWidth<=adjustedWidth is true always
    adjustedWidth: 300 // The value after the user has adjusted the width of the drawer
  };

  @State("editMode")
  private editMode!: string;

  constructor() {
    super();
    const { foreground, midground, background, sphereCanvas } = setupScene();
    this.sphereCanvas = sphereCanvas;
    this.foreground = foreground;
    this.midground = midground;
    this.background = background;

    this.currentTool = null;
    /*    this.pointTool = new NormalPointHandler({
      camera: this.camera,
      scene: this.scene
    });
    this.lineTool = new LineHandler({
      camera: this.camera,
      scene: this.scene
    });
    this.segmentTool = new SegmentHandler({
      canvas: this.renderer.domElement,
      camera: this.camera,
      scene: this.scene
    });
    this.circleTool = new CircleHandler({
      camera: this.camera,
      scene: this.scene
    });
    this.moveTool = new MoveHandler({
      camera: this.camera,
      scene: this.scene
    }); */

    /* this.$store.commit("setSphere", this.sphere); */

    window.addEventListener("resize", this.onWindowResized);
    // window.addEventListener("keypress", this.keyPressed);
  }

  handleMouseMoved(e: MouseEvent) {
    // When currentTool is NULL, the following line does nothing
    this.currentTool?.mouseMoved(e);
  }

  handleMousePressed(e: MouseEvent) {
    // When currentTool is NULL, the following line does nothing
    this.currentTool?.mousePressed(e);
  }

  handleMouseReleased(e: MouseEvent) {
    // When currentTool is NULL, the following line does nothing
    this.currentTool?.mouseReleased(e);
  }

  // VueJS lifecycle function see https://vuejs.org/v2/guide/instance.html#Lifecycle-Diagram
  // mounted is excuted only once like a setup of the canvas
  mounted() {
    // During testting canvas is set to null and appendChild() will fail
    // debugger; // eslint-disable-line
    if (this.canvas instanceof SVGElement) {
      const el = this.$refs.content as HTMLBaseElement;

      // QUESTION: Should the sphereCanvas be added to this.canvas and then this.canvas added to el?
      // it seems to work fine this way.
      // el.appendChild(this.canvas);
      //
      this.sphereCanvas.appendTo(el);
      this.sphereCanvas.update();
      this.canvas.addEventListener("mousemove", this.handleMouseMoved);
      this.canvas.addEventListener("mousedown", this.handleMousePressed);
      this.canvas.addEventListener("mouseup", this.handleMouseReleased);
    }

    this.onWindowResized();
    /* requestAnimationFrame(this.renderIt); */

    /* Methods to set up a border on the left drawer
     and allow it to be adjustable while respecting the minification*/
    this.setLeftDrawerBorderWidth(this.leftDrawerProperties.borderWidth);
    this.setLeftDrawerBorderEvents();
  }

  // VueJS lifecycle function see https://vuejs.org/v2/guide/instance.html#Lifecycle-Diagram
  // this is exited at the end of the life of the canvas
  beforeDestroy() {
    // VueJS lifecycle function
    this.canvas.removeEventListener("mousemove", this.handleMouseMoved);
    this.canvas.removeEventListener("mousedown", this.handleMousePressed);
    this.canvas.removeEventListener("mouseup", this.handleMouseReleased);
  }

  keyPressed = (event: KeyboardEvent) => {
    /* const sphere = this.scene.getObjectByName("MainSphere");
    switch (event.code) {
      case "KeyR":
        sphere?.rotation.set(0, 0, 0);
        break;
      default:
    } */
  };

  renderIt() {
    /* this.renderer && this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.renderIt); */
  }

  onWindowResized = () => {
    const el = this.$refs.content as HTMLBaseElement;
    if (el) {
      /* Compute the available height and width of the window */
      this.height = el.clientHeight;
      this.width = el.clientWidth;
      const availHeight = window.innerHeight - el.offsetTop;

      const size = Math.min(el.clientWidth, availHeight);
      this.sphereCanvas.width = size;
      this.sphereCanvas.height = size;

      // this.canvas.width = size;
      // this.canvas.height = size;

      //Create new boundary circle
      // TODO: fix so the boundary circle is never covered up by the scroll bars or bottom of
      // screen.  The scroll bars should NEVER appear on the this Easel window
      // change -8 and -9 below something automatically calculuated like innerWidth/height
      // When coming back from the settings page the sphere is too big...
      const boundaryCircle = new Two.Ellipse(
        size / 2 - 8, // The center is shifted over
        size / 2,
        size / 2 - 9,
        size / 2 - 9
      );
      boundaryCircle.linewidth = SETTINGS.boundaryCircle.linewidth;
      boundaryCircle.stroke = SETTINGS.boundaryCircle.color;
      boundaryCircle.opacity = SETTINGS.boundaryCircle.opacity;
      boundaryCircle.noFill();

      // remove the old boundary circle
      this.midground.remove(this.midground.children[0]);

      /*  add the new boundary circle to the midground. This
      should always be the only object in the midground */
      this.midground.add(boundaryCircle);

      /* Update the sphereCanvas */
      this.sphereCanvas.update();
    }
  };

  @Watch("editMode")
  switchEditMode(mode: string) {
    // this.currentHandler?.deactivate(); // Unregister the current mouse handler
    switch (mode) {
      case "rotate":
        //     // if (this.showSphereControl) this.controls.attach(this.sphere);
        //     this.controls.removeEventListener("change", this.renderIt);
        this.currentTool = null;
        break;
      case "move":
        // this.currentTool = this.moveTool;
        break;
      case "point":
        //     this.controls.detach();
        //     this.currentHandler = this.normalTracker;
        // this.currentTool = this.pointTool;
        break;
      case "line":
        // this.currentTool = this.lineTool;
        break;
      case "segment":
        // this.currentTool = this.segmentTool;
        break;
      case "circle":
        // this.currentTool = this.circleTool;
        break;
      default:
      //     this.currentHandler = null;
    }
    this.currentTool?.activate();
    // this.currentHandler?.activate(); // Register the new mouse handler
  }

  /*
 This allows the user to maximumize the left drawer by clicking in the navigation drawer
'leftDrawerMinified = !leftDrawerMinified' doesn't work because when you click on the icons
 in the minified left drawer they first unMinify the drawer and
 then 'leftDrawerMinified = !leftDrawerMinified' would reminify it and nothing happens
 This also sets the border with to zero in the minified state so that you can't adjust it.
 In the minified state the border is set to its usual size
 */
  setMinificationOfLeftDrawer(value: boolean) {
    if (value) {
      this.leftDrawerProperties.adjustedWidth = this.leftDrawerProperties.width;
      this.leftDrawerMinified = true; //minifies the left drawer
      this.setLeftDrawerBorderWidth(0); // sets the border to zero to prevent changing width of drawer
    } else {
      this.leftDrawerMinified = false; //maximizes the left drawer
      this.setLeftDrawerBorderWidth(this.leftDrawerProperties.borderWidth); //border shows to allow resize
      this.leftDrawerProperties.width = this.leftDrawerProperties.adjustedWidth;
    }
  }

  /* Set the width of the border to allow it to be adjustable or not (when minified)*/
  setLeftDrawerBorderWidth(size: number) {
    const leftDrawerElement = (this.$refs.leftDrawer as VueComponent).$el;
    const leftDrawerBorder = leftDrawerElement.querySelector(
      ".v-navigation-drawer__border"
    ) as HTMLElement;
    leftDrawerBorder.style.width = size + "px";
    leftDrawerBorder.style.cursor = "ew-resize";
    leftDrawerBorder.style.color = "black"; //This doesn't work. Why? Does a parent override this?
  }

  setLeftDrawerBorderEvents() {
    const minWidth = this.leftDrawerProperties.minWidth;
    const el = (this.$refs.leftDrawer as VueComponent).$el; //I'm not sure why this an error or how to fix it.
    const leftDrawerBorder = el.querySelector(".v-navigation-drawer__border");
    const direction = el.classList.contains("v-navigation-drawer--right")
      ? "right"
      : "left";

    function resizeLeftDrawer(e: MouseEvent) {
      //change the mouse to let the user know the drawer can be resized
      document.body.style.cursor = "ew-resize";
      //correctly compute the width of the adjusted drawer from the right or left
      const newWidth =
        direction === "right"
          ? document.body.scrollWidth - e.clientX
          : e.clientX;
      //only adjust the width if it is bigger than the minimum
      if (newWidth >= minWidth) {
        (el as HTMLElement).style.width = newWidth + "px";
      }
    }

    //On mouse down add a listener to track the changes in the position of the mouse.
    leftDrawerBorder?.addEventListener(
      "mousedown",
      ((e: MouseEvent) => {
        if (e.offsetX <= this.leftDrawerProperties.borderWidth) {
          (el as HTMLElement).style.transition = "initial";
          //add a listener to activley resize the left drawer as the mouse is moved
          document.addEventListener("mousemove", resizeLeftDrawer, false);
        }
      }) as EventListener,
      false
    );

    document.addEventListener(
      "mouseup",
      () => {
        (el as HTMLElement).style.transition = "";
        // this.leftDrawerProperties.width = (el as HTMLElement).style.width;
        document.body.style.cursor = "";
        document.removeEventListener("mousemove", resizeLeftDrawer, false);
        this.onWindowResized(); //I need a command so that the window is repainted so the sphere grows/shrinks
        /*  console.log(this.leftDrawerProperties.width); */
      },
      false
    );
  }
}
</script>

<style lang="scss" scoped>
#content {
  display: flex;
  flex-direction: row;
  justify-content: center;
  border: 1px solid black;
  margin: 4px;
}
#leftnav {
  display: flex;
  flex-direction: column;

  div:first-child {
    align-self: flex-end;
  }
}
#leftnavicons {
  height: 80vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
/* Override the default behavior of Vuetify <v-btn-toggle> elementv-btn-toggle> */
.v-btn-toggle {
  flex-wrap: wrap;
}
</style>

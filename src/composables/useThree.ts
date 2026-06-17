import {
  ArrowHelper,
  DirectionalLight,
  GridHelper,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Raycaster,
  Scene,
  SphereGeometry,
  Timer,
  Vector2,
  Vector3,
  WebGPURenderer
} from "three/webgpu";
import * as THREE from "three/webgpu";
import CameraControls from "camera-controls";
import {
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  ref,
  Ref,
  ShallowRef,
  toValue
} from "vue";
import { useEventListener, useMouseInElement } from "@vueuse/core";
CameraControls.install({ THREE });

export function useThree(canvas: Ref<HTMLCanvasElement | null>): {
  scene: Scene;
  cursorShape: Ref<string>;
  mouse3DPosition: Ref<Vector3 | null>;
  // camera: ShallowRef<PerspectiveCamera>;
} {
  // Implementation for Three.js setup
  const scene: Scene = new Scene();
  let camera: PerspectiveCamera;
  let renderer: WebGPURenderer;
  let cameraController: CameraControls;
  const clock = new Timer();
  const rayCaster = new Raycaster();
  const { elementX, elementY, isOutside } = useMouseInElement(canvas, {});
  const mouseViewportCoordNormalized = new Vector2();
  const cursorShape = ref("default");
  const mouse3DPosition: Ref<Vector3 | null> = ref(new Vector3());
  onBeforeMount(() => {
    // console.debug("OnBeforeMount::useThree", toValue(canvas));
    // Initialize Three.js

    const gridHelper = new GridHelper(3, 6, 0x000000, "gray");
    gridHelper.rotateX(Math.PI / 2);
    scene.add(gridHelper);
    // const arrowLength = 1.5;
    // const arrowHeadLength = 0.2;
    // const arrowHeadDiameter = 0.1;
    // scene.add(
    //   new ArrowHelper(
    //     new Vector3(1, 0, 0),
    //     new Vector3(0, 0, 0),
    //     arrowLength,
    //     0xff0000,
    //     arrowHeadLength,
    //     arrowHeadDiameter
    //   )
    // );
    // scene.add(
    //   new ArrowHelper(
    //     new Vector3(0, 1, 0),
    //     new Vector3(0, 0, 0),
    //     arrowLength,
    //     0x00ff00,
    //     arrowHeadLength,
    //     arrowHeadDiameter
    //   )
    // );
    // scene.add(
    //   new ArrowHelper(
    //     new Vector3(0, 0, 1),
    //     new Vector3(0, 0, 0),
    //     arrowLength,
    //     0x0000ff,
    //     arrowHeadLength,
    //     arrowHeadDiameter
    //   )
    // );
    scene.add(new HemisphereLight(0x404040, 0xa0a0a0));
    const directionalLight = new DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 1, 2);
    scene.add(directionalLight);
    // scene.add(new THREE.DirectionalLightHelper(directionalLight, 2, "red"));
    const unitSphere = new Mesh(
      new SphereGeometry(1, 60, 60),
      new MeshStandardMaterial({
        color: 0x66ff00,
        roughness: 0.04,
        metalness: 0.2,
        transparent: true,
        opacity: 0.8
      })
    );
    unitSphere.name = "unitSphere";
    scene.add(unitSphere);
  });

  onMounted(() => {
    const cx: HTMLCanvasElement | null = toValue(canvas);
    console.debug("OnMounted::useThree", cx);
    camera = new PerspectiveCamera(75, cx!.width / cx!.height || 1, 0.1, 1000);
    camera.position.set(1, 1, 1);
    camera.up.set(0, 0, 1);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    renderer = new WebGPURenderer({ canvas: cx! });
    renderer.setSize(cx!.width, cx!.height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x336600, 0.4);

    cameraController = new CameraControls(camera, renderer.domElement);
    useEventListener(cameraController, "control", () => {
      // console.debug("Camera control");
    });
    useEventListener(cameraController, "update", () => {
      // console.debug("Camera position changed");
    });
    useEventListener(
      renderer.domElement,
      "mousemove",
      computeMouse3DCoordinates
    );
    let timestamp;
    renderer.setAnimationLoop(() => {
      clock.update(timestamp);
      const delta = clock.getDelta();
      cameraController.update(delta);
      renderer.render(scene, camera);
    });
  });

  onUpdated(() => {
    const cx: HTMLCanvasElement | null = toValue(canvas);
    // console.debug("OnUpdated::useThree", cx?.width, cx?.height);
    camera.aspect = cx!.width / cx!.height;
    camera.updateProjectionMatrix();
    renderer.setSize(cx!.width, cx!.height);
  });

  onBeforeUnmount(() => {
    // Cleanup code here
    if (cameraController) {
      cameraController.dispose();
    }
  });

  function computeMouse3DCoordinates(ev: MouseEvent) {
    // console.debug(
    //   "Mouse move",
    //   elementX.value.toFixed(2),
    //   elementY.value.toFixed(2)
    // );
    mouseViewportCoordNormalized.set(
      2 * (elementX.value / renderer.domElement.clientWidth) - 1,
      1 - 2 * (elementY.value / renderer.domElement.clientHeight)
    );
    rayCaster.setFromCamera(mouseViewportCoordNormalized, camera);
    cursorShape.value = "default";
    mouse3DPosition.value = null;
    rayCaster
      .intersectObjects(scene.children, false)
      .filter(intersection => intersection.object.name.length > 0)
      .forEach(intersection => {
        // console.debug(
        //   "Intersection with",
        //   intersection.object.name,
        //   intersection.distance.toFixed(2),
        //   intersection.point.toFixed(3)
        // );
        cursorShape.value = "crosshair";
        mouse3DPosition.value = intersection.point;
      });
  }
  return { scene, cursorShape, mouse3DPosition };
}

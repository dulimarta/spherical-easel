import {
  ArrowHelper,
  DirectionalLight,
  GridHelper,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  Vector3,
  WebGPURenderer
} from "three/webgpu";
import {
  onBeforeMount,
  onMounted,
  onUpdated,
  readonly,
  ref,
  Ref,
  ShallowRef,
  toValue
} from "vue";

export function useThree(canvas: Ref<HTMLCanvasElement | null>) /*: {
  scene: ShallowRef<Scene>;
  camera: ShallowRef<PerspectiveCamera>;
} */ {
  // Implementation for Three.js setup
  const scene: Scene = new Scene();
  let camera: PerspectiveCamera;
  let renderer: WebGPURenderer;
  // const camera: ShallowRef<PerspectiveCamera> = ref(
  //   new PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000)
  // );
  onBeforeMount(() => {
    // console.debug("OnBeforeMount::useThree", toValue(canvas));
    // Initialize Three.js

    const gridHelper = new GridHelper(5, 5);
    gridHelper.rotateX(Math.PI / 2);
    scene.add(gridHelper);
    const arrowLength = 1.5;
    const arrowHeadLength = 0.2;
    const arrowHeadDiameter = 0.1;
    scene.add(
      new ArrowHelper(
        new Vector3(1, 0, 0),
        new Vector3(0, 0, 0),
        arrowLength,
        0xff0000,
        arrowHeadLength,
        arrowHeadDiameter
      )
    );
    scene.add(
      new ArrowHelper(
        new Vector3(0, 1, 0),
        new Vector3(0, 0, 0),
        arrowLength,
        0x00ff00,
        arrowHeadLength,
        arrowHeadDiameter
      )
    );
    scene.add(
      new ArrowHelper(
        new Vector3(0, 0, 1),
        new Vector3(0, 0, 0),
        arrowLength,
        0x0000ff,
        arrowHeadLength,
        arrowHeadDiameter
      )
    );
    const directionalLight = new DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 1, 4);
    scene.add(directionalLight);
    scene.add(
      new Mesh(
        new SphereGeometry(1, 60, 60),
        new MeshStandardMaterial({
          color: 0x66ff00,
          roughness: 0.01,
          metalness: 0.02
        })
      )
    );
  });

  onMounted(() => {
    const cx: HTMLCanvasElement | null = toValue(canvas);
    console.debug("OnMounted::useThree", cx);
    camera = new PerspectiveCamera(75, cx!.width / cx!.height || 1, 0.1, 1000);
    camera.position.set(1.5, 1.5, 2.1);
    camera.up.set(0, 0, 1);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix;
    renderer = new WebGPURenderer({ canvas: cx! });
    renderer.setSize(cx!.width, cx!.height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x33ff00, 0.2);
    renderer.setAnimationLoop(() => {
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
  // return { scene, camera };
}

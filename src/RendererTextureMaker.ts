import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import {
  Object3D,
  Scene,
  OrthographicCamera,
  WebGLRenderer,
  Vector2,
  Mesh,
} from "three";
import { DilateShader } from "./DilateShader";

export class RendererTextureMaker {
  scene = new Scene();
  camera = new OrthographicCamera();
  renderer = new WebGLRenderer({
    alpha: true,
    preserveDrawingBuffer: true,
    premultipliedAlpha: false,
  });
  composer = new EffectComposer(this.renderer);
  effect1;

  constructor() {
    this.renderer.setClearColor(0xffffff, 0);
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.renderer.setRenderTarget(null);

    this.effect1 = new ShaderPass(DilateShader);
    this.effect1.renderToScreen = true;
    this.composer.addPass(this.effect1);

    this.camera.near = 1;
    this.camera.far = 3;

    this.camera.position.z = 1;
    this.renderer.autoClear = false;
  }

  createMap(object: Object3D, height = 1024, width = 1024) {
    const mesh = object.clone() as Mesh;
    this.effect1.uniforms["u_textureSize"].value = new Vector2(height, width);

    //applyMatrix not working, idk why
    mesh.matrixAutoUpdate = false;
    mesh.matrix.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    mesh.matrixWorld.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);

    this.camera.left = width / -height;
    this.camera.right = width / height;
    this.camera.top = height / width;
    this.camera.bottom = height / -width;

    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);

    this.scene.add(mesh);

    this.composer.render();
    // debugger;
    const src = this.renderer.domElement.toDataURL();

    mesh.remove();
    this.scene.remove(mesh);
    this.renderer.renderLists.dispose();
    mesh.clear();
    mesh.removeFromParent();
    this.renderer.clear();
    this.renderer.clearDepth();

    return src;
  }
}

varying vec3 vPosition;

void main() {
  // Use smoothstep to create a smooth transition for opacity based on height
  float opacity = smoothstep(-0.5, 0.5, vPosition.z);

  // Set the final color with the calculated opacity
  gl_FragColor = vec4(0.0, 1.0, 1.0, opacity);
  // gl_FragColor = vec4(0.0, 1.0, 1.0, 1.0);
}
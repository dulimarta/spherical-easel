varying vec3 vPosition;
uniform vec3 uColor;
uniform float u_time;

void main() {
  // Use smoothstep to create a smooth transition for opacity based on height
  // float opacity = smoothstep(-0.5, 0.5, vPosition.z);
  //float time = abs(sin((u_time * 0.001)));

  // Set the final color with the calculated opacity
  //gl_FragColor = vec4(uColor,abs(sin(time)));
  gl_FragColor = vec4(0.0, 0.0, 1.0, u_time);
}
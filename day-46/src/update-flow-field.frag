#ifdef GL_ES
precision mediump float;
#endif

varying vec3 v_flow;

void main() {
  gl_FragColor = vec4(v_flow, 1);
}

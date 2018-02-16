#ifdef GL_ES
precision mediump float;
#endif

attribute vec2 a_position;
attribute vec3 a_flow_data;

varying vec3 v_flow;

void main() {
  v_flow = a_flow_data;
  gl_Position = vec4(a_position, 0, 1);
}

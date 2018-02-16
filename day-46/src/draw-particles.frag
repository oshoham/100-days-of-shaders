#ifdef GL_ES
precision mediump float;
#endif

varying vec3 v_frag_color;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

void main() {
  gl_FragColor = vec4(v_frag_color, 1.0);
}

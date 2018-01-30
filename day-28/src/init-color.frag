#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texcoord;

uniform vec2 u_resolution;

void main() {
  vec2 st = v_texcoord;
  float x = 2.0 * st.x - 1.0;
  float y = 2.0 * st.y - 1.0;
  gl_FragColor = vec4(vec3(step(1.0, mod(floor((x + 1.0) / 0.2) + floor((y + 1.0) / 0.2), 2.0))), 1.0);
}

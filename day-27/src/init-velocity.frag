#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texcoord;

uniform vec2 u_resolution;

void main() {
  vec2 st = v_texcoord;
  float x = 2.0 * st.x - 1.0;
  float y = 2.0 * st.y - 1.0;
  vec2 velocity = vec2(sin(2.0 * 3.1415 * y), sin(2.0 * 3.1415 * x));
  gl_FragColor = vec4(velocity, 0.0, 1.0);
}

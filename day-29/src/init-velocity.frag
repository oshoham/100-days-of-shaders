#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texcoord;

void main() {
  vec2 st = v_texcoord;
  vec2 pos = vec2(0.5) - st;
  float r = length(pos) * 2.0;
  float a = atan(pos.y, pos.x);
  // vec2 velocity = vec2(cos(a), sin(a)) * sin(r);
  vec2 velocity = vec2(0.5 - 2.0 * step(0.5, st.x), sin(a));
  gl_FragColor = vec4(velocity, 0.0, 1.0);
}

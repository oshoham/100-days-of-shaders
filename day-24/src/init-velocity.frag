#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texcoord;

uniform vec2 u_resolution;

void main() {
  vec2 st = gl_FragCoord.xy / u_resolution.xy;
  gl_FragColor = vec4(sin(2.0 * 3.1415 * st.y), sin(2.0 * 3.1415 * st.x), 0.0, 1.0);
}

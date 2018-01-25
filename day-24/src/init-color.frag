#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texcoord;

uniform vec2 u_resolution;

void main() {
  vec2 st = gl_FragCoord.xy / u_resolution.xy;
  gl_FragColor = vec4(vec3(step(1.0, mod(floor((st.x + 1.0) / 0.2) + floor((st.y + 1.0) / 0.2), 2.0))), 1.0);
}

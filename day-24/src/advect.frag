#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texcoord;

uniform vec2 u_resolution;
uniform float u_delta_t;
uniform float u_rdx;
uniform float u_dissipation;

uniform sampler2D u_velocity;
uniform sampler2D u_source;

void main() {
  vec2 st = gl_FragCoord.xy / u_resolution;
  vec2 velocity = texture2D(u_velocity, st).xy;
  vec2 past_coord = st - u_delta_t * u_rdx * velocity / u_resolution;
  gl_FragColor = u_dissipation * texture2D(u_source, past_coord);
}

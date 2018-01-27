#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texcoord;

uniform vec2 u_resolution;
uniform float u_alpha;
uniform float u_inverse_beta;

uniform sampler2D u_pressure;
uniform sampler2D u_divergence;

void main() {
  vec2 st = gl_FragCoord.xy / u_resolution.xy;
  vec2 texel = 1.0 / u_resolution;

  vec4 divergence = texture2D(u_divergence, st);

  vec4 pressure_top = texture2D(u_pressure, st + texel * vec2(0.0, 1.0));
  vec4 pressure_bottom = texture2D(u_pressure, st - texel * vec2(0.0, 1.0));
  vec4 pressure_right = texture2D(u_pressure, st + texel * vec2(1.0, 0.0));
  vec4 pressure_left = texture2D(u_pressure, st - texel * vec2(1.0, 0.0));

  gl_FragColor = (pressure_top + pressure_bottom + pressure_right + pressure_left + u_alpha * divergence) * u_inverse_beta;
}

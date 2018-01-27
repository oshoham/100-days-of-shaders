#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texcoord;

uniform vec2 u_resolution;
uniform float u_reciprocal_grid_scale;

uniform sampler2D u_velocity;
uniform sampler2D u_pressure;

void main() {
  vec2 st = gl_FragCoord.xy / u_resolution.xy;
  vec2 texel = 1.0 / u_resolution;

  float pressure_top = texture2D(u_pressure, fract(st + texel * vec2(0.0, 1.0))).x;
  float pressure_bottom = texture2D(u_pressure, fract(st - texel * vec2(0.0, 1.0))).x;
  float pressure_right = texture2D(u_pressure, fract(st + texel * vec2(1.0, 0.0))).x;
  float pressure_left = texture2D(u_pressure, fract(st - texel * vec2(1.0, 0.0))).x;

  vec2 gradient = u_reciprocal_grid_scale * vec2(pressure_right - pressure_left, pressure_top - pressure_bottom);
  vec2 old_velocity = texture2D(u_velocity, st).xy;

  gl_FragColor = vec4(old_velocity - gradient, 0.0, 1.0);
}

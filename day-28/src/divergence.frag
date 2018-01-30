#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texcoord;

uniform vec2 u_resolution;
uniform float u_half_reciprocal_grid_scale;

uniform sampler2D u_velocity;

void main() {
  vec2 st = v_texcoord;
  vec2 texel = 1.0 / u_resolution;

  vec2 velocity_top = texture2D(u_velocity, st + texel * vec2(0.0, 1.0)).xy;
  vec2 velocity_bottom = texture2D(u_velocity, st - texel * vec2(0.0, 1.0)).xy;
  vec2 velocity_right = texture2D(u_velocity, st + texel * vec2(1.0, 0.0)).xy;
  vec2 velocity_left = texture2D(u_velocity, st - texel * vec2(1.0, 0.0)).xy;

  float divergence = u_half_reciprocal_grid_scale * ((velocity_right.x - velocity_left.x) + (velocity_top.y - velocity_bottom.y));

  gl_FragColor = vec4(divergence, 0.0, 0.0, 1.0);
}

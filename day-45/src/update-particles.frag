#ifdef GL_ES
precision mediump float;
#endif

#pragma glslify: random = require(glsl-random)

varying vec2 v_particle_coordinates;

uniform float u_speed;
uniform sampler2D u_current_particle_state;
uniform sampler2D u_previous_particle_state;

void main() {
  vec2 current_position = texture2D(u_current_particle_state, v_particle_coordinates).xy;
  vec2 previous_position = texture2D(u_previous_particle_state, v_particle_coordinates).xy;

  vec2 velocity = current_position - previous_position;
  vec2 rand = 0.5 - vec2(random(current_position), random(10.0 * current_position));

  vec2 position = current_position + (0.95 * velocity) + (u_speed * rand);

  gl_FragColor = vec4(position, 0, 1);
}

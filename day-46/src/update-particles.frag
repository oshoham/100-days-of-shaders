#ifdef GL_ES
precision mediump float;
#endif

uniform float u_speed;
uniform sampler2D u_particle_state;
uniform sampler2D u_acceleration;

// index into the texture state
varying vec2 v_particle_coordinates;

void main() {
  vec2 acceleration = texture2D(u_acceleration, v_particle_coordinates).xy;
  vec4 particle = texture2D(u_particle_state, v_particle_coordinates);
  vec2 position = particle.xy;
  vec2 velocity = particle.zw;

  velocity += acceleration;
  position += velocity;

  if (position.x > 1.0) {
    position.x = 1.0;
    velocity.x *= -0.9;
  } else if (position.x < -1.0) {
    position.x = -1.0;
    velocity.x *= -0.9;
  }

  if (position.y > 1.0) {
    position.y = 1.0;
    velocity.y *= -0.9;
  } else if (position.y < -1.0) {
    position.y = -1.0;
    velocity.y *= -0.9;
  }

  gl_FragColor = vec4(position, velocity);
}

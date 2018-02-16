#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texcoord;
varying vec2 v_particle_coordinates;

uniform float u_speed;
uniform float u_friction;
uniform sampler2D u_flow_field;
uniform sampler2D u_previous_acceleration;
uniform sampler2D u_particle_position;

void main() {
  vec4 particle = texture2D(u_particle_position, v_particle_coordinates);
  vec2 particle_position = particle.xy;
  vec2 particle_velocity = particle.zw;

  vec3 flow = texture2D(u_flow_field, 0.5 * (particle_position + 1.0)).xyz;

  vec2 acceleration = vec2(0.0);

  acceleration += flow.xy * flow.z * 0.00002 * u_speed;

  float normal = 1.0;
  float friction_magnitude = u_friction * normal;
  vec2 friction = particle_velocity;
  friction *= -1.0;
  friction *= friction_magnitude;
  acceleration += friction * u_friction;

  gl_FragColor = vec4(acceleration, 0, 1);
}

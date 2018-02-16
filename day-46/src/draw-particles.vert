#ifdef GL_ES
precision mediump float;
#endif

attribute vec2 a_particle_coordinates;

varying vec3 v_frag_color;

uniform float u_point_width;
uniform sampler2D u_particle_state;

void main() {
  vec2 position = texture2D(u_particle_state, a_particle_coordinates).xy;
  v_frag_color = vec3(1.0);
  gl_Position = vec4(position, 0.0, 1.0);
  gl_PointSize = u_point_width;
}

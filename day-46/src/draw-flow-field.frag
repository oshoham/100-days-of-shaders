#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D u_flow_field;

varying vec2 v_particle_coordinates;
varying vec2 v_texcoord;

void main() {
  vec3 flow = texture2D(u_flow_field, v_particle_coordinates).xyz;
  gl_FragColor = vec4(flow, 1.0);
}

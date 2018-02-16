#ifdef GL_ES
precision mediump float;
#endif

attribute vec2 a_position;
attribute vec2 a_texcoord;
varying vec2 v_texcoord;
varying vec2 v_particle_coordinates;

void main() {
  // map bottom left -1,-1 (normalized device coords) to 0,0 (particle texture index)
  // and 1,1 (ndc) to 1,1 (texture)
  v_particle_coordinates = 0.5 * (1.0 + a_position);
  v_texcoord = a_texcoord;
  gl_Position = vec4(a_position, 0.0, 1.0);
}

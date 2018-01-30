#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texcoord;

uniform sampler2D u_current_frame;

void main() {
  vec2 st = v_texcoord;
  gl_FragColor = texture2D(u_current_frame, st);
}

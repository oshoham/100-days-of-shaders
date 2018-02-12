#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texcoord;

uniform sampler2D u_frame;

void main() {
  gl_FragColor = texture2D(u_frame, 1.0 - v_texcoord);
}

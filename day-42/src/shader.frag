#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texcoord;

uniform vec2 u_resolution;

uniform sampler2D u_frame;

void main() {
  gl_FragColor = texture2D(u_frame, v_texcoord);
}

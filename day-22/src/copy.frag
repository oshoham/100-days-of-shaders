#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texcoord;

uniform vec2 u_resolution;
uniform sampler2D u_current_frame;


void main() {
  vec2 st = gl_FragCoord.xy/u_resolution.xy;

  gl_FragColor = texture2D(u_current_frame, st);
}

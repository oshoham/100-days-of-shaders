#ifdef GL_ES
precision mediump float;
#endif

#pragma glslify: map = require('glsl-map')

varying vec2 v_texcoord;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

uniform sampler2D u_current_frame;
uniform sampler2D u_edges;

void main() {
  vec2 st = v_texcoord;
  gl_FragColor = (1.0 - step(0.5, texture2D(u_edges, st))) * texture2D(u_current_frame, st);
}

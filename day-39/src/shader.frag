#ifdef GL_ES
precision mediump float;
#endif

#pragma glslify: map = require('glsl-map')

#define PI 3.14159265359
#define TWO_PI 6.28318530718

varying vec2 v_texcoord;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

uniform sampler2D u_frame;

void main() {
  vec2 st = gl_FragCoord.xy/u_resolution.xy;
  st.x *= u_resolution.x/u_resolution.y;

  st = 1.0 - st;

  float t = u_time * map(u_mouse.x, 0.0, u_resolution.x, 0.0, 10.0);
  float frequency = map(u_mouse.y, 0.0, u_resolution.y, 1.0, 30.0);

  float x = st.x;
  float y = st.y + (sin(t - x * frequency)) * 0.1;
  x += cos(t - st.y * frequency * 0.5) * 0.1;

  vec4 tex_color = texture2D(u_frame, vec2(x,y));

  gl_FragColor = tex_color;
}

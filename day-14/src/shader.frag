#ifdef GL_ES
precision mediump float;
#endif

#pragma glslify: map = require('glsl-map')
#pragma glslify: snoise4 = require('glsl-noise/simplex/4d')

#define PI 3.14159265359
#define TWO_PI 6.28318530718

varying vec2 v_texcoord;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

void main() {
  vec2 st = gl_FragCoord.xy/u_resolution.xy;

  float t = u_time * 0.05;

  float scale = 20.0;

  float noiseRadius = 1.0;

  float n = map(snoise4(vec4(st * scale, noiseRadius * cos(TWO_PI * t), noiseRadius * sin(TWO_PI * t))), -1.0, 1.0, 0.0, 1.0);

  n = smoothstep(0.0, 1.0, n);
  n -= 1.0 - smoothstep(0.0, map(sin(t * 15.0), -1.0, 1.0, 0.3, 0.9), n);
  n += step(0.0, n);

  vec3 color = vec3(n);

  gl_FragColor = vec4(color, 1.0);
}

#ifdef GL_ES
precision mediump float;
#endif

#pragma glslify: map = require('glsl-map')
#pragma glslify: snoise3 = require('glsl-noise/simplex/3d')
#pragma glslify: snoise4 = require('glsl-noise/simplex/4d')

#define PI 3.14159265359
#define TWO_PI 6.28318530718

varying vec2 v_texcoord;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

void main() {
  vec2 st = gl_FragCoord.xy/u_resolution.xy;

  vec3 color = vec3(0.0);

  float t = u_time * 0.05;
  float noiseScale = 5.0;
  float noiseRadius = 1.0;

  vec2 pos = map(st, vec2(0.0), vec2(1.0), vec2(-1.0), vec2(1.0));
  pos = abs(pos);
  float angle = map(atan(pos.y, pos.x), -PI, PI, 0.0, 1.0);
  float radius = map(length(pos), 0.0, 0.5, 0.0, 1.0);
  vec2 polar = vec2(angle, radius);

  float n = map(snoise4(vec4(polar * noiseScale, noiseRadius * cos(TWO_PI * t), noiseRadius * sin(TWO_PI * t))), -1.0, 1.0, 0.0, 1.0);

  n = step(0.5, n);

  color = vec3(n);

  float d = distance(st, vec2(0.5));
  color -= vec3(step(0.5, d));

  gl_FragColor = vec4(color, 1.0);
}

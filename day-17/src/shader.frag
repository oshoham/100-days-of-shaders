#ifdef GL_ES
precision mediump float;
#endif

#pragma glslify: map = require('glsl-map')
#pragma glslify: snoise4 = require('glsl-noise/simplex/4d')
#pragma glslify: random = require('glsl-random')

#define PI 3.14159265359
#define TWO_PI 6.28318530718

varying vec2 v_texcoord;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

float circle(in vec2 st, in vec2 center, in float radius, in float smoothness){
  float diameter = radius * 2.0;
  vec2 dist = st - center;
  return 1.0 - smoothstep(
    diameter - (diameter * smoothness),
    diameter + (diameter * smoothness),
    dot(dist, dist)*4.0
  );
}


float donut(in vec2 st, in vec2 center, in float outerRadius, in float innerRadius, in float smoothness) {
  return circle(st, center, outerRadius, smoothness) - circle(st, center, innerRadius, smoothness);
}

float noisyCircle(in vec2 st, in vec2 center, in float radius, in float smoothness) {
  vec2 pos = map(st, vec2(0.0), vec2(1.0), vec2(-0.5), vec2(0.5));
  float r = map(length(pos), 0.0, 0.5, 0.0, 1.0);
  float a = atan(pos.y,pos.x);

  float f = radius;

  float t = u_time * 0.1;
  float noiseScale = 1.0;
  float noiseRadius = 1.0;
  // float n = map(snoise4(vec4(a, r, noiseRadius * cos(TWO_PI * t), noiseRadius * sin(TWO_PI * t))), -1.0, 1.0, 0.0, 1.0);
  float n = sin(a + u_time) * 0.75;

  f += sin(a * 15.0) * 0.1 * n;//map(n, 0.0, 1.0, 0.0, 1.5);

  return 1.0 - smoothstep(f, f + smoothness, r);
}

float noisyDonut(in vec2 st, in vec2 center, in float radius, in float width, in float smoothness) {
  return noisyCircle(st, center, radius, smoothness) - noisyCircle(st, center, radius - width, smoothness);
}

vec2 rotate2d(in vec2 _st, in float _angle){
  _st -= vec2(0.5);
  _st *= mat2(cos(_angle),-sin(_angle),
             sin(_angle),cos(_angle));
  return _st + vec2(0.5);
}

void main() {
  vec2 st = gl_FragCoord.xy/u_resolution.xy;
  st.x *= u_resolution.x/u_resolution.y;

  st = rotate2d(st, u_time * 0.05);

  vec3 color = vec3(1.0);

  for (float i = 0.0; i < 20.0; i++) {
    color -= noisyDonut(st, vec2(0.5), i * 0.05, 0.02, 0.01);
    st = rotate2d(st, 0.05);
  }

  // st += snoise4(vec4(ipos, noiseRadius * cos(TWO_PI * t), noiseRadius * sin(TWO_PI * t)));
  // float n = map(snoise4(vec4(st, noiseRadius * cos(TWO_PI * t), noiseRadius * sin(TWO_PI * t))), -1.0, 1.0, 0.0, 1.0);
  // float n2 = map(snoise4(vec4(st * 50.0, noiseRadius * cos(TWO_PI * t), noiseRadius * sin(TWO_PI * t))), -1.0, 1.0, 0.0, 1.0);

  // float dx = distance(fpos, vec2(n, 0.5));
  // float dy = distance(fpos, vec2(0.5, n2));
  // float low = 0.1;
  // float high = 0.7;
  // color += smoothstep(low, high, dy);
  // color += smoothstep(low, high, dx);
  // color = 1.0 - color;

  gl_FragColor = vec4(color, 1.0);
}

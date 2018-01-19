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

float noisyCircle(in vec2 st, in vec2 center, in float radius, in float smoothness) {
  vec2 pos = map(st, vec2(0.0), vec2(1.0), vec2(-0.5), vec2(0.5));
  float r = map(length(pos), 0.0, 0.5, 0.0, 1.0);
  float a = atan(pos.y,pos.x);

  float f = radius;

  float n = sin(a + u_time);

  f += sin(a * 15.0) * 0.1 * n;

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

  vec3 color = vec3(1.0);

  for (float i = 0.0; i < 20.0; i++) {
    color -= noisyDonut(st, vec2(0.5), i * 0.05, 0.02, 0.01);
    st = rotate2d(st, map(sin(3.0 * PI / 2.0 + u_time * 0.04), -1.0, 1.0, 0.1, 0.9));
  }

  gl_FragColor = vec4(color, 1.0);
}

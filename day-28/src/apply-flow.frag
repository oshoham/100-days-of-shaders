#ifdef GL_ES
precision mediump float;
#endif

#define TWO_PI 6.28318530718

#pragma glslify: map = require('glsl-map')
#pragma glslify: random = require('glsl-random')

// reference for friction code: https://github.com/shiffman/The-Nature-of-Code-Examples-p5.js/blob/master/chp02_forces/NOC_2_04_forces_friction/mover.js

varying vec2 v_texcoord;

uniform sampler2D u_velocity;
uniform sampler2D u_flow;
uniform float u_flow_scale;
uniform float u_time;
uniform float beats[16];
uniform float u_audio_scale;

uniform bool u_apply_flow;
uniform bool u_apply_audio;
uniform bool u_apply_friction;

// vec2 wave(in vec2 _st) {
//   vec2 pos = map(_st, vec2(0.0), vec2(1.0), vec2(-1.0), vec2(1.0));
//   float len = length(pos);
//   float dist = distance(_st, vec2(0.5));
//   float num_ripples = map(dist, 0.0, 1.0, 12.0, 60.0);
//   // num_ripples = 12.0;
//   float speed = map(dist, 0.0, 1.0, 4.0, 16.0);
//   speed = 4.0;
//   return _st + (pos / len) * cos(len * num_ripples) * 0.03;
// }

float line(in vec2 st, in vec2 p1, in vec2 p2, in float thickness) {
  float a = abs(distance(p1, st));
  float b = abs(distance(p2, st));
  float c = abs(distance(p1, p2));

  if ( a >= c || b >= c ) return 0.0;

  float p = (a + b + c) * 0.5;

  // median to (p1, p2) vector
  float h = 2.0 / c * sqrt( p * ( p - a) * ( p - b) * ( p - c));

  return mix(1.0, 0.0, smoothstep(0.5 * thickness, 1.5 * thickness, h));
}

void main() {
  vec2 st = v_texcoord;
  vec2 flow = texture2D(u_flow, st).xy;
  vec2 velocity = texture2D(u_velocity, st).xy;

  float c = 0.005;
  float normal = 1.0;
  float friction_magnitude = c * normal;
  vec2 friction = normalize(velocity * -1.0) * friction_magnitude;

  vec2 audio_velocity = vec2(0.0);
  if (beats[0] > 0.0) {
    // velocity += wave(st);
    float angle = map(random(vec2(u_time)), 0.0, 1.0, 0.0, TWO_PI);
    float length = u_audio_scale;
    vec2 coords = vec2(random(vec2(u_time + 24.34)), random(vec2(u_time + 79.25)));
    vec2 v = vec2(cos(angle), sin(angle)) * length;
    vec2 end = coords + v;
    if (line(st, coords, end, 0.05) > 0.1) {
      audio_velocity = v;
    }
  }

  vec2 new_velocity = velocity;

  if (u_apply_flow) {
    new_velocity += flow * u_flow_scale;
  }

  if (u_apply_audio) {
    new_velocity += audio_velocity;
  }

  if (u_apply_friction) {
    new_velocity += friction;
  }

  gl_FragColor = vec4(new_velocity, 0.0, 1.0);
}

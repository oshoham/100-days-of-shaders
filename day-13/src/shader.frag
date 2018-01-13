#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.14159265358979323846

#pragma glslify: map = require('glsl-map')
#pragma glslify: ease = require(glsl-easings/quadratic-in-out)

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

// http://thebookofshaders.com/edit.php?log=180112204251

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

float box(vec2 _st, vec2 _size){
  _size = vec2(0.5)-_size*0.5;
  vec2 uv = smoothstep(_size,_size+vec2(1e-4),_st);
  uv *= smoothstep(_size,_size+vec2(1e-4),vec2(1.0)-_st);
  return uv.x*uv.y;
}

vec2 rotate2D (vec2 _st, float _angle) {
  _st -= 0.5;
  _st = mat2(cos(_angle),-sin(_angle),
             sin(_angle),cos(_angle)) * _st;
  _st += 0.5;
  return _st;
}

vec2 scale2D(vec2 _st, vec2 _scale) {
  _st -= 0.5;
  _st = _st * mat2(_scale.x, 0.0,
                  0.0, _scale.y);
  _st += 0.5;
  return _st;
}

void main() {
  vec2 st = gl_FragCoord.xy/u_resolution.xy;

  float time = u_time * 0.2;

  float t = ease(mod(time, 1.0));

  st = st * 10.0;

  float xOffset = map(step(1.0, mod(st.y, 2.0)), 0.0, 1.0, -1.0, 1.0) * t;
  float yOffset = map(step(1.0, mod(st.x, 2.0)), 0.0, 1.0, -1.0, 1.0) * t;

  st.x += step(1.0, mod(time, 2.0)) * xOffset;
  st.y += step(1.0, mod(time + 1.0, 2.0)) * yOffset;

  st = fract(st);

  float angle = map(t, 0.0, 1.0, 0.0, PI * 0.5) * xOffset * yOffset + (step(1.0, mod(time, 2.0)) * PI * 0.5);
  st = rotate2D(st, angle);
  // st = scale2D(st, vec2(sin(u_time * 2.0) + 2.0));

  vec3 color = vec3(1.0);

  float smoothness = 0.1;

  // color -= donut(st, vec2(0.5, 0.0), 0.125, 0.1, smoothness);
  // color -= donut(st, vec2(0.5, 1.0), 0.125, 0.1, smoothness);
  // color -= donut(st, vec2(0.0, 0.5), 0.125, 0.1, smoothness);
  // color -= donut(st, vec2(1.0, 0.5), 0.125, 0.1, smoothness);
  // color -= donut(st, vec2(0.0, 0.0), 0.125, 0.1, smoothness);
  // color -= donut(st, vec2(0.0, 1.0), 0.125, 0.1, smoothness);
  // color -= donut(st, vec2(1.0, 0.0), 0.125,  0.1, smoothness);
  // color -= donut(st, vec2(1.0, 1.0), 0.125, 0.1, smoothness);

  // color -= donut(st, vec2(0.25, 0.0), 0.125, 0.1, smoothness);
  color -= donut(st, vec2(0.75, 0.0), 0.125, 0.1, smoothness);
  color -= donut(st, vec2(0.25, 1.0), 0.125, 0.1, smoothness);
  // color -= donut(st, vec2(0.75, 1.0), 0.125, 0.1, smoothness);

  color -= donut(st, vec2(0.0, 0.25), 0.125, 0.1, smoothness);
  // color -= donut(st, vec2(0.0, 0.75), 0.125, 0.1, smoothness);
  // color -= donut(st, vec2(1.0, 0.25), 0.125, 0.1, smoothness);
  color -= donut(st, vec2(1.0, 0.75), 0.125, 0.1, smoothness);

  color -= donut(st, vec2(0.5), 0.03, 0.02, smoothness);

  // st = rotate2D(st, PI / 4.0);

  // color -= box(st, vec2(0.25)) - box(st, vec2(0.2));

  // st = rotate2D(st, PI / 4.0);

  // color -= box(st, vec2(0.125)) - box(st, vec2(0.05));

  // color = 1.0 - color;

  gl_FragColor = vec4(color,1.0);
}

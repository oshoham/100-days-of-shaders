#ifdef GL_ES
precision mediump float;
#endif

#pragma glslify: map = require('glsl-map')

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

#define PI 3.14159265358979323846

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

void main() {
  vec2 st = gl_FragCoord.xy/u_resolution.xy;

  float t = smoothstep(0.0275, 0.925, (mod(u_time * 0.25, 1.0)));

  st = st * 15.0;

  float xOffset = map(step(1.0, mod(st.y, 2.0)), 0.0, 1.0, -1.0, 1.0) * t;
  float yOffset = map(step(1.0, mod(st.x, 2.0)), 0.0, 1.0, -1.0, 1.0) * t;

  // st.x += step(1.0, mod(t, 2.0)) * xOffset;
  // st.y += step(1.0, mod(t + 1.0, 2.0)) * yOffset;

  st.x += xOffset;
  st.y += yOffset;

  st = fract(st);

  vec3 color = vec3(1.0);

  // color -= donut(st, vec2(0.5), 0.45, 0.4, 0.1);
  color -= donut(st, vec2(0.5), 0.35, 0.3, 0.1);
  // color -= donut(st, vec2(0.5), 0.2625, 0.2125, 0.1);
  color -= donut(st, vec2(0.5), 0.185, 0.145, 0.1);
  // color -= donut(st, vec2(0.5), 0.125, 0.09, 0.1);
  // color -= donut(st, vec2(0.5), 0.075, 0.05, 0.1);
  color -= donut(st, vec2(0.5), 0.04, 0.025, 0.1);
  // color -= donut(st, vec2(0.5), 0.018, 0.01, 0.1);
  color -= donut(st, vec2(0.5), 0.006, 0.0035, 0.1);
  color -= donut(st, vec2(0.5), 0.0015, 0.0005, 0.1);

  color = 1.0 - color;

  gl_FragColor = vec4(color,1.0);
}

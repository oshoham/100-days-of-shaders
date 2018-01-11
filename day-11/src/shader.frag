#ifdef GL_ES
precision mediump float;
#endif

#pragma glslify: map = require('glsl-map')

varying vec2 v_texcoord;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform sampler2D u_frame;

highp float random(vec2 co)
{
  highp float a = 12.9898;
  highp float b = 78.233;
  highp float c = 43758.5453;
  highp float dt= dot(co.xy, vec2(a, b));
  highp float sn= mod(dt, 3.14);
  return fract(sin(sn) * c);
}

void main(){
  vec2 st = gl_FragCoord.xy / u_resolution.xy;

  vec2 texCoords = 1.0 - st;

  float numDivisions = map(u_mouse.x, 0.0, u_resolution.x, 1.0, 100.0);
  // float numXDivisions = map(u_mouse.x, 0.0, u_resolution.x, 1.0, 100.0);
  // float numYDivisions = map(u_mouse.y, 0.0, u_resolution.y, 1.0, 100.0);
  // vec2 numDivisions = vec2(numXDivisions, numYDivisions);

  float division = map(floor(map(st.x, 0.0, 1.0, 0.0, numDivisions)), 0.0, numDivisions, 0.0, 1.0);
  // float division = map(floor(map(st.y, 0.0, 1.0, 0.0, numDivisions)), 0.0, numDivisions, 0.0, 1.0);
  // vec2 division = map(floor(map(st, vec2(0.0), vec2(1.0), vec2(0.0), vec2(numDivisions))), vec2(0.0), vec2(numDivisions), vec2(0.0), vec2(1.0));

  vec2 randomSeed = vec2(division);

  float direction = map(floor(step(0.5, random(randomSeed))), 0.0, 1.0, -1.0, 1.0);

  vec2 speed = vec2(0.05, 0.05);

  texCoords.x = mod(texCoords.x + random(randomSeed) + u_time * speed.x * direction, 1.0);
  texCoords.y = mod(texCoords.y + random(randomSeed) + u_time * speed.y * direction, 1.0);

  vec4 texColor = texture2D(u_frame, texCoords);

  gl_FragColor = texColor;
}

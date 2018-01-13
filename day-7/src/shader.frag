#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texcoord;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

float circle (in vec2 st, in vec2 center, in float radius) {
  float pct = distance(st, center);
  return 1.0 - smoothstep(radius - 0.003, radius, pct);
}

float circle2(in vec2 st, in vec2 center, in float radius){
  float diameter = radius * 2.0;
  vec2 dist = st - center;
  return 1.0 - smoothstep(
    diameter - (diameter * 0.01),
    diameter + (diameter * 0.01),
    dot(dist, dist)*4.0
  );
}

float map(float value, float inMin, float inMax, float outMin, float outMax) {
  return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}

void main(){
  vec2 st = gl_FragCoord.xy/u_resolution;

  float t = u_time * 0.5;

  float minDist = 0.1;
  float maxDist = 0.9;

  float a = map(sin(t), -1.0, 1.0, minDist, maxDist);
  float b = map(sin(t), -1.0, 1.0, maxDist, minDist);
  float c = map(cos(t), -1.0, 1.0, minDist, maxDist);
  float d = map(cos(t), -1.0, 1.0, maxDist, minDist);

  float t2 = t * 0.25 + 1.5;

  float e = map(sin(t2), -1.0, 1.0, minDist, maxDist);
  float f = map(sin(t2), -1.0, 1.0, maxDist, minDist);
  float g = map(cos(t2), -1.0, 1.0, minDist, maxDist);
  float h = map(cos(t2), -1.0, 1.0, maxDist, minDist);

  float t3 = t * 0.125 + 0.75;

  float i = map(sin(t3), -1.0, 1.0, minDist, maxDist);
  float j = map(sin(t3), -1.0, 1.0, maxDist, minDist);
  float k = map(cos(t3), -1.0, 1.0, minDist, maxDist);
  float l = map(cos(t3), -1.0, 1.0, maxDist, minDist);

  float pct = 0.0;

  // pct = min(distance(st,vec2(c, a)), distance(st,vec2(d, b)));;

  float exponent = 0.1;

  pct = min(distance(st,vec2(c, a)),distance(st,vec2(d, b))) * distance(st, vec2(a, c)) * distance(st, vec2(b, d));
  pct = min(pct, min(distance(st,vec2(g, e)),distance(st,vec2(h, f))) * distance(st, vec2(e, g)) * distance(st, vec2(f, h)));
  pct = min(pct, min(distance(st,vec2(k, i)),distance(st,vec2(l, j))) * distance(st, vec2(i, k)) * distance(st, vec2(j, l)));
  pct = pow(pct, exponent);

  vec3 color = vec3(1.0 - pct);

  gl_FragColor = vec4( color, 1.0 );
}

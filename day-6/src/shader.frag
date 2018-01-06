#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

float rect (in vec2 st, in vec2 bottomLeft, in vec2 size, float borderWidth) {
  vec2 left = vec2(
    step(bottomLeft.x, st.x) - step(bottomLeft.x + borderWidth, st.x),
    step(bottomLeft.y, st.y) - step(bottomLeft.y + size.y, st.y)
  );
  vec2 right = vec2(
    step(bottomLeft.x + size.x - borderWidth, st.x) - step(bottomLeft.x + size.x, st.x),
    left.y
  );
  vec2 bottom = vec2(
    step(bottomLeft.x + borderWidth, st.x) - step(bottomLeft.x + size.x - borderWidth, st.x),
    step(bottomLeft.y, st.y) - step(bottomLeft.y + borderWidth, st.y)
  );
  vec2 top = vec2(
    bottom.x,
    step(bottomLeft.y + size.y - borderWidth, st.y) - step(bottomLeft.y + size.y, st.y)
  );
  return left.x * left.y + right.x * right.y + top.x * top.y + bottom.x * bottom.y;
}

float rectFromCenter (in vec2 st, in vec2 center, in vec2 size, float borderWidth) {
  return rect(st, center - size * 0.5, size, borderWidth);
}

float map(float value, float inMin, float inMax, float outMin, float outMax) {
  return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}

vec3 hsb2rgb( in vec3 c ){
  vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
                           6.0)-3.0)-1.0,
                   0.0,
                   1.0 );
  rgb = rgb*rgb*(3.0-2.0*rgb);
  return c.z * mix(vec3(1.0), rgb, c.y);
}

void main() {
  vec2 st = gl_FragCoord.xy/u_resolution.xy;

  float t = u_time * 0.02;

  vec3 rectangles = vec3(0.0);

  for (float i = 0.0; i < 30.0; i++) {
      float offset = map(i, 0.0, 30.0, 0.0, 1.0);
      float r = rectFromCenter(st, vec2(0.5), vec2(mod(t + offset, 1.0)), 0.002);
      rectangles += vec3(r) * hsb2rgb(vec3(t + offset + u_time * 0.1, 1.0, 1.0));
  }
  vec3 color = rectangles;

  gl_FragColor = vec4(color,1.0);
}

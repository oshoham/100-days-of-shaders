#define PI 3.14159265359
#define TWO_PI 6.28318530718

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

float circle(in vec2 st, in vec2 center, in float radius, in float smoothness) {
  float diameter = radius * 2.0;
  vec2 dist = st - center;
  return 1.0 - smoothstep(
    diameter - (diameter * smoothness),
    diameter + (diameter * smoothness),
    dot(dist, dist) * 4.0
  );
}

float donut(in vec2 st, in vec2 center, in float outerRadius, in float innerRadius, in float smoothness) {
  return circle(st, center, outerRadius, smoothness) - circle(st, center, innerRadius, smoothness);
}

float box(in vec2 st, in vec2 size) {
  size = vec2(0.5) - size * 0.5;
  vec2 uv = smoothstep(size, size + vec2(1e-4), st);
  uv *= smoothstep(size, size + vec2(1e-4), vec2(1.0) - st);
  return uv.x * uv.y;
}

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

vec3 hsb2rgb(in vec3 c){
  vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
                           6.0)-3.0)-1.0,
                   0.0,
                   1.0);
  rgb = rgb*rgb*(3.0-2.0*rgb);
  return c.z * mix( vec3(1.0), rgb, c.y);
}

float brightness(in vec3 c) {
  return max(c.r, max(c.g, c.b));
}

float luminance(in vec3 c) {
  return 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
}

float lightness(in vec3 c) {
  return (c.r + c.g + c.b) / 3.0;
}

const mat3 Gx = mat3(
  -1.0, -2.0, -1.0,
  0.0, 0.0, 0.0,
  1.0, 2.0, 1.0
);

const mat3 Gy = mat3(
  -1.0, 0.0, 1.0,
  -2.0, 0.0, 2.0,
  -1.0, 0.0, 1.0
);

float sobel_edge_detection(in vec2 st, in sampler2D tex) {
  vec2 texel = 1.0 / u_resolution;

  float value_gx = 0.0;
  float value_gy = 0.0;

  for (int i = 0; i < 3; i++) {
    for (int j = 0; j < 3; j++) {
      // vec4 tex_color = texture2D(tex, st + texel * vec2(i - 1, j - 1));
      vec4 tex_color = blur(tex, st + texel * vec2(i - 1, j - 1), u_resolution, vec2(1.0, 0.0));
      float intensity = tex_color.r;
      value_gx += Gx[i][j] * intensity;
      value_gy += Gy[i][j] * intensity;
    }
  }

  return length(vec2(value_gx, value_gy));
}

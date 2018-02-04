#define PI 3.14159265359
#define TWO_PI 6.28318530718

// 2D Drawing Functions

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

// Image Processing

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

// Signed Distance Functions

float vmax(vec3 v) {
  return max(max(v.x, v.y), v.z);
}

float sphere_sdf(vec3 point, vec3 center, float radius) {
  return distance(point, center) - radius;
}

float box_sdf(vec3 point, vec3 center, vec3 size) {
  float x = max(
    point.x - center.x - size.x / 2.0,
    center.x - point.x - size.x / 2.0
  );

  float y = max(
    point.y - center.y - size.y / 2.0,
    center.y - point.y - size.y / 2.0
  );

  float z = max(
    point.z - center.z - size.z / 2.0,
    center.z - point.z - size.z / 2.0
  );

  return vmax(vec3(x, y, z));
}

float box_sdf_fast(vec3 point, vec3 center, vec3 size) {
  return vmax(abs(point - center) - size * 0.5);
}

float cylinder_sdf(vec3 point, float diameter, float height) {
  vec2 h = vec2(diameter, height);
  vec2 d = abs(vec2(length(point.xz), point.y)) - h;
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

float sdf_union(float d1, float d2) {
  return min(d1, d2);
}

float sdf_subtraction(float d1, float d2) {
  return max(-d1, d2);
}

float sdf_intersection(float d1, float d2) {
  return max(d1, d2);
}

vec3 sdf_twist(vec3 point, float scale) {
  float c = cos(scale * point.y + scale);
  float s = sin(scale * point.y + scale);
  mat2 m = mat2(c, -s, s, c);
  return vec3(m * point.xz, point.y);
}

vec3 sdf_bend(vec3 point, float scale) {
  float c = cos(scale * point.y);
  float s = sin(scale * point.y);
  mat2 m = mat2(c, -s, s, c);
  return vec3(m * point.xy, point.z);
}

// 3D Transformation Matrices

mat4 translate(vec3 v) {
  return mat4(
    vec4(1.0, 0.0, 0.0, 0.0),
    vec4(0.0, 1.0, 0.0, 0.0),
    vec4(0.0, 0.0, 1.0, 0.0),
    vec4(v.x, v.y, v.z, 1.0),
  );
}

mat4 scale(vec3 s) {
  return mat4(
    vec4(s.x, 0.0, 0.0, 0.0),
    vec4(0.0, s.y, 0.0, 0.0),
    vec4(0.0, 0.0, s.z, 0.0),
    vec4(0.0, 0.0, 0.0, 1.0)
  );
}

mat4 rotate_x(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat4(
    vec4(1.0, 0.0, 0.0, 0.0),
    vec4(0.0, c, -s, 0.0),
    vec4(0.0, s, c, 0.0),
    vec4(0.0, 0.0, 0.0, 1.0)
  );
}

mat4 rotate_y(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat4(
    vec4(c, 0.0, s, 0.0),
    vec4(0.0, 1.0, 0.0, 0.0),
    vec4(-s, 0.0, c, 0.0),
    vec4(0.0, 0.0, 0.0, 1.0)
  );
}

mat4 rotate_z(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat4(
    vec4(c, s, 0.0, 0.0),
    vec4(-s, c, 0.0, 0.0),
    vec4(0.0, 0.0, 1.0, 0.0),
    vec4(0.0, 0.0, 0.0, 1.0)
  );
}

// Shaping Functions

float interpolate(float v1, float v2, float a) {
  return a * v1 + (1.0 - a) * v2;
}

// exponential smooth min (k = 32);
float smin(in float a, in float b, in float k) {
  float res = exp(-k * a) + exp(-k * b);
  return -log(max(0.0001, res)) / k;
}

// polynomial smooth min (k = 0.1);
float smin(in float a, in float b, in float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// power smooth min (k = 8);
float smin(in float a, in float b, in float k) {
  a = pow(a, k);
  b = pow(b, k);
  return pow((a * b) / (a + b), 1.0 / k);
}

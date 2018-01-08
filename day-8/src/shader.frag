#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texcoord;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform sampler2D u_frame;

float map(float value, float inMin, float inMax, float outMin, float outMax) {
  return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
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

vec4 blur(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
  vec4 color = vec4(0.0);
  vec2 off1 = vec2(1.3846153846) * direction;
  vec2 off2 = vec2(3.2307692308) * direction;
  color += texture2D(image, uv) * 0.2270270270;
  color += texture2D(image, uv + (off1 / resolution)) * 0.3162162162;
  color += texture2D(image, uv - (off1 / resolution)) * 0.3162162162;
  color += texture2D(image, uv + (off2 / resolution)) * 0.0702702703;
  color += texture2D(image, uv - (off2 / resolution)) * 0.0702702703;
  return color;
}

// kernel definitions (in glsl matrices are filled in column-major order)
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

float sobelEdgeDetection(in vec2 st, in sampler2D tex) {
  vec2 texel = 1.0 / u_resolution;

  float valueGx = 0.0;
  float valueGy = 0.0;

  for (int i = 0; i < 3; i++) {
    for (int j = 0; j < 3; j++) {
      vec4 texColor = texture2D(tex, st + texel * vec2(i - 1, j - 1));
      // vec4 texColor = blur(tex, st + texel * vec2(i - 1, j - 1), u_resolution, vec2(1.0, 0.0));
      // float intensity = texColor.r;
      // float intensity = brightness(texColor.rgb);
      // float intensity = lightness(texColor.rgb);
      float intensity = luminance(texColor.rgb);
      valueGx += Gx[i][j] * intensity;
      valueGy += Gy[i][j] * intensity;
    }
  }

  // first column
  // float tx0y0 = texture2D(tex, st + texel * vec2(-1.0, -1.0)).r;
  // float tx0y1 = texture2D(tex, st + texel * vec2(-1.0, 0.0)).r;
  // float tx0y2 = texture2D(tex, st + texel * vec2(-1.0, 1.0)).r;

  // // second column
  // float tx1y0 = texture2D(tex, st + texel * vec2(0.0, -1.0)).r;
  // float tx1y1 = texture2D(tex, st + texel * vec2(0.0, 0.0)).r;
  // float tx1y2 = texture2D(tex, st + texel * vec2(0.0, 1.0)).r;

  // // third column
  // float tx2y0 = texture2D(tex, st + texel * vec2(1.0, -1.0)).r;
  // float tx2y1 = texture2D(tex, st + texel * vec2(1.0, 0.0)).r;
  // float tx2y2 = texture2D(tex, st + texel * vec2(1.0, 1.0)).r;

  // // gradient value in x direction
  // float valueGx = Gx[0][0] * tx0y0 + Gx[1][0] * tx1y0 + Gx[2][0] * tx2y0 + Gx[0][1] * tx0y1 + Gx[1][1] * tx1y1 + Gx[2][1] * tx2y1 + Gx[0][2] * tx0y2 + Gx[1][2] * tx1y2 + Gx[2][2] * tx2y2;

  // // gradient value in y direction
  // float valueGy = Gy[0][0] * tx0y0 + Gy[1][0] * tx1y0 + Gy[2][0] * tx2y0 + Gy[0][1] * tx0y1 + Gy[1][1] * tx1y1 + Gy[2][1] * tx2y1 + Gy[0][2] * tx0y2 + Gy[1][2] * tx1y2 + Gy[2][2] * tx2y2;

  // magnitute of the total gradient
  return length(vec2(valueGx, valueGy));
}

void main(){
  vec2 st = gl_FragCoord.xy/u_resolution.xy;

  float edges = sobelEdgeDetection(1.0 - st, u_frame);

  // vec3 color = vec3(edges);
  // vec3 color = vec3(1.0 - edges);
  vec3 color = texture2D(u_frame, 1.0 - st).rgb - edges;

  gl_FragColor = vec4(color, 1.0);
}

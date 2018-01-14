#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform sampler2D u_frame;

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
      float intensity = texColor.r;
      valueGx += Gx[i][j] * intensity;
      valueGy += Gy[i][j] * intensity;
    }
  }

  return length(vec2(valueGx, valueGy));
}

void main() {
  vec2 st = gl_FragCoord.xy/u_resolution.xy;
  float edges = sobelEdgeDetection(st, u_frame);
  vec3 color = 1.0 - vec3(edges);
  // vec3 color = texture2D(u_frame, 1.0 - st).rgb - edges;
  gl_FragColor = vec4(color, 1.0);
}

#ifdef GL_ES
precision mediump float;
#endif

#pragma glslify: blur = require('glsl-fast-gaussian-blur')

varying vec2 v_texcoord;

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

float sobel_edge_gradients(in vec2 st, in sampler2D tex) {
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

void main() {
  vec2 st = v_texcoord;
  vec3 color = vec3(0.0);

  st = 1.0 - st;

  color = vec3(sobel_edge_gradients(st, u_frame));

  gl_FragColor = vec4(color, 1.0);
}

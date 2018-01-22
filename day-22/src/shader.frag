#ifdef GL_ES
precision mediump float;
#endif

#pragma glslify: map = require('glsl-map')
#pragma glslify: blur = require('glsl-fast-gaussian-blur')

varying vec2 v_texcoord;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform sampler2D u_previous_frame;
uniform sampler2D u_current_frame;

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

vec2 sobel_edge_gradients(in vec2 st, in sampler2D tex) {
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

  return vec2(value_gx, value_gy);
}

vec3 hsb2rgb(in vec3 c){
  vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
                           6.0)-3.0)-1.0,
                   0.0,
                   1.0);
  rgb = rgb*rgb*(3.0-2.0*rgb);
  return c.z * mix( vec3(1.0), rgb, c.y);
}

void main() {
  vec2 st = gl_FragCoord.xy/u_resolution.xy;
  vec3 color = vec3(0.0);

  st = 1.0 - st;

  vec2 previous_gradients = sobel_edge_gradients(st, u_previous_frame);
  vec2 current_gradients = sobel_edge_gradients(st, u_current_frame);

  vec3 delta_t = texture2D(u_current_frame, st).rgb - texture2D(u_previous_frame, st).rgb;
  float sum_delta_t = (delta_t.r + delta_t.g + delta_t.b);
  float delta_x = (previous_gradients.x + current_gradients.x) * 3.0;
  float delta_y = (previous_gradients.y + current_gradients.y) * 3.0;

  float gradient_length = length(vec3(delta_x, delta_y, 1.0));

  float scale = 20.0;
  float threshold = 1.0;

  vec2 flow = scale * sum_delta_t * vec2(delta_x, delta_y) / gradient_length;

  float len_old = length(vec3(flow.x, flow.y, 0.00316227766));
  float len_new = max(len_old - threshold, 0.0);

  flow = len_new * flow / len_old;

  // draw direction of flow as hue
  if (length(flow) > 1.0) {
    float hue = (atan(flow.y, flow.x) + 3.14159265) / (3.14159265 * 2.0);
    color += hsb2rgb(vec3(hue, 1.0, 1.0));
  }

  gl_FragColor = vec4(color, 1.0);
}

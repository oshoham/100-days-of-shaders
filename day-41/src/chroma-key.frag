#ifdef GL_ES
precision mediump float;
#endif

#pragma glslify: map = require('glsl-map')

#define PI 3.14159265359
#define TWO_PI 6.28318530718

// chromakey shader reference: https://www.shadertoy.com/view/4dX3WN
// jit.chromakey algorithm reference: https://docs.cycling74.com/max5/tutorials/jit-tut/jitterchapter10.html

varying vec2 v_texcoord;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform float u_tolerance;
uniform float u_fade;
uniform float u_minkey;
uniform float u_maxkey;

uniform sampler2D u_chroma_key_reference_color;
uniform sampler2D u_foreground;
uniform sampler2D u_background;

vec3 rgb2hsb(in vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz),
               vec4(c.gb, K.xy),
               step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r),
               vec4(c.r, p.yzx),
               step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)),
              d / (q.x + e),
              q.x);
}

float luminance(in vec3 c) {
  return 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
}

float chroma_key(vec3 color, vec3 reference_color) {
  vec3 weights = vec3(4.0, 1.0, 2.0);

  vec3 hsb = rgb2hsb(color);
  vec3 target = rgb2hsb(reference_color);

  float dist = length(weights * (target - hsb));

  if (dist <= u_tolerance) {
    return u_maxkey;
  }

  if (dist > u_tolerance + u_fade) {
    return u_minkey;
  }

  return 1.0 - clamp(3.0 * dist - 1.5, 0.0, 1.0);
}

void main() {
  vec2 st = gl_FragCoord.xy/u_resolution.xy;
  st.x *= u_resolution.x/u_resolution.y;

  vec3 reference_color = texture2D(u_chroma_key_reference_color, vec2(0.0)).rgb;
  vec3 foreground_color = texture2D(u_foreground, st).rgb;
  vec3 background_color = texture2D(u_background, st).rgb;

  float incrustation = chroma_key(foreground_color, reference_color);

  vec3 color = mix(foreground_color, background_color, incrustation);

  gl_FragColor = vec4(color, 1.0);
}

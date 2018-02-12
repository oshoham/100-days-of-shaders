#ifdef GL_ES
precision mediump float;
#endif

#pragma glslify: map = require('glsl-map')

#define PI 3.14159265359
#define TWO_PI 6.28318530718

// chromakey shader reference: https://www.shadertoy.com/view/4dX3WN
// jit.chromakey algorithm reference: https://docs.cycling74.com/max5/tutorials/jit-tut/jitterchapter10.html
// alternative chromakey algorithm reference: https://cycling74.com/forums/removing-collor-without-noise-chromakey-problem
// the best reference: https://github.com/j74/Jitter-GLSL-Shaders/blob/master/Jitter%20Shaders%20Collection/0023-co.chromakey.jxs

varying vec2 v_texcoord;

uniform vec2 u_mouse;
uniform float u_time;
uniform float u_tolerance;
uniform float u_fade;
uniform float u_minkey;
uniform float u_maxkey;

uniform sampler2D u_chroma_key_reference_color;
uniform sampler2D u_foreground;
uniform sampler2D u_background;

float chroma_key(vec3 color, vec3 reference_color) {
  float dist = dot(abs(color - reference_color), vec3(0.333333));

  if (dist <= u_tolerance) {
    return u_maxkey;
  }

  if (dist > u_tolerance + u_fade) {
    return u_minkey;
  }

  float scale = smoothstep(u_tolerance - u_fade, u_tolerance + u_fade, dist);

  return mix(u_minkey, u_maxkey, scale);
}

void main() {
  vec3 reference_color = texture2D(u_chroma_key_reference_color, vec2(0.0)).rgb;
  vec3 foreground_color = texture2D(u_foreground, v_texcoord).rgb;
  vec3 background_color = texture2D(u_background, v_texcoord).rgb;

  float incrustation = chroma_key(foreground_color, reference_color);

  vec3 color = mix(foreground_color, background_color, incrustation);

  gl_FragColor = vec4(color, 1.0);
}

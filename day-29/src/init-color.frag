#ifdef GL_ES
precision mediump float;
#endif

#pragma glslify: random = require('glsl-random')
#pragma glslify: map = require('glsl-map')

varying vec2 v_texcoord;

vec3 hsb2rgb(in vec3 c){
  vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
                           6.0)-3.0)-1.0,
                   0.0,
                   1.0);
  rgb = rgb*rgb*(3.0-2.0*rgb);
  return c.z * mix( vec3(1.0), rgb, c.y);
}

vec3 yuv2rgb(in vec3 c) {
    return c * mat3(1.0, 0.0, 1.13983,
                    1.0, -0.39465, -0.58060,
                    1.0, 2.03211, 0.0);
}

void main() {
  vec2 st = v_texcoord;
  gl_FragColor = vec4(hsb2rgb(vec3(mod(random(st + 0.1) + 0.5, 1.0), 1.0, 1.0)), 1.0);
  // gl_FragColor = vec4(hsb2rgb(vec3(0.5 + random(st + 0.5) * 0.5, 1.0, 0.5 + random(st) * 0.4)), 1.0);
  // gl_FragColor = vec4(hsb2rgb(vec3(mod(0.5 + random(st + 0.5) * 0.5, 1.0), 0.7 + random(st * 2.0) * 0.4, 0.6 + random(st) * 0.4)), 1.0);
}

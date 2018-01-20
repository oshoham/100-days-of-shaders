#ifdef GL_ES
precision mediump float;
#endif

#pragma glslify: map = require('glsl-map')
#pragma glslify: random = require('glsl-random')
#pragma glslify: snoise4 = require('glsl-noise/simplex/4d')

#define PI 3.14159265359
#define TWO_PI 6.28318530718

varying vec2 v_texcoord;

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_frame;
uniform sampler2D u_noise;


void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;

    st = 1.0 - st;

    float noise = texture2D(u_noise, st).r;

    gl_FragColor = texture2D(u_frame, st * noise);
}

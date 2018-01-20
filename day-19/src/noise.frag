#ifdef GL_ES
precision mediump float;
#endif

#pragma glslify: map = require('glsl-map')
#pragma glslify: snoise2 = require('glsl-noise/simplex/2d')
#pragma glslify: snoise4 = require('glsl-noise/simplex/4d')

#define PI 3.14159265359
#define TWO_PI 6.28318530718
#define NUM_OCTAVES 5

varying vec2 v_texcoord;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;

float fbm ( in vec2 _st) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    // Rotate to reduce axial bias
    mat2 rot = mat2(cos(0.5), sin(0.5),
                    -sin(0.5), cos(0.50));
    for (int i = 0; i < NUM_OCTAVES; ++i) {
        v += a * snoise2(_st);
        _st = rot * _st * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    vec3 color = vec3(0.0);

    vec2 mouse = u_mouse / u_resolution;

    float t = u_time * 0.5 * (1.0 - smoothstep(0.1, 0.5, distance(1.0 - st, mouse)));

    vec2 q = vec2(0.);
    q.x = fbm( st + 0.00*t);
    q.y = fbm( st + vec2(1.0));

    vec2 r = vec2(0.);
    r.x = fbm( st + 1.0*q + vec2(1.7,9.2)+ 0.15*t );
    r.y = fbm( st + 1.0*q + vec2(8.3,2.8)+ 0.126*t);

    float f = fbm(st+r);

    color = mix(vec3(0.0),
                vec3(1.0),
                clamp((f*f)*4.0,0.0,1.0));

    color = mix(color,
                vec3(1.0),
                clamp(length(q),0.0,1.0));

    color = mix(color,
                vec3(1.0),
                clamp(length(r.x),0.0,1.0));

    gl_FragColor = vec4(color, 1.0);
}

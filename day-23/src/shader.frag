#ifdef GL_ES
precision mediump float;
#endif

#pragma glslify: map = require('glsl-map')
#pragma glslify: snoise2 = require('glsl-noise/simplex/2d')

#define NUM_OCTAVES 5

varying vec2 v_texcoord;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;

vec3 ivory = vec3(1.0, 0.9, 0.8);
vec3 sunset = vec3(0.9, 0.3, 0.3);
vec3 navy = vec3(0.0, 0.1, 0.2);
vec3 turquoise = vec3(0.0, 1.0, 0.7);

float fbm(in vec2 _st) {
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

    st = 1.0 - st;

    vec2 mouse = u_mouse / u_resolution;
    float mouseDist = distance(1.0 - st, mouse);

    float t = u_time * 0.25;

    vec2 q = vec2(0.0);
    q.x = fbm(st + 0.1 * t);
    q.y = fbm(st + vec2(1.0));


    vec2 r = vec2(0.0);
    r.x = fbm(st + 1.0 * q + vec2(1.7,9.2) + 0.15 * t * 3.0);
    r.y = fbm(st + 1.0 * q + vec2(8.3,2.8) + 0.126 * t * 6.0);

    float f = fbm(st + r / (mouseDist * 4.0));

    color = mix(vec3(0.0),
                vec3(1.0),
                clamp((f*f)*100.0,0.0,1.0));

    color = mix(color,
                vec3(0.0),
                clamp(length(q),0.0,1.0));

    color = mix(color,
                vec3(0.0),
                clamp(length(r),0.0,1.0));

    // color = mix(color,
    //             vec3(1.0),
    //             clamp(mouseDist,0.0,1.0));

    // color = step(vec3(0.5), color);

    gl_FragColor = vec4(f * f + color, 1.0);
}

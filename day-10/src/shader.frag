#ifdef GL_ES
precision mediump float;
#endif

#pragma glslify: map = require('glsl-map')

#define PI 3.14159265359
#define TWO_PI 6.28318530718

varying vec2 v_texcoord;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

float circle(in vec2 st, in vec2 center, in float radius, in float smoothness){
    float diameter = radius * 2.0;
    vec2 dist = st - center;
  return 1.0 - smoothstep(
        diameter - (diameter * smoothness),
        diameter + (diameter * smoothness),
        dot(dist, dist)*4.0
    );
}

void main(){
    vec2 st = gl_FragCoord.xy/u_resolution.xy;

    st *= 15.0;

    float index = 0.0;
    index += step(1., mod(st.x,2.0));
    index += step(1., mod(st.y,2.0)) * 2.0;

    st = fract(st);

    float radius = map(sin(u_time * 2.5 + index * 4.5), -1.0, 1.0, 0.00001, 0.125);
    vec3 circles = vec3(circle(st, vec2(0.5), radius, 0.15));
    vec3 background = #f9f9f9;
    // background = #fbf7f5;
    vec3 foreground = #ffaba8;
    vec3 color = (1.0 - circles) * background + circles * foreground;

    gl_FragColor = vec4(color, 1.0);
}

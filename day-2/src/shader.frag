#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.14159265359

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

vec3 normalizeRGB(float r, float g, float b) {
    return vec3(r, g, b) / 255.0;
}

float impulse(float k, float x){
    float h = k*x;
    return h*exp(1.0-h);
}

void main() {
    vec3 darkPurple = normalizeRGB(55.0, 65.0, 86.0);
    vec3 orange = normalizeRGB(249.0, 151.0, 60.0);
    vec3 middlePurple = normalizeRGB(97.0, 107.0, 165.0);
    // vec3 red = normalizeRGB(193.0, 40.0, 32.0);

    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    vec3 color = vec3(0.0);

    vec3 pct = vec3(impulse(0.6, st.y));
    // vec3 middleRedPct = vec3(pow(st.y, 2.0));

    pct.r = smoothstep(0.0, 1.3, st.y);

    color = mix(orange, darkPurple, pct);
    // color = mix(color, red, middleRedPct);

    gl_FragColor = vec4(color,1.0);
}


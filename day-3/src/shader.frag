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

float smoothPulse(float k, float x) {
    return pow(abs(sin(x)), k);
}

void main() {
    vec3 darkPurple = normalizeRGB(55.0, 65.0, 86.0);
    vec3 orange = normalizeRGB(249.0, 151.0, 60.0);

    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    vec3 color = vec3(0.0);

    float t = u_time * 0.2;

    float impulseEasing = 1.0 - smoothPulse(3.0, t) + 0.6;

    vec3 pct = vec3(impulse(impulseEasing, st.y));

    float stepEasing = 1.0 - smoothPulse(3.0, t + 1.6) * 0.7 + 0.5;
    // stepEasing = 1.3;
    pct.r = smoothstep(0.1, stepEasing, st.y);

    color = mix(orange, darkPurple, pct);

    gl_FragColor = vec4(color,1.0);
}

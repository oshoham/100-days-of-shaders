#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

float rect(in vec2 st, in vec2 size){
  size = 0.25-size*0.25;
  vec2 uv = step(size,st*(1.0-st));
  return uv.x*uv.y;
}

float map(float value, float inMin, float inMax, float outMin, float outMax) {
  return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}

void main() {
  vec2 st = gl_FragCoord.xy/u_resolution.xy;

  vec3 deepSkyBlue = vec3(0.0, 0.749, 1.0);
  vec3 skyBlue = vec3(0.529, 0.808, 0.922);
  vec3 lightSkyBlue = vec3(0.529, 0.808, 0.98);
  vec3 robinsEggBlue = vec3(0.106, 0.643, 0.898);
  vec3 blue = robinsEggBlue;

  vec3 white = vec3(1.0);

  vec3 orange = vec3(0.975,0.382,0.0);
  vec3 red = vec3(0.955,0.082,0.229);
  vec3 pink = vec3(0.954,0.761,0.975);
  vec3 neonPink = vec3(0.900,0.058,0.805);
  vec3 purple = vec3(0.628,0.095,0.990);
  vec3 deepBlue = vec3(0.042,0.110,0.975);
  vec3 aqua = vec3(0.371,0.825,0.801);
  vec3 slate = vec3(0.517,0.650,0.625);
  vec3 green = vec3(0.107,0.650,0.080);

  float loopTime = 60.0;
  float t = map(mod(u_time, loopTime), 0.0, loopTime, 0.0, 1.0);

  // blend between background colors over time
  vec3 background = white;
  background = mix(background, orange, smoothstep(0.0, 0.1, t));
  background = mix(background, red, smoothstep(0.1, 0.2, t));
  background = mix(background, pink, smoothstep(0.2, 0.3, t));
  background = mix(background, neonPink, smoothstep(0.3, 0.4, t));
  background = mix(background, purple, smoothstep(0.4, 0.5, t));
  background = mix(background, deepBlue, smoothstep(0.5, 0.6, t));
  background = mix(background, aqua, smoothstep(0.6, 0.7, t));
  background = mix(background, green, smoothstep(0.7, 0.8, t));
  background = mix(background, slate, smoothstep(0.8, 0.9, t));
  background = mix(background, white, smoothstep(0.9, 1.0, t));

  // Foreground rectangle
  vec3 color = mix(background, blue, rect(st,vec2(0.25,0.25)));

  gl_FragColor = vec4(color,1.0);
}

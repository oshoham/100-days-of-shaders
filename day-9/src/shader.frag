#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texcoord;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform sampler2D u_frame;

float map(float value, float inMin, float inMax, float outMin, float outMax) {
  return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}

void main(){
  vec2 st = gl_FragCoord.xy/u_resolution.xy;

  float tiling = floor(map(sin(u_time * 0.5), -1.0, 1.0, 1.0, 25.0));

  st = fract(st * tiling);

  vec4 texColor = texture2D(u_frame, 1.0 - st);

  gl_FragColor = texColor;
}

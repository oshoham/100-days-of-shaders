#ifdef GL_ES
precision mediump float;
#endif

// reference for friction code: https://github.com/shiffman/The-Nature-of-Code-Examples-p5.js/blob/master/chp02_forces/NOC_2_04_forces_friction/mover.js

varying vec2 v_texcoord;

uniform vec2 u_resolution;
uniform sampler2D u_velocity;
uniform sampler2D u_flow;
uniform float u_flow_scale;

void main() {
  vec2 st = gl_FragCoord.xy/u_resolution.xy;
  vec2 flow = texture2D(u_flow, st).xy;
  vec2 velocity = texture2D(u_velocity, st).xy;

  float c = 0.005;
  float normal = 1.0;
  float friction_magnitude = c * normal;
  vec2 friction = normalize(velocity * -1.0) * friction_magnitude;

  vec2 new_velocity = velocity + flow * u_flow_scale + friction;
  gl_FragColor = vec4(new_velocity, 0.0, 1.0);
}

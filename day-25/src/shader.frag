#ifdef GL_ES
precision mediump float;
#endif

#pragma glslify: map = require('glsl-map')

varying vec2 v_texcoord;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform sampler2D u_current_frame;
uniform sampler2D u_flow;

vec3 hsb2rgb(in vec3 c){
  vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
                           6.0)-3.0)-1.0,
                   0.0,
                   1.0);
  rgb = rgb*rgb*(3.0-2.0*rgb);
  return c.z * mix( vec3(1.0), rgb, c.y);
}

void main() {
  vec2 st = gl_FragCoord.xy / u_resolution.xy;

  vec3 color = vec3(0.0);

  vec2 flow = texture2D(u_flow, st).xy;

  // draw direction of flow as hue
  // if (length(flow) > 1.0) {
  //   float hue = (atan(flow.y, flow.x) + 3.14159265) / (3.14159265 * 2.0);
  //   color += hsb2rgb(vec3(hue, 1.0, 1.0));
  // }

  // gl_FragColor = vec4(color, 1.0);
  gl_FragColor = texture2D(u_current_frame, st);
}

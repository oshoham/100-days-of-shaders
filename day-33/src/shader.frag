#ifdef GL_ES
precision mediump float;
#endif

// reference: http://jamie-wong.com/2016/07/15/ray-marching-signed-distance-functions/

#pragma glslify: map = require('glsl-map')

#define PI 3.14159265359
#define TWO_PI 6.28318530718

#define MAX_MARCHING_STEPS 255
#define MIN_DIST 0.0
#define MAX_DIST 100.0
#define EPSILON 0.0001

varying vec2 v_texcoord;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

float displacement(vec3 point, float scale, float amplitude) {
  return sin(scale * point.x) * sin(scale * point.y) * sin(scale * point.z) * amplitude;
}

float sphere_sdf(vec3 point, vec3 center) {
  return distance(point, center) - 1.0;
}

mat4 rotate_y(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat4(
    vec4(c, 0.0, s, 0.0),
    vec4(0.0, 1.0, 0.0, 0.0),
    vec4(-s, 0.0, c, 0.0),
    vec4(0.0, 0.0, 0.0, 1.0)
  );
}

float scene_sdf(vec3 sample_point) {
  sample_point = (rotate_y(u_time * 0.1) * vec4(sample_point, 1.0)).xyz;
  float s = sphere_sdf(sample_point / 0.75, vec3(0.0)) * 0.75;
  float d = displacement(sample_point, map(sin(3.0 * PI / 2.0 + u_time * 0.1), -1.0, 1.0, 0.0, 50.0), 0.03);
  return s + d;
}

float shortest_distance_to_surface(vec3 eye, vec3 marching_direction, float start, float end) {
  float depth = start;
  for (int i = 0; i < MAX_MARCHING_STEPS; i++) {
    float dist = scene_sdf(eye + depth * marching_direction);
    if (dist < EPSILON) {
      return depth;
    }
    depth += dist;
    if (depth >= end) {
      return end;
    }
  }
  return end;
}

vec3 ray_direction(float field_of_view, vec2 resolution, vec2 frag_coord) {
  vec2 xy = frag_coord - resolution / 2.0;
  float z = resolution.y / tan(radians(field_of_view) / 2.0);
  return normalize(vec3(xy, -z));
}

vec3 estimate_normal(vec3 p) {
  return normalize(vec3(
    scene_sdf(vec3(p.x + EPSILON, p.y, p.z)) - scene_sdf(vec3(p.x - EPSILON, p.y, p.z)),
    scene_sdf(vec3(p.x, p.y + EPSILON, p.z)) - scene_sdf(vec3(p.x, p.y - EPSILON, p.z)),
    scene_sdf(vec3(p.x, p.y, p.z + EPSILON)) - scene_sdf(vec3(p.x, p.y, p.z - EPSILON))
  ));
}

/*
 * Lighting contribution of a single point light source via Phong illumination.
 * The vec3 returned is the RGB color of the light's contribution.
 */
vec3 phong_contribution_for_light(vec3 diffuse_color, vec3 specular_color, float shininess, vec3 position,
                                  vec3 eye, vec3 light_position, vec3 light_intensity) {
  vec3 normal = estimate_normal(position);
  vec3 direction_towards_light = normalize(light_position - position);
  vec3 direction_towards_viewer = normalize(eye - position);
  vec3 reflected_light_direction = normalize(reflect(-direction_towards_light, normal));

  float dot_LN = dot(direction_towards_light, normal);
  float dot_RV = dot(reflected_light_direction, direction_towards_viewer);

  if (dot_LN < 0.0) {
    // light not visible from this point on the surface
    return vec3(0.0);
  }

  if (dot_RV < 0.0) {
    // light reflection is in the opposite direction as the viewer; apply only the diffuse component
    return light_intensity * (diffuse_color * dot_LN);
  }

  return light_intensity * (diffuse_color * dot_LN + specular_color * pow(dot_RV, shininess));
}

vec3 phong_illumination(vec3 ambient_color, vec3 diffuse_color, vec3 specular_color, float shininess,
                        vec3 position, vec3 eye) {
  vec3 ambient_light = vec3(0.5);
  vec3 color = ambient_light * ambient_color;

  vec3 light_1_position = vec3(4.0 * sin(u_time), 2.0, 4.0 * cos(u_time));
  vec3 light_1_intensity = vec3(0.4);
  color += phong_contribution_for_light(diffuse_color, specular_color, shininess, position, eye, light_1_position, light_1_intensity);

  vec3 light_2_position = vec3(2.0 * sin(0.37 * u_time), 2.0 * cos(0.37 * u_time), 2.0);
  vec3 light_2_intensity = vec3(0.4);
  color += phong_contribution_for_light(diffuse_color, specular_color, shininess, position, eye, light_2_position, light_2_intensity);

  return color;
}

void main() {
  vec3 direction = ray_direction(45.0, u_resolution.xy, gl_FragCoord.xy);
  vec3 eye = vec3(0.0, 0.0, 5.0);
  float dist = shortest_distance_to_surface(eye, direction, MIN_DIST, MAX_DIST);

  if (dist > MAX_DIST - EPSILON) {
    // didn't hit anything
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  vec3 closest_point = eye + dist * direction;

  vec3 ambient_color = vec3(0.221,0.000,0.965);
  vec3 diffuse_color =  vec3(0.915,0.101,0.101);
  vec3 specular_color = vec3(1.0, 1.0, 1.0);
  float shininess = 10.0;

  vec3 color = phong_illumination(ambient_color, diffuse_color, specular_color, shininess, closest_point, eye);

  gl_FragColor = vec4(color, 1.0);
}

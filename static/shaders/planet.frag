#version 300 es
    precision highp int;
precision highp float;

in highp vec3 vNormal;
in highp vec3 vVertex;
in highp vec2 vTextureCoord;

out lowp vec4 outputColor;

uniform highp float uShininess;
uniform vec3 uLightWorldPosition;
uniform sampler2D uSampler;

void main(void) {
    vec4 tex = texture(uSampler, vTextureCoord);
    vec4 aColor = tex;

    vec3 to_light;
    vec3 vertex_normal;
    vec3 reflection;
    vec3 to_camera;
    float cos_angle;
    vec3 diffuse_color;
    vec3 specular_color;
    vec3 ambient_color;
    vec3 color;

    vec3 lightColor = vec3(1.0,1.0,1.0);
    ambient_color = vec3(0.1,0.1,0.1) * aColor.rgb;
    to_light = uLightWorldPosition - vVertex;
    to_light = normalize(to_light);

    vertex_normal = normalize(vNormal);
    cos_angle = dot(vertex_normal, to_light);
    cos_angle = clamp(cos_angle, 0.0, 1.0);
    diffuse_color = vec3(aColor) * cos_angle;
    reflection = vec3(0.0,0.0,0.0); //2.0 * dot(vertex_normal,to_light) * vertex_normal - to_light;
    to_camera = -1.0 * vVertex;
    reflection = normalize( reflection );
    to_camera = normalize( to_camera );
    cos_angle = dot(reflection, to_camera);
    cos_angle = clamp(cos_angle, 0.0, 1.0);
    cos_angle = pow(cos_angle, uShininess);

    if (cos_angle > 0.0) {
        specular_color = lightColor * cos_angle;
        diffuse_color = diffuse_color * (1.0 - cos_angle);
    } else {
        specular_color = vec3(0.0, 0.0, 0.0);
    }

    color = ambient_color + diffuse_color + specular_color;

    outputColor = vec4(color,aColor.a);
}
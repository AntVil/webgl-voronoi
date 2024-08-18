#version 300 es
precision mediump float;

float pi = 3.14159265359;

// (index, distance)
uniform sampler2D pixelState;
uniform float inversePointCount;

out vec4 outColor;

vec3 lerp(vec3 a, vec3 b, float t) {
    return a + (b - a) * t;
}

void main() {
    float lowestDistance = texelFetch(pixelState, ivec2(gl_FragCoord.xy), 0).r;
    int closestPointIndex[9];

    for(int i=0;i<3;i++) {
        for(int j=0;j<3;j++) {
            int index = i*3 + j;
            ivec2 coord = ivec2(gl_FragCoord.x + float(i) - 1.0, gl_FragCoord.y + float(j) - 1.0);
            closestPointIndex[index] = int(texelFetch(pixelState, coord, 0).g * 255.0);
        }
    }

    int sameClosestCount = 0;
    int closestCase = closestPointIndex[4];
    for(int i=0;i<9;i++) {
        if(closestCase == closestPointIndex[i]) {
            sameClosestCount++;
        }
    }

    float hue = 2.0 * pi * float(closestCase) * inversePointCount;

    vec3 regionColor = vec3(
        sin(hue) + 0.5,
        sin(hue + 2.0 * pi / 3.0) + 0.5,
        sin(hue + 4.0 * pi / 3.0) + 0.5
    );

    if(closestCase == 255) {
        // (literal) edge case
        outColor = vec4(0.0, 0.0, 0.0, 1.0);
    } else if(sameClosestCount != 9) {
        // regular edge
        float t = pow(float(sameClosestCount) / 9.0, 5.0);
        outColor = vec4(
            lerp(vec3(0.0, 0.0, 0.0), regionColor, t),
            1.0
        );
    } else if(lowestDistance < 0.01) {
        // point
        float t = pow(lowestDistance / 0.01, 8.0);
        outColor = vec4(
            lerp(vec3(0.0, 0.0, 0.0), regionColor, t),
            1.0
        );
    } else {
        // region
        outColor = vec4(regionColor, 1.0);
    }
}

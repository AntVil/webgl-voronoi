#version 300 es
precision mediump float;

float pi = 3.14159265359;

uniform sampler2D points;
uniform float inverseResolution;

out vec4 outColor;

void main() {
    int pointCount = textureSize(points, 0).x;

    int closestPoint = 0;
    float lowestDistance1 = 10.0;
    float lowestDistance2 = 10.0;

    vec2 relativeCoordinate = (gl_FragCoord.xy * (2.0 * inverseResolution)) - vec2(1.0, 1.0);

    vec2 point;
    float pointDistance;
    for (int i = 0; i < pointCount; i++) {
        point = texelFetch(points, ivec2(i, 0), 0).xy;

        // euclidian distance
        pointDistance = distance(relativeCoordinate, point);

        // manhattan distance
        // pointDistance = abs(relativeCoordinate.x - point.x) + abs(relativeCoordinate.y - point.y);

        if(pointDistance < lowestDistance1) {
            closestPoint = i;
            lowestDistance2 = lowestDistance1;
            lowestDistance1 = pointDistance;
        } else if(pointDistance < lowestDistance2) {
            lowestDistance2 = pointDistance;
        }
    }

    if(lowestDistance1 < 0.01) {
        outColor = vec4(0.0, 0.0, 0.0, 1.0);
    } else {
        float color = 1.0 / exp(abs(lowestDistance2 - lowestDistance1));

        if(color < 0.99) {
            float hue = 2.0 * pi * float(closestPoint) / float(pointCount);
            outColor = vec4(
                sin(hue) + 0.5,
                sin(hue + 2.0 * pi / 3.0) + 0.5,
                sin(hue + 4.0 * pi / 3.0) + 0.5,
                1.0
            );
        }else {
            outColor = vec4(color, color, color, 1.0);
        }
    }


    // if(abs(lowestDistance2 - lowestDistance1) < 0.01 ||  lowestDistance1 < 0.01) {
    //     outColor = vec4(0.0, 0.0, 0.0, 1.0);
    //     exp(abs(lowestDistance2 - lowestDistance1))
    // } else {
    //     outColor = vec4(1.0, 1.0, 1.0, 1.0);
    // }
}

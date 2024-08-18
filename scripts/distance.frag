#version 300 es
precision mediump float;

float inf = 10e20;
float epsilon = 1e-6;

uniform sampler2D points;
uniform float inverseResolution;

out vec4 pixelState;

void main() {
    int pointCount = textureSize(points, 0).x;

    int closestPointIndex = 0;
    float lowestDistance = inf;
    float nextLowestDistance = inf;

    vec2 relativeCoordinate = (gl_FragCoord.xy * (2.0 * inverseResolution)) - vec2(1.0, 1.0);

    vec2 point;
    float pointDistance;
    for (int i = 0; i < pointCount; i++) {
        point = texelFetch(points, ivec2(i, 0), 0).xy;

        // euclidian distance
        pointDistance = distance(relativeCoordinate, point);

        // manhattan distance
        // pointDistance = abs(relativeCoordinate.x - point.x) + abs(relativeCoordinate.y - point.y);

        if(pointDistance < lowestDistance) {
            closestPointIndex = i;
            nextLowestDistance = lowestDistance;
            lowestDistance = pointDistance;
        } else if(pointDistance < nextLowestDistance) {
            nextLowestDistance = pointDistance;
        }
    }

    if(nextLowestDistance - lowestDistance < epsilon) {
        closestPointIndex = 255;
    }

    pixelState = vec4(
        lowestDistance,
        float(closestPointIndex) / 255.0,
        0.0,
        1.0
    );
}

#version 300 es
precision mediump float;

in vec2 vertPosition;

void main(){
    gl_Position = vec4(vertPosition, 1.0, 1.0);
}

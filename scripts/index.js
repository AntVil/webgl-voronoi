const RESOLUTION = 800;

/** @type {HTMLCanvasElement} */
let canvas;
let context;

window.onload = async () => {
    canvas = document.getElementById("canvas");
    canvas.width = RESOLUTION;
    canvas.height = RESOLUTION;
    const context = canvas.getContext("webgl2");

    const vertexShader = await (await fetch("./scripts/shader.vert")).text();
    const fragmentShader = await (await fetch("./scripts/shader.frag")).text();

    const program = createProgram(context, vertexShader, fragmentShader);

    context.useProgram(program);

    const vertices = new Float32Array([
        -1, -1,
        -1, 1,
        1, 1,
        1, -1
    ]);
    const indices = new Uint16Array([0, 1, 2, 0, 3, 2]);

    const points = new Float32Array(createPoints(5));

    const vertexBuffer = context.createBuffer();
    context.bindBuffer(context.ARRAY_BUFFER, vertexBuffer);
    context.bufferData(context.ARRAY_BUFFER, vertices, context.STATIC_DRAW);

    const indicesBuffer = context.createBuffer();
    context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, indicesBuffer);
    context.bufferData(context.ELEMENT_ARRAY_BUFFER, indices, context.STATIC_DRAW);

    const positionLocation = context.getAttribLocation(program, "vertPosition");

    context.vertexAttribPointer(positionLocation, 2, context.FLOAT, context.FALSE, 2 * Float32Array.BYTES_PER_ELEMENT, 0 * Float32Array.BYTES_PER_ELEMENT)

    const inverseResolutionLocation = context.getUniformLocation(program, "inverseResolution");
    context.uniform1f(inverseResolutionLocation, 1 / RESOLUTION)

    context.enableVertexAttribArray(positionLocation);

    const texture = context.createTexture();
    context.bindTexture(context.TEXTURE_2D, texture);

    context.texImage2D(context.TEXTURE_2D, 0, context.RG32F, points.length / 2, 1, 0, context.RG, context.FLOAT, points)

    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.NEAREST);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.NEAREST);

    context.activeTexture(context.TEXTURE0);
    context.bindTexture(context.TEXTURE_2D, texture);
    const pointsLocation = context.getUniformLocation(program, 'points');
    context.uniform1i(pointsLocation, 0);

    context.drawElements(context.TRIANGLES, indices.length, context.UNSIGNED_SHORT, 0);
}

function createPoints(count) {
    const points = [];
    for(let i=0;i<count;i++) {
        points.push(
            2 * Math.random() - 1,
            2 * Math.random() - 1
        );
    }
    return points;
}

/**
 *
 * @param {WebGL2RenderingContext } context
 * @param {string} vertexShaderCode
 * @param {string} fragmentShaderCode
 */
function createProgram(context, vertexShaderCode, fragmentShaderCode) {
    const vertexShader = context.createShader(context.VERTEX_SHADER);
    context.shaderSource(vertexShader, vertexShaderCode);
    context.compileShader(vertexShader);

    const fragmentShader =context.createShader(context.FRAGMENT_SHADER);
    context.shaderSource(fragmentShader, fragmentShaderCode);
    context.compileShader(fragmentShader);

    if(!context.getShaderParameter(vertexShader, context.COMPILE_STATUS)) {
        throw Error(`vertex shader: ${context.getShaderInfoLog(vertexShader)}`);
    }
    if(!context.getShaderParameter(fragmentShader, context.COMPILE_STATUS)) {
        throw Error(`fragment shader: ${context.getShaderInfoLog(fragmentShader)}`);
    }

    const program = context.createProgram();
    context.attachShader(program, vertexShader);
    context.attachShader(program, fragmentShader);
    context.linkProgram(program);

    if(!context.getProgramParameter(program, context.LINK_STATUS)) {
        throw Error(`linker: ${context.getProgramInfoLog(program)}`);
    }

    return program;
}

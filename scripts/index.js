const RESOLUTION = 800;

window.onload = async () => {
    /** @type {HTMLCanvasElement} */
    canvas = document.getElementById("canvas");
    canvas.width = RESOLUTION;
    canvas.height = RESOLUTION;
    const context = canvas.getContext("webgl2");

    let points = createPoints(10);

    await renderDiagram(context, points);
}

/**
 * @param {number} count
 * @returns {[number]}
 */
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
 * @param {WebGL2RenderingContext} context
 * @param {WebGLProgram} program
 */
function renderQuad(context, program) {
    const vertices = new Float32Array([
        -1, -1,
        -1, 1,
        1, 1,
        1, -1
    ]);
    const indices = new Uint16Array([0, 1, 2, 0, 3, 2]);

    const vertexBuffer = context.createBuffer();
    context.bindBuffer(context.ARRAY_BUFFER, vertexBuffer);
    context.bufferData(context.ARRAY_BUFFER, vertices, context.STATIC_DRAW);

    const indicesBuffer = context.createBuffer();
    context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, indicesBuffer);
    context.bufferData(context.ELEMENT_ARRAY_BUFFER, indices, context.STATIC_DRAW);

    const positionLocation = context.getAttribLocation(program, "vertPosition");
    context.vertexAttribPointer(positionLocation, 2, context.FLOAT, context.FALSE, 2 * Float32Array.BYTES_PER_ELEMENT, 0 * Float32Array.BYTES_PER_ELEMENT);

    context.enableVertexAttribArray(positionLocation);

    context.drawElements(context.TRIANGLES, indices.length, context.UNSIGNED_SHORT, 0);
}

/**
 * @param {WebGL2RenderingContext} context
 * @param {WebGLProgram} program
 * @param {number} resolution
 */
function setupInverseResolution(context, program, resolution) {
    const inverseResolutionLocation = context.getUniformLocation(program, "inverseResolution");
    context.uniform1f(inverseResolutionLocation, 1 / resolution);
}

/**
 * @param {WebGL2RenderingContext} context
 * @param {WebGLProgram} program
 * @param {[number]} points
 */
function setupVoronoiCenters(context, program, points) {
    const pointsArray = new Float32Array(points);

    const texture = context.createTexture();
    context.bindTexture(context.TEXTURE_2D, texture);

    context.texImage2D(context.TEXTURE_2D, 0, context.RG32F, pointsArray.length / 2, 1, 0, context.RG, context.FLOAT, pointsArray);

    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.NEAREST);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.NEAREST);

    const pointsLocation = context.getUniformLocation(program, "points");
    context.uniform1i(pointsLocation, 0);
}

/**
 *
 * @param {WebGL2RenderingContext} context
 * @returns {[WebGLTexture]}
 */
function setupRenderTexture(context) {
    const frameBuffer = context.createFramebuffer();
    context.bindFramebuffer(context.FRAMEBUFFER, frameBuffer);

    const dataTexture = context.createTexture();
    context.bindTexture(context.TEXTURE_2D, dataTexture);
    context.texImage2D(context.TEXTURE_2D, 0, context.RG8, RESOLUTION, RESOLUTION, 0, context.RG, context.UNSIGNED_BYTE, null);

    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.NEAREST);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.NEAREST);

    context.framebufferTexture2D(context.FRAMEBUFFER, context.COLOR_ATTACHMENT0, context.TEXTURE_2D, dataTexture, 0);

    context.drawBuffers([context.COLOR_ATTACHMENT0]);

    return dataTexture;
}

/**
 * @param {WebGL2RenderingContext} context
 * @param {WebGLTexture} closestPointIndexTexture
 * @param {WebGLTexture} lowestDistanceTexture
 */
function setupInTexture(context, program, texture) {
    context.bindTexture(context.TEXTURE_2D, texture);

    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.NEAREST);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.NEAREST);

    const textureLocation = context.getUniformLocation(program, "pixelState");
    context.uniform1i(textureLocation, 0);
}

/**
 * @param {WebGL2RenderingContext } context
 */
async function renderDiagram(context, points) {
    const quadShader = await (await fetch("./scripts/quad.vert")).text();
    const distanceShader = await (await fetch("./scripts/distance.frag")).text();
    const edgeShader = await (await fetch("./scripts/edge.frag")).text();

    const distanceProgram = createProgram(context, quadShader, distanceShader);
    context.useProgram(distanceProgram);

    let texture = setupRenderTexture(context);

    setupInverseResolution(context, distanceProgram, RESOLUTION);
    setupVoronoiCenters(context, distanceProgram, points);

    renderQuad(context, distanceProgram);

    const edgeProgram = createProgram(context, quadShader, edgeShader);
    context.useProgram(edgeProgram);

    context.bindFramebuffer(context.FRAMEBUFFER, null);

    const pointCountLocation = context.getUniformLocation(edgeProgram, "inversePointCount");
    context.uniform1f(pointCountLocation, 1 / points.length);

    setupInTexture(context, edgeProgram, texture);

    renderQuad(context, edgeProgram);
}

/**
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

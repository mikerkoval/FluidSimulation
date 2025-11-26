export async function initGPU() {
    const canvas = document.querySelector("canvas");
    if (!navigator.gpu) {
        throw new Error("WebGPU not supported on this browser.");
    }
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        throw new Error("No appropriate GPUAdapter found.");
    }
    const device = await adapter.requestDevice();
    const context = canvas.getContext("webgpu");
    const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device: device,
        format: canvasFormat,
    });
    return { device, canvasFormat, context };
}

export function createVertexBuffer(device) {
    const vertices = new Float32Array([
        -1, -1, 0, 0,
         1, -1, 1, 0,
         1,  1, 1, 1,
        -1, -1, 0, 0,
         1,  1, 1, 1,
        -1,  1, 0, 1,
    ]);
    const vertexBuffer = device.createBuffer({
        label: "Cell vertices",
        size: vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(vertexBuffer, 0, vertices);
    const vertexBufferLayout = {
        arrayStride: 16,
        attributes: [
            {
                format: "float32x2",
                offset: 0,
                shaderLocation: 0,
            },
            {
                format: "float32x2",
                offset: 8,
                shaderLocation: 1,
            }
        ],
    };
    return { vertices, vertexBuffer, vertexBufferLayout };
}

export function createBuffers(device, GRID_SIZE) {
    const buffers = {};
    const uniformBufferSize =
        2 * 4 + // mouse
        2 * 4 + // grid_size
        1 * 4 + // diff
        1 * 4 + // visc
        1 * 4 + // N
        1 * 4 + // dt
        1 * 4 + // b
        1 * 4;  // palette
    const uniformColorSize = 4 * 4 + 4 * 4; // color + radius
    buffers.uniformBuffer = device.createBuffer({
        label: "Uniform buffer",
        size: uniformBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    buffers.addDensityBuffer = device.createBuffer({
        label: "density Uniform buffer",
        size: uniformColorSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    buffers.addVelocityBuffer = device.createBuffer({
        label: "velocity Uniform buffer",
        size: uniformColorSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const stateArray = new Float32Array(4 * GRID_SIZE * GRID_SIZE);
    // stateArray is already filled with zeros by default

    buffers.densityBuffers = [
        device.createBuffer({
            label: "Density State A",
            size: stateArray.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        }),
        device.createBuffer({
            label: "Density State B",
            size: stateArray.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        })
    ];
    buffers.velocityBuffers = [
        device.createBuffer({
            label: "Velocity State A",
            size: stateArray.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        }),
        device.createBuffer({
            label: "Velocity State B",
            size: stateArray.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        })
    ];
    buffers.vorticityBuffer = device.createBuffer({
        label: "Vorticity Buffer",
        size: stateArray.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(buffers.densityBuffers[0], 0, stateArray);
    device.queue.writeBuffer(buffers.densityBuffers[1], 0, stateArray);
    device.queue.writeBuffer(buffers.velocityBuffers[0], 0, stateArray);
    device.queue.writeBuffer(buffers.vorticityBuffer, 0, stateArray);
    device.queue.writeBuffer(buffers.velocityBuffers[1], 0, stateArray);

    return buffers;
}
export function createTexture(device, N) {
    const sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
    });

    const canvas = document.querySelector("canvas");

    const texture = device.createTexture({
        size: { width: canvas.width, height: canvas.height },
        format: 'rgba8unorm',
        usage: GPUTextureUsage.COPY_DST |
               GPUTextureUsage.STORAGE_BINDING |
               GPUTextureUsage.TEXTURE_BINDING,
    });

    return { texture, sampler };
}


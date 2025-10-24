import { CONFIG, STATE } from './config.js';
import { createShaderCode } from './shaders.js';

export function createPipelines(device, canvasFormat, vertexBufferLayout) {
    const shaders = createShaderCode(CONFIG.WORKGROUP_SIZE);
    const pipelines = {};

    // Create Texture Pipeline
    const createTextureModule = device.createShaderModule({
        label: "create texture shader",
        code: shaders.createTexture
    });

    const createTextureLayout = device.createBindGroupLayout({
        label: "Create Texture Bind Group Layout",
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: {} },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, storageTexture: { format: "rgba8unorm" } },
            { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage"} }
        ]
    });

    pipelines.createTexture = {
        layout: createTextureLayout,
        program: device.createComputePipeline({
            label: "create texture pipeline",
            layout: device.createPipelineLayout({ bindGroupLayouts: [createTextureLayout] }),
            compute: { module: createTextureModule, entryPoint: "computeMain" }
        })
    };

    // Draw Buffer Pipeline
    const drawBufferModule = device.createShaderModule({
        label: "draw buffer shader",
        code: shaders.drawBuffer
    });

    const drawBufferLayout = device.createBindGroupLayout({
        label: "Draw Buffer Bind Group Layout",
        entries: [
            { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {} },
            { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "read-only-storage"} }
        ]
    });

    pipelines.drawBuffer = {
        layout: drawBufferLayout,
        program: device.createRenderPipeline({
            label: "draw buffer pipeline",
            layout: device.createPipelineLayout({ bindGroupLayouts: [drawBufferLayout] }),
            vertex: { module: drawBufferModule, entryPoint: "vertexMain", buffers: [vertexBufferLayout] },
            fragment: { module: drawBufferModule, entryPoint: "fragmentMain", targets: [{ format: canvasFormat }] }
        })
    };

    // Draw Texture Pipeline
    const drawTextureModule = device.createShaderModule({
        label: "draw texture shader",
        code: shaders.drawTexture
    });

    const drawTextureLayout = device.createBindGroupLayout({
        label: "Draw Texture Bind Group Layout",
        entries: [
            { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {} },
            { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: {} },
            { binding: 2, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, sampler: {} }
        ]
    });

    pipelines.drawTexture = {
        layout: drawTextureLayout,
        program: device.createRenderPipeline({
            label: "draw texture pipeline",
            layout: device.createPipelineLayout({ bindGroupLayouts: [drawTextureLayout] }),
            vertex: { module: drawTextureModule, entryPoint: "vertexMain", buffers: [vertexBufferLayout] },
            fragment: { module: drawTextureModule, entryPoint: "fragmentMain", targets: [{ format: canvasFormat }] }
        })
    };

    // Add Density Pipeline
    const addDensityModule = device.createShaderModule({
        label: "add density shader",
        code: shaders.addDensity
    });

    const addDensityLayout = device.createBindGroupLayout({
        label: "Add Density Bind Group Layout",
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: {} },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage"} },
            { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage"} },
            { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: {} }
        ]
    });

    pipelines.addDensity = {
        layout: addDensityLayout,
        program: device.createComputePipeline({
            label: "add density pipeline",
            layout: device.createPipelineLayout({ bindGroupLayouts: [addDensityLayout] }),
            compute: { module: addDensityModule, entryPoint: "computeMain" }
        })
    };

    // Boundary Pipeline
    const boundaryModule = device.createShaderModule({
        label: "boundary shader",
        code: shaders.setBoundary
    });

    const boundaryLayout = device.createBindGroupLayout({
        label: "Boundary Bind Group Layout",
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: {} },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage"} }
        ]
    });

    pipelines.boundary = {
        layout: boundaryLayout,
        program: device.createComputePipeline({
            label: "boundary pipeline",
            layout: device.createPipelineLayout({ bindGroupLayouts: [boundaryLayout] }),
            compute: { module: boundaryModule, entryPoint: "computeMain" }
        })
    };

    // Diffuse Pipeline
    const diffuseModule = device.createShaderModule({
        label: "diffuse shader",
        code: shaders.diffuse
    });

    const diffuseLayout = device.createBindGroupLayout({
        label: "Diffuse Bind Group Layout",
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: {} },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage"} },
            { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage"} }
        ]
    });

    pipelines.diffuse = {
        layout: diffuseLayout,
        program: device.createComputePipeline({
            label: "diffuse pipeline",
            layout: device.createPipelineLayout({ bindGroupLayouts: [diffuseLayout] }),
            compute: { module: diffuseModule, entryPoint: "computeMain" }
        })
    };

    // Advect Pipeline
    const advectModule = device.createShaderModule({
        label: "advect shader",
        code: shaders.advect
    });

    const advectLayout = device.createBindGroupLayout({
        label: "Advect Bind Group Layout",
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: {} },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage"} },
            { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage"} },
            { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage"} }
        ]
    });

    pipelines.advect = {
        layout: advectLayout,
        program: device.createComputePipeline({
            label: "advect pipeline",
            layout: device.createPipelineLayout({ bindGroupLayouts: [advectLayout] }),
            compute: { module: advectModule, entryPoint: "computeMain" }
        })
    };

    // Project Pipelines
    const project1Module = device.createShaderModule({ label: "project1 shader", code: shaders.project1 });
    const project2Module = device.createShaderModule({ label: "project2 shader", code: shaders.project2 });
    const project3Module = device.createShaderModule({ label: "project3 shader", code: shaders.project3 });

    const projectLayout = device.createBindGroupLayout({
        label: "Project Bind Group Layout",
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: {} },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage"} },
            { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage"} }
        ]
    });

    const pipelineLayoutProject = device.createPipelineLayout({ bindGroupLayouts: [projectLayout] });

    pipelines.project1 = {
        layout: projectLayout,
        program: device.createComputePipeline({
            label: "project1 pipeline",
            layout: pipelineLayoutProject,
            compute: { module: project1Module, entryPoint: "computeMain" }
        })
    };

    pipelines.project2 = {
        layout: projectLayout,
        program: device.createComputePipeline({
            label: "project2 pipeline",
            layout: pipelineLayoutProject,
            compute: { module: project2Module, entryPoint: "computeMain" }
        })
    };

    const project3Layout = device.createBindGroupLayout({
        label: "Project3 Bind Group Layout",
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: {} },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage"} },
            { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage"} }
        ]
    });

    pipelines.project3 = {
        layout: project3Layout,
        program: device.createComputePipeline({
            label: "project3 pipeline",
            layout: device.createPipelineLayout({ bindGroupLayouts: [project3Layout] }),
            compute: { module: project3Module, entryPoint: "computeMain" }
        })
    };

    // Fade Pipeline
    const fadeModule = device.createShaderModule({
        label: "fade shader",
        code: shaders.fade
    });

    const fadeLayout = device.createBindGroupLayout({
        label: "Fade Bind Group Layout",
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: {} },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage"} }
        ]
    });

    pipelines.fade = {
        layout: fadeLayout,
        program: device.createComputePipeline({
            label: "fade pipeline",
            layout: device.createPipelineLayout({ bindGroupLayouts: [fadeLayout] }),
            compute: { module: fadeModule, entryPoint: "computeMain" }
        })
    };

    return pipelines;
}

export class FluidSimulation {
    constructor(device, context, buffers, pipelines, vertexBuffer, texture, sampler) {
        this.device = device;
        this.context = context;
        this.buffers = buffers;
        this.pipelines = pipelines;
        this.vertexBuffer = vertexBuffer;
        this.texture = texture;
        this.sampler = sampler;

	    const canvas = document.querySelector("canvas");
	    this.width = canvas.width;
	    this.height = canvas.height;
	    console.log('Simulation canvas size:', this.width, 'x', this.height);
    }

    setUniforms(b) {
        // Mouse position is in canvas pixels, convert to grid coordinates
        // Grid coordinates go from 1 to N+1 (with 0 and N+1 being boundaries)
        const mouseX = (STATE.mousePosition.x / this.width) * CONFIG.N + 1;
        const mouseY = ((this.height - STATE.mousePosition.y) / this.height) * CONFIG.N + 1;
        const dt = CONFIG.UPDATE_INTERVAL / 1000;

        const uniformArray = new Float32Array([
            mouseX, mouseY,
            CONFIG.GRID_SIZE, CONFIG.GRID_SIZE,
            STATE.diffuseState, 0,
            CONFIG.N, dt,
            b, 0
        ]);

        this.device.queue.writeBuffer(this.buffers.uniformBuffer, 0, uniformArray);
    }

    addSource(outputBuffer, inputBuffer, sourceBuffer) {
        const bindGroup = this.device.createBindGroup({
            label: "Add source bind group",
            layout: this.pipelines.addDensity.layout,
            entries: [
                { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                { binding: 1, resource: { buffer: outputBuffer } },
                { binding: 2, resource: { buffer: inputBuffer } },
                { binding: 3, resource: { buffer: sourceBuffer } }
            ]
        });

        const encoder = this.device.createCommandEncoder();
        const computePass = encoder.beginComputePass();
        computePass.setPipeline(this.pipelines.addDensity.program);
        computePass.setBindGroup(0, bindGroup);
        const workgroupCount = Math.ceil(CONFIG.N / CONFIG.WORKGROUP_SIZE);
        computePass.dispatchWorkgroups(workgroupCount, workgroupCount);
        computePass.end();

        this.device.queue.submit([encoder.finish()]);
    }

    setBoundary(encoder, b, buffer) {
        this.setUniforms(b);

        const bindGroup = this.device.createBindGroup({
            label: "Boundary bind group",
            layout: this.pipelines.boundary.layout,
            entries: [
                { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                { binding: 1, resource: { buffer: buffer } }
            ]
        });

        const computePass = encoder.beginComputePass();
        computePass.setPipeline(this.pipelines.boundary.program);
        computePass.setBindGroup(0, bindGroup);
        const workgroupCount = Math.ceil(CONFIG.GRID_SIZE / CONFIG.WORKGROUP_SIZE);
        computePass.dispatchWorkgroups(workgroupCount, workgroupCount);
        computePass.end();
    }

    diffuse(b, outputBuffer, inputBuffer, diffusion) {
        // Use fewer iterations for larger grids to maintain performance
        // Use sqrt scaling to be less aggressive
        const iterations = Math.max(2, Math.floor(CONFIG.SOLVER_ITERATIONS * Math.sqrt(64 / CONFIG.N)));

        const bindGroup = this.device.createBindGroup({
            label: "Diffuse bind group",
            layout: this.pipelines.diffuse.layout,
            entries: [
                { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                { binding: 1, resource: { buffer: outputBuffer } },
                { binding: 2, resource: { buffer: inputBuffer } }
            ]
        });

        const encoder = this.device.createCommandEncoder();
        const workgroupCount = Math.ceil(CONFIG.N / CONFIG.WORKGROUP_SIZE);

        for (let i = 0; i < iterations; i++) {
            const computePass = encoder.beginComputePass();
            computePass.setPipeline(this.pipelines.diffuse.program);
            computePass.setBindGroup(0, bindGroup);
            computePass.dispatchWorkgroups(workgroupCount, workgroupCount);
            computePass.end();

            this.setBoundary(encoder, b, outputBuffer);
        }

        this.device.queue.submit([encoder.finish()]);
    }

    advect(b, outputBuffer, inputBuffer, velocityBuffer) {
        const bindGroup = this.device.createBindGroup({
            label: "Advect bind group",
            layout: this.pipelines.advect.layout,
            entries: [
                { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                { binding: 1, resource: { buffer: outputBuffer } },
                { binding: 2, resource: { buffer: inputBuffer } },
                { binding: 3, resource: { buffer: velocityBuffer } }
            ]
        });

        const encoder = this.device.createCommandEncoder();
        const computePass = encoder.beginComputePass();
        computePass.setPipeline(this.pipelines.advect.program);
        computePass.setBindGroup(0, bindGroup);
        const workgroupCount = Math.ceil(CONFIG.N / CONFIG.WORKGROUP_SIZE);
        computePass.dispatchWorkgroups(workgroupCount, workgroupCount);
        computePass.end();

        this.setBoundary(encoder, b, outputBuffer);
        this.device.queue.submit([encoder.finish()]);
    }

    project(velocityBuffer, pressureBuffer) {
        // Use fewer iterations for larger grids to maintain performance
        // Use sqrt scaling to be less aggressive
        const iterations = Math.max(2, Math.floor(CONFIG.SOLVER_ITERATIONS * Math.sqrt(64 / CONFIG.N)));
        const workgroupCount = Math.ceil(CONFIG.N / CONFIG.WORKGROUP_SIZE);

        // Batch all operations into a single encoder for better performance
        const encoder = this.device.createCommandEncoder();

        // Step 1: Calculate divergence
        const bindGroup1 = this.device.createBindGroup({
            label: "Project1 bind group",
            layout: this.pipelines.project1.layout,
            entries: [
                { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                { binding: 1, resource: { buffer: velocityBuffer } },
                { binding: 2, resource: { buffer: pressureBuffer } }
            ]
        });

        let computePass = encoder.beginComputePass();
        computePass.setPipeline(this.pipelines.project1.program);
        computePass.setBindGroup(0, bindGroup1);
        computePass.dispatchWorkgroups(workgroupCount, workgroupCount);
        computePass.end();
        this.setBoundary(encoder, 0, pressureBuffer);

        // Step 2: Solve for pressure
        const bindGroup2 = this.device.createBindGroup({
            label: "Project2 bind group",
            layout: this.pipelines.project2.layout,
            entries: [
                { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                { binding: 1, resource: { buffer: velocityBuffer } },
                { binding: 2, resource: { buffer: pressureBuffer } }
            ]
        });

        for (let i = 0; i < iterations; i++) {
            computePass = encoder.beginComputePass();
            computePass.setPipeline(this.pipelines.project2.program);
            computePass.setBindGroup(0, bindGroup2);
            computePass.dispatchWorkgroups(workgroupCount, workgroupCount);
            computePass.end();
            this.setBoundary(encoder, 0, pressureBuffer);
        }

        // Step 3: Subtract pressure gradient
        const bindGroup3 = this.device.createBindGroup({
            label: "Project3 bind group",
            layout: this.pipelines.project3.layout,
            entries: [
                { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                { binding: 1, resource: { buffer: velocityBuffer } },
                { binding: 2, resource: { buffer: pressureBuffer } }
            ]
        });

        computePass = encoder.beginComputePass();
        computePass.setPipeline(this.pipelines.project3.program);
        computePass.setBindGroup(0, bindGroup3);
        computePass.dispatchWorkgroups(workgroupCount, workgroupCount);
        computePass.end();
        this.setBoundary(encoder, 1, velocityBuffer);

        // Submit all operations at once
        this.device.queue.submit([encoder.finish()]);
    }

    updateVelocity() {
        STATE.diffuseState = CONFIG.VISCOSITY;
        const velocityBuffers = this.buffers.velocityBuffers;

        STATE.velocityStep = (STATE.velocityStep + 1) % 2;

        const dx = STATE.mousePosition.x - STATE.mousePosition.x0;
        const dy = -1 * (STATE.mousePosition.y - STATE.mousePosition.y0);

        const addSourceArr = new Float32Array([
            dx, dy, 0, 0,
            CONFIG.VELOCITY_RADIUS, 0, 0, 0
        ]);

        this.device.queue.writeBuffer(this.buffers.addVelocityBuffer, 0, addSourceArr);

        // Always add source (even if dx=0 and dy=0)
        this.addSource(
            velocityBuffers[STATE.velocityStep % 2],
            velocityBuffers[(STATE.velocityStep + 1) % 2],
            this.buffers.addVelocityBuffer
        );
        STATE.velocityStep = (STATE.velocityStep + 1) % 2;

        // Always diffuse - the solver will be fast when viscosity is 0
        this.diffuse(1, velocityBuffers[STATE.velocityStep % 2],
                     velocityBuffers[(STATE.velocityStep + 1) % 2], CONFIG.VISCOSITY);
        STATE.velocityStep = (STATE.velocityStep + 1) % 2;

        this.project(velocityBuffers[STATE.velocityStep % 2],
                     velocityBuffers[(STATE.velocityStep + 1) % 2]);
        STATE.velocityStep = (STATE.velocityStep + 1) % 2;

        this.advect(1, velocityBuffers[STATE.velocityStep % 2],
                    velocityBuffers[(STATE.velocityStep + 1) % 2],
                    velocityBuffers[(STATE.velocityStep + 1) % 2]);

        this.project(velocityBuffers[STATE.velocityStep % 2],
                     velocityBuffers[(STATE.velocityStep + 1) % 2]);
    }

    fade(buffer) {
        // Apply fade effect by multiplying density by fade factor
        // We need to set the fade factor in the diffuse uniform temporarily
        const uniformArray = new Float32Array([
            0, 0,  // mouse (not used)
            CONFIG.GRID_SIZE, CONFIG.GRID_SIZE,
            CONFIG.FADE, 0,  // Use fade value in diffuse slot
            CONFIG.N, 0,  // dt not used
            0, 0  // b not used
        ]);
        this.device.queue.writeBuffer(this.buffers.uniformBuffer, 0, uniformArray);

        const encoder = this.device.createCommandEncoder();
        const computePass = encoder.beginComputePass();
        computePass.setPipeline(this.pipelines.fade.program);

        const bindGroup = this.device.createBindGroup({
            label: "Fade bind group",
            layout: this.pipelines.fade.layout,
            entries: [
                { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                { binding: 1, resource: { buffer: buffer } }
            ]
        });

        computePass.setBindGroup(0, bindGroup);
        const workgroupCount = Math.ceil(CONFIG.GRID_SIZE / CONFIG.WORKGROUP_SIZE);
        computePass.dispatchWorkgroups(workgroupCount, workgroupCount);
        computePass.end();

        this.device.queue.submit([encoder.finish()]);
    }

    updateDensity() {
        STATE.diffuseState = CONFIG.DIFFUSE;
        const densityBuffers = this.buffers.densityBuffers;
        const velocityBuffers = this.buffers.velocityBuffers;

        STATE.densityStep = (STATE.densityStep + 1) % 2;

        const dx = STATE.mousePosition.x - STATE.mousePosition.x0;
        const dy = -1 * (STATE.mousePosition.y - STATE.mousePosition.y0);

        // Generate vibrant, saturated colors with full range
        const r = 0.5 + 0.5 * Math.sin(STATE.step / 20);
        const g = 0.5 + 0.5 * Math.cos(STATE.step / 25);
        const b = 0.5 + 0.5 * Math.sin(STATE.step / 30);

        const addSourceArr = new Float32Array([
            r, g, b, 1,
            CONFIG.COLOR_RADIUS, 0, 0, 0
        ]);

        if (dx !== 0 || dy !== 0) {
            this.device.queue.writeBuffer(this.buffers.addDensityBuffer, 0, addSourceArr);
            this.addSource(
                densityBuffers[STATE.densityStep % 2],
                densityBuffers[(STATE.densityStep + 1) % 2],
                this.buffers.addDensityBuffer
            );
            STATE.densityStep = (STATE.densityStep + 1) % 2;
        }

        // Apply fade effect
        if (CONFIG.FADE < 1.0) {
            this.fade(densityBuffers[STATE.densityStep % 2]);
        }

        // Always diffuse - the solver will be fast when diffusion is 0
        this.diffuse(0, densityBuffers[STATE.densityStep % 2],
                     densityBuffers[(STATE.densityStep + 1) % 2], CONFIG.DIFFUSE);
        STATE.densityStep = (STATE.densityStep + 1) % 2;

        this.advect(0, densityBuffers[STATE.densityStep % 2],
                    densityBuffers[(STATE.densityStep + 1) % 2],
                    velocityBuffers[STATE.velocityStep % 2]);
    }

	createTextureFromBuffer(buffer) {
    const bindGroup = this.device.createBindGroup({
        label: "Create texture bind group",
        layout: this.pipelines.createTexture.layout,
        entries: [
            { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
            { binding: 1, resource: this.texture.createView() },
            { binding: 2, resource: { buffer: buffer } }
        ]
    });

    const encoder = this.device.createCommandEncoder();
    const computePass = encoder.beginComputePass();
    computePass.setPipeline(this.pipelines.createTexture.program);
    computePass.setBindGroup(0, bindGroup);

    const canvas = document.querySelector("canvas");
    const workgroupCountX = Math.ceil(canvas.width / CONFIG.WORKGROUP_SIZE);
    const workgroupCountY = Math.ceil(canvas.height / CONFIG.WORKGROUP_SIZE);

    computePass.dispatchWorkgroups(workgroupCountX, workgroupCountY);
    computePass.end();

    this.device.queue.submit([encoder.finish()]);
}
    drawTexture() {
        const bindGroup = this.device.createBindGroup({
            label: "Draw texture bind group",
            layout: this.pipelines.drawTexture.layout,
            entries: [
                { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                { binding: 1, resource: this.texture.createView() },
                { binding: 2, resource: this.sampler }
            ]
        });

        const encoder = this.device.createCommandEncoder();
        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                view: this.context.getCurrentTexture().createView(),
                clearValue: { r: 0, g: 0, b: 0, a: 1 },
                loadOp: "clear",
                storeOp: "store",
            }]
        });

        pass.setPipeline(this.pipelines.drawTexture.program);
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.setBindGroup(0, bindGroup);
        pass.draw(6, 1);
        pass.end();

        this.device.queue.submit([encoder.finish()]);
    }

    drawBuffer(buffer) {
        const bindGroup = this.device.createBindGroup({
            label: "Draw buffer bind group",
            layout: this.pipelines.drawBuffer.layout,
            entries: [
                { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                { binding: 1, resource: { buffer: buffer } }
            ]
        });

        const encoder = this.device.createCommandEncoder();
        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                view: this.context.getCurrentTexture().createView(),
                clearValue: { r: 0, g: 0, b: 0, a: 1 },
                loadOp: "clear",
                storeOp: "store",
            }]
        });

        pass.setPipeline(this.pipelines.drawBuffer.program);
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.setBindGroup(0, bindGroup);
        pass.draw(6, 1);
        pass.end();

        this.device.queue.submit([encoder.finish()]);
    }

    getDrawBuffer() {
        if (STATE.drawState === CONFIG.DRAW_DENSITY) {
            return this.buffers.densityBuffers[STATE.densityStep % 2];
        }
        if (STATE.drawState === CONFIG.DRAW_VELOCITY) {
            return this.buffers.velocityBuffers[STATE.velocityStep % 2];
        }
    }

    clear() {
        // Reset all buffers to zero
        const stateArray = new Float32Array(4 * CONFIG.GRID_SIZE * CONFIG.GRID_SIZE);

        this.device.queue.writeBuffer(this.buffers.densityBuffers[0], 0, stateArray);
        this.device.queue.writeBuffer(this.buffers.densityBuffers[1], 0, stateArray);
        this.device.queue.writeBuffer(this.buffers.velocityBuffers[0], 0, stateArray);
        this.device.queue.writeBuffer(this.buffers.velocityBuffers[1], 0, stateArray);

        // Reset step counters
        STATE.densityStep = 0;
        STATE.velocityStep = 0;
        STATE.step = 0;
    }

    run() {
        this.setUniforms(0);

        if (!STATE.pause) {
            this.updateDensity();
            this.updateVelocity();
        }

        const buffer = this.getDrawBuffer();

        if (STATE.textureDraw) {
            this.createTextureFromBuffer(buffer);
            this.drawTexture();
        } else {
            this.drawBuffer(buffer);
        }

        STATE.step++;
    }
}

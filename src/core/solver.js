import { CONFIG, STATE } from './config.js';

// Jos Stam's stable fluids algorithm
// vel_step: addSource → diffuse → project → advect → project
// dens_step: addSource → diffuse → advect
export class FluidSolver {
    constructor(device, buffers, pipelines, bindGroups) {
        this.device = device;
        this.buffers = buffers;
        this.pipelines = pipelines;
        this.bindGroups = bindGroups;

        const canvas = document.querySelector("canvas");
        this.width = canvas.width;
        this.height = canvas.height;
    }

    setUniforms(b) {
        const mouseX = (STATE.mousePosition.x / this.width) * CONFIG.N + 1;
        const mouseY = ((this.height - STATE.mousePosition.y) / this.height) * CONFIG.N + 1;
        const dt = CONFIG.UPDATE_INTERVAL / 1000;

        const uniformArray = new Float32Array([
            mouseX, mouseY,
            CONFIG.GRID_SIZE, CONFIG.GRID_SIZE,
            STATE.diffuseState, 0,
            CONFIG.N, dt,
            b, 0  // b and padding
        ]);

        this.device.queue.writeBuffer(this.buffers.uniformBuffer, 0, uniformArray);
    }

    // Stam's add_source
    addSource(outputBuffer, inputBuffer, sourceBuffer) {
        let bindGroup;
        if (sourceBuffer === this.buffers.addDensityBuffer) {
            bindGroup = (outputBuffer === this.buffers.densityBuffers[0]) ?
                this.bindGroups.addDensity[0] : this.bindGroups.addDensity[1];
        } else {
            bindGroup = (outputBuffer === this.buffers.velocityBuffers[0]) ?
                this.bindGroups.addVelocity[0] : this.bindGroups.addVelocity[1];
        }

        const encoder = this.device.createCommandEncoder();
        const computePass = encoder.beginComputePass();
        computePass.setPipeline(this.pipelines.addDensity.program);
        computePass.setBindGroup(0, bindGroup);
        const workgroupCount = Math.ceil(CONFIG.N / CONFIG.WORKGROUP_SIZE);
        computePass.dispatchWorkgroups(workgroupCount, workgroupCount);
        computePass.end();

        this.device.queue.submit([encoder.finish()]);
    }

    // Stam's set_bnd
    setBoundary(encoder, b, buffer) {
        this.setUniforms(b);

        let bindGroupIndex;
        if (buffer === this.buffers.densityBuffers[0]) bindGroupIndex = 0;
        else if (buffer === this.buffers.densityBuffers[1]) bindGroupIndex = 1;
        else if (buffer === this.buffers.velocityBuffers[0]) bindGroupIndex = 2;
        else bindGroupIndex = 3; // velocityBuffers[1]

        const computePass = encoder.beginComputePass();
        computePass.setPipeline(this.pipelines.boundary.program);
        computePass.setBindGroup(0, this.bindGroups.boundary[bindGroupIndex]);
        const workgroupCount = Math.ceil(CONFIG.GRID_SIZE / CONFIG.WORKGROUP_SIZE);
        computePass.dispatchWorkgroups(workgroupCount, workgroupCount);
        computePass.end();
    }

    // Stam's diffuse (Gauss-Seidel relaxation)
    diffuse(b, outputBuffer, inputBuffer, diffusion) {
        const iterations = CONFIG.SOLVER_ITERATIONS;

        let bindGroup;
        if (outputBuffer === this.buffers.densityBuffers[0]) {
            bindGroup = this.bindGroups.diffuseDensity[0];
        } else if (outputBuffer === this.buffers.densityBuffers[1]) {
            bindGroup = this.bindGroups.diffuseDensity[1];
        } else if (outputBuffer === this.buffers.velocityBuffers[0]) {
            bindGroup = this.bindGroups.diffuseVelocity[0];
        } else {
            bindGroup = this.bindGroups.diffuseVelocity[1];
        }

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

    // Stam's advect (semi-Lagrangian)
    advect(b, outputBuffer, inputBuffer, velocityBuffer) {
        let bindGroup;
        if (outputBuffer === this.buffers.densityBuffers[0] || outputBuffer === this.buffers.densityBuffers[1]) {
            const outputIdx = (outputBuffer === this.buffers.densityBuffers[0]) ? 0 : 1;
            const velIdx = (velocityBuffer === this.buffers.velocityBuffers[0]) ? 0 : 1;
            bindGroup = this.bindGroups.advectDensity[outputIdx * 2 + velIdx];
        } else {
            bindGroup = (outputBuffer === this.buffers.velocityBuffers[0]) ?
                this.bindGroups.advectVelocity[0] : this.bindGroups.advectVelocity[1];
        }

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

    // Stam's project (enforce mass conservation)
    project(velocityBuffer, pressureBuffer) {
        const iterations = CONFIG.SOLVER_ITERATIONS;
        const workgroupCount = Math.ceil(CONFIG.N / CONFIG.WORKGROUP_SIZE);

        const bufferIndex = (velocityBuffer === this.buffers.velocityBuffers[0]) ? 0 : 1;
        const encoder = this.device.createCommandEncoder();

        // Step 1: Calculate divergence
        let computePass = encoder.beginComputePass();
        computePass.setPipeline(this.pipelines.project1.program);
        computePass.setBindGroup(0, this.bindGroups.project1[bufferIndex]);
        computePass.dispatchWorkgroups(workgroupCount, workgroupCount);
        computePass.end();
        this.setBoundary(encoder, 0, pressureBuffer);

        // Step 2: Solve for pressure
        for (let i = 0; i < iterations; i++) {
            computePass = encoder.beginComputePass();
            computePass.setPipeline(this.pipelines.project2.program);
            computePass.setBindGroup(0, this.bindGroups.project2[bufferIndex]);
            computePass.dispatchWorkgroups(workgroupCount, workgroupCount);
            computePass.end();
            this.setBoundary(encoder, 0, pressureBuffer);
        }

        // Step 3: Subtract pressure gradient
        computePass = encoder.beginComputePass();
        computePass.setPipeline(this.pipelines.project3.program);
        computePass.setBindGroup(0, this.bindGroups.project3[bufferIndex]);
        computePass.dispatchWorkgroups(workgroupCount, workgroupCount);
        computePass.end();
        this.setBoundary(encoder, 1, velocityBuffer);

        this.device.queue.submit([encoder.finish()]);
    }

    updateVelocity() {
        STATE.diffuseState = CONFIG.VISCOSITY;
        const velocityBuffers = this.buffers.velocityBuffers;

        STATE.velocityStep = (STATE.velocityStep + 1) % 2;

        const dx = STATE.mousePosition.x - STATE.mousePosition.x0;
        const dy = -1 * (STATE.mousePosition.y - STATE.mousePosition.y0);
        const forceDx = dx * CONFIG.VELOCITY_FORCE_MULTIPLIER * 0.1;
        const forceDy = dy * CONFIG.VELOCITY_FORCE_MULTIPLIER * 0.1;

        const addSourceArr = new Float32Array([
            forceDx, forceDy, 0, 0,
            CONFIG.VELOCITY_RADIUS, 0, 0, 0
        ]);

        this.device.queue.writeBuffer(this.buffers.addVelocityBuffer, 0, addSourceArr);

        // Add source
        this.addSource(
            velocityBuffers[STATE.velocityStep % 2],
            velocityBuffers[(STATE.velocityStep + 1) % 2],
            this.buffers.addVelocityBuffer
        );
        STATE.velocityStep = (STATE.velocityStep + 1) % 2;

        // Diffuse
        this.diffuse(1, velocityBuffers[STATE.velocityStep % 2],
                     velocityBuffers[(STATE.velocityStep + 1) % 2], CONFIG.VISCOSITY);
        STATE.velocityStep = (STATE.velocityStep + 1) % 2;

        // Project
        this.project(velocityBuffers[STATE.velocityStep % 2],
                     velocityBuffers[(STATE.velocityStep + 1) % 2]);
        STATE.velocityStep = (STATE.velocityStep + 1) % 2;

        // Advect
        this.advect(1, velocityBuffers[STATE.velocityStep % 2],
                    velocityBuffers[(STATE.velocityStep + 1) % 2],
                    velocityBuffers[(STATE.velocityStep + 1) % 2]);

        // Project again
        this.project(velocityBuffers[STATE.velocityStep % 2],
                     velocityBuffers[(STATE.velocityStep + 1) % 2]);
    }

    updateDensity() {
        STATE.diffuseState = CONFIG.DIFFUSE;
        const densityBuffers = this.buffers.densityBuffers;
        const velocityBuffers = this.buffers.velocityBuffers;

        STATE.densityStep = (STATE.densityStep + 1) % 2;

        const dx = STATE.mousePosition.x - STATE.mousePosition.x0;
        const dy = -1 * (STATE.mousePosition.y - STATE.mousePosition.y0);
        const t = STATE.step * 0.01;
        const r = (Math.sin(t) + 1) * 0.1;
        const g = (Math.sin(t + 2) + 1) * 0.1;
        const b = (Math.sin(t + 4) + 1) * 0.1;

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

        // Diffuse
        this.diffuse(0, densityBuffers[STATE.densityStep % 2],
                     densityBuffers[(STATE.densityStep + 1) % 2], CONFIG.DIFFUSE);
        STATE.densityStep = (STATE.densityStep + 1) % 2;

        // Advect
        this.advect(0, densityBuffers[STATE.densityStep % 2],
                    densityBuffers[(STATE.densityStep + 1) % 2],
                    velocityBuffers[STATE.velocityStep % 2]);
    }

    clear() {
        const stateArray = new Float32Array(4 * CONFIG.GRID_SIZE * CONFIG.GRID_SIZE);

        this.device.queue.writeBuffer(this.buffers.densityBuffers[0], 0, stateArray);
        this.device.queue.writeBuffer(this.buffers.densityBuffers[1], 0, stateArray);
        this.device.queue.writeBuffer(this.buffers.velocityBuffers[0], 0, stateArray);
        this.device.queue.writeBuffer(this.buffers.velocityBuffers[1], 0, stateArray);

        STATE.densityStep = 0;
        STATE.velocityStep = 0;
        STATE.step = 0;
    }
}

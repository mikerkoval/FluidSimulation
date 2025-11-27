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

    setUniforms(b, N = CONFIG.N, GRID_SIZE = CONFIG.GRID_SIZE) {
        const mouseX = (STATE.mousePosition.x / this.width) * N + 1;
        const mouseY = ((this.height - STATE.mousePosition.y) / this.height) * N + 1;
        const dt = CONFIG.UPDATE_INTERVAL / 1000;

        const uniformArray = new Float32Array([
            mouseX, mouseY,
            GRID_SIZE, GRID_SIZE,
            STATE.diffuseState, 0,
            N, dt,
            b, 0  // b and padding
        ]);

        this.device.queue.writeBuffer(this.buffers.uniformBuffer, 0, uniformArray);
    }

    // Stam's add_source
    addSource(outputBuffer, inputBuffer, sourceBuffer, N = CONFIG.N, GRID_SIZE = CONFIG.GRID_SIZE) {
        // Set uniforms with correct N and GRID_SIZE
        this.setUniforms(0, N, GRID_SIZE);

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
        const workgroupCount = Math.ceil(N / CONFIG.WORKGROUP_SIZE);
        computePass.dispatchWorkgroups(workgroupCount, workgroupCount);
        computePass.end();

        this.device.queue.submit([encoder.finish()]);
    }

    // Stam's set_bnd
    setBoundary(encoder, b, buffer, N = CONFIG.N, GRID_SIZE = CONFIG.GRID_SIZE, velN = null, decayValue = null) {
        // If velN is provided, we need to preserve it in uniforms (for advect with different resolutions)
        if (velN !== null) {
            const mouseX = (STATE.mousePosition.x / this.width) * N + 1;
            const mouseY = ((this.height - STATE.mousePosition.y) / this.height) * N + 1;
            const dt = CONFIG.UPDATE_INTERVAL / 1000;
            const decay = decayValue !== null ? decayValue : 1.0;
            const uniformArray = new Float32Array([
                mouseX, mouseY,
                GRID_SIZE, GRID_SIZE,
                velN, decay,
                N, dt,
                b, 0
            ]);
            this.device.queue.writeBuffer(this.buffers.uniformBuffer, 0, uniformArray);
        } else {
            this.setUniforms(b, N, GRID_SIZE);
        }

        let bindGroupIndex;
        if (buffer === this.buffers.densityBuffers[0]) bindGroupIndex = 0;
        else if (buffer === this.buffers.densityBuffers[1]) bindGroupIndex = 1;
        else if (buffer === this.buffers.velocityBuffers[0]) bindGroupIndex = 2;
        else bindGroupIndex = 3; // velocityBuffers[1]

        const computePass = encoder.beginComputePass();
        computePass.setPipeline(this.pipelines.boundary.program);
        computePass.setBindGroup(0, this.bindGroups.boundary[bindGroupIndex]);
        const workgroupCount = Math.ceil(GRID_SIZE / CONFIG.WORKGROUP_SIZE);
        computePass.dispatchWorkgroups(workgroupCount, workgroupCount);
        computePass.end();
    }

    // Stam's diffuse (Gauss-Seidel relaxation)
    diffuse(b, outputBuffer, inputBuffer, diffusion, N = CONFIG.N, GRID_SIZE = CONFIG.GRID_SIZE) {
        const iterations = CONFIG.SOLVER_ITERATIONS;

        // Set uniforms with diffusion parameter
        const mouseX = (STATE.mousePosition.x / this.width) * N + 1;
        const mouseY = ((this.height - STATE.mousePosition.y) / this.height) * N + 1;
        const dt = CONFIG.UPDATE_INTERVAL / 1000;

        const uniformArray = new Float32Array([
            mouseX, mouseY,
            GRID_SIZE, GRID_SIZE,
            diffusion, 0,  // Use actual diffusion parameter
            N, dt,
            b, 0
        ]);
        this.device.queue.writeBuffer(this.buffers.uniformBuffer, 0, uniformArray);

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
        const workgroupCount = Math.ceil(N / CONFIG.WORKGROUP_SIZE);

        for (let i = 0; i < iterations; i++) {
            const computePass = encoder.beginComputePass();
            computePass.setPipeline(this.pipelines.diffuse.program);
            computePass.setBindGroup(0, bindGroup);
            computePass.dispatchWorkgroups(workgroupCount, workgroupCount);
            computePass.end();

            this.setBoundary(encoder, b, outputBuffer, N, GRID_SIZE, diffusion);
        }

        this.device.queue.submit([encoder.finish()]);
    }

    // Stam's advect (semi-Lagrangian)
    advect(b, outputBuffer, inputBuffer, velocityBuffer, N = CONFIG.N, GRID_SIZE = CONFIG.GRID_SIZE) {
        const isDensity = (outputBuffer === this.buffers.densityBuffers[0] || outputBuffer === this.buffers.densityBuffers[1]);

        // For density advection, pass velocity N in diffuse parameter for resolution mapping
        const velN = isDensity ? CONFIG.N : 0;

        // Set uniforms - for density, diffuse field contains velocity N, viscosity field contains decay
        const mouseX = (STATE.mousePosition.x / this.width) * N + 1;
        const mouseY = ((this.height - STATE.mousePosition.y) / this.height) * N + 1;
        const dt = CONFIG.UPDATE_INTERVAL / 1000;
        const decayValue = isDensity ? CONFIG.DENSITY_DECAY : 1.0;

        const uniformArray = new Float32Array([
            mouseX, mouseY,
            GRID_SIZE, GRID_SIZE,
            velN, decayValue,  // diffuse=velocity N, viscosity=density decay
            N, dt,
            b, 0
        ]);
        this.device.queue.writeBuffer(this.buffers.uniformBuffer, 0, uniformArray);

        let bindGroup;
        if (isDensity) {
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
        const workgroupCount = Math.ceil(N / CONFIG.WORKGROUP_SIZE);
        computePass.dispatchWorkgroups(workgroupCount, workgroupCount);
        computePass.end();

        // Pass velN and decayValue to setBoundary so it preserves them in uniforms
        this.setBoundary(encoder, b, outputBuffer, N, GRID_SIZE, isDensity ? velN : null, isDensity ? decayValue : null);
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

    applyVorticityConfinement(velocityBuffer) {
        if (CONFIG.VORTICITY === 0) return;

        const workgroupCount = Math.ceil(CONFIG.N / CONFIG.WORKGROUP_SIZE);
        const bufferIndex = (velocityBuffer === this.buffers.velocityBuffers[0]) ? 0 : 1;

        this.setUniforms(0);
        const encoder = this.device.createCommandEncoder();

        let computePass = encoder.beginComputePass();
        computePass.setPipeline(this.pipelines.vorticity.program);
        computePass.setBindGroup(0, this.bindGroups.vorticity[bufferIndex]);
        computePass.dispatchWorkgroups(workgroupCount, workgroupCount);
        computePass.end();

        const vorticityUniform = new Float32Array([
            0, 0,
            CONFIG.GRID_SIZE, CONFIG.GRID_SIZE,
            0, CONFIG.VORTICITY,
            CONFIG.N, CONFIG.UPDATE_INTERVAL / 1000,
            0, 0
        ]);
        this.device.queue.writeBuffer(this.buffers.uniformBuffer, 0, vorticityUniform);

        computePass = encoder.beginComputePass();
        computePass.setPipeline(this.pipelines.vorticityConfinement.program);
        computePass.setBindGroup(0, this.bindGroups.vorticityConfinement[bufferIndex]);
        computePass.dispatchWorkgroups(workgroupCount, workgroupCount);
        computePass.end();

        this.device.queue.submit([encoder.finish()]);
    }

    applyGravity(velocityBuffer) {
        if (CONFIG.GRAVITY === 0) return;

        const workgroupCount = Math.ceil(CONFIG.N / CONFIG.WORKGROUP_SIZE);
        const bufferIndex = (velocityBuffer === this.buffers.velocityBuffers[0]) ? 0 : 1;

        const gravityUniform = new Float32Array([
            0, 0,
            CONFIG.GRID_SIZE, CONFIG.GRID_SIZE,
            0, CONFIG.GRAVITY,
            CONFIG.N, CONFIG.UPDATE_INTERVAL / 1000,
            0, 0
        ]);
        this.device.queue.writeBuffer(this.buffers.uniformBuffer, 0, gravityUniform);

        const encoder = this.device.createCommandEncoder();
        const computePass = encoder.beginComputePass();
        computePass.setPipeline(this.pipelines.gravity.program);
        computePass.setBindGroup(0, this.bindGroups.gravity[bufferIndex]);
        computePass.dispatchWorkgroups(workgroupCount, workgroupCount);
        computePass.end();

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

        this.applyGravity(velocityBuffers[STATE.velocityStep % 2]);
        this.applyVorticityConfinement(velocityBuffers[STATE.velocityStep % 2]);
    }

    updateDensity() {
        STATE.diffuseState = CONFIG.DIFFUSE;
        const densityBuffers = this.buffers.densityBuffers;
        const velocityBuffers = this.buffers.velocityBuffers;

        STATE.densityStep = (STATE.densityStep + 1) % 2;

        const dx = STATE.mousePosition.x - STATE.mousePosition.x0;
        const dy = -1 * (STATE.mousePosition.y - STATE.mousePosition.y0);
        const t = STATE.step * 0.05;
        const r = (Math.sin(t) + 1) * 0.5;
        const g = (Math.sin(t + 2) + 1) * 0.5;
        const b = (Math.sin(t + 4) + 1) * 0.5;

        const addSourceArr = new Float32Array([
            r, g, b, 1,
            CONFIG.COLOR_RADIUS, 0, 0, 0
        ]);

        if (dx !== 0 || dy !== 0) {
            this.device.queue.writeBuffer(this.buffers.addDensityBuffer, 0, addSourceArr);
            this.addSource(
                densityBuffers[STATE.densityStep % 2],
                densityBuffers[(STATE.densityStep + 1) % 2],
                this.buffers.addDensityBuffer,
                CONFIG.DYE_N,
                CONFIG.DYE_GRID_SIZE
            );
            STATE.densityStep = (STATE.densityStep + 1) % 2;
        }

        // Diffuse
        this.diffuse(0, densityBuffers[STATE.densityStep % 2],
                     densityBuffers[(STATE.densityStep + 1) % 2], CONFIG.DIFFUSE,
                     CONFIG.DYE_N, CONFIG.DYE_GRID_SIZE);
        STATE.densityStep = (STATE.densityStep + 1) % 2;

        // Advect
        this.advect(0, densityBuffers[STATE.densityStep % 2],
                    densityBuffers[(STATE.densityStep + 1) % 2],
                    velocityBuffers[STATE.velocityStep % 2],
                    CONFIG.DYE_N, CONFIG.DYE_GRID_SIZE);
    }

    clear() {
        const velocityArray = new Float32Array(4 * CONFIG.GRID_SIZE * CONFIG.GRID_SIZE);
        const dyeArray = new Float32Array(4 * CONFIG.DYE_GRID_SIZE * CONFIG.DYE_GRID_SIZE);

        this.device.queue.writeBuffer(this.buffers.densityBuffers[0], 0, dyeArray);
        this.device.queue.writeBuffer(this.buffers.densityBuffers[1], 0, dyeArray);
        this.device.queue.writeBuffer(this.buffers.velocityBuffers[0], 0, velocityArray);
        this.device.queue.writeBuffer(this.buffers.velocityBuffers[1], 0, velocityArray);

        STATE.densityStep = 0;
        STATE.velocityStep = 0;
        STATE.step = 0;
    }
}

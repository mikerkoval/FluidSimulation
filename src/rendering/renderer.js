import { CONFIG, STATE } from '../core/config.js';

export class FluidRenderer {
    
    constructor(device, context, buffers, pipelines, bindGroups, vertexBuffer, bloomTextures) {
        this.device = device;
        this.context = context;
        this.buffers = buffers;
        this.pipelines = pipelines;
        this.bindGroups = bindGroups;
        this.vertexBuffer = vertexBuffer;
        this.bloomTextures = bloomTextures;
    }

    
    createTextureFromBuffer(buffer) {
        let bindGroupIndex;
        const isDensity = (buffer === this.buffers.densityBuffers[0] || buffer === this.buffers.densityBuffers[1]);

        if (buffer === this.buffers.densityBuffers[0]) bindGroupIndex = 0;
        else if (buffer === this.buffers.densityBuffers[1]) bindGroupIndex = 1;
        else if (buffer === this.buffers.velocityBuffers[0]) bindGroupIndex = 2;
        else bindGroupIndex = 3; // velocityBuffers[1]

        // Set uniforms with appropriate N value for the buffer type
        const N = isDensity ? CONFIG.DYE_N : CONFIG.N;
        const GRID_SIZE = isDensity ? CONFIG.DYE_GRID_SIZE : CONFIG.GRID_SIZE;
        const uniformArray = new Float32Array([
            0, 0,  // mouse (not used in rendering)
            GRID_SIZE, GRID_SIZE,
            0, 0,  // diff, visc (not used in rendering)
            N, 0,  // N, dt
            0, 0   // b, padding
        ]);
        this.device.queue.writeBuffer(this.buffers.uniformBuffer, 0, uniformArray);

        const encoder = this.device.createCommandEncoder();
        const computePass = encoder.beginComputePass();
        computePass.setPipeline(this.pipelines.createTexture.program);
        computePass.setBindGroup(0, this.bindGroups.createTexture[bindGroupIndex]);

        const canvas = document.querySelector("canvas");
        const workgroupCountX = Math.ceil(canvas.width / CONFIG.WORKGROUP_SIZE);
        const workgroupCountY = Math.ceil(canvas.height / CONFIG.WORKGROUP_SIZE);

        computePass.dispatchWorkgroups(workgroupCountX, workgroupCountY);
        computePass.end();

        this.device.queue.submit([encoder.finish()]);
    }

    
    drawTexture() {
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
        // Use bloomed texture if bloom is enabled, otherwise use original
        const bindGroup = (CONFIG.ENABLE_BLOOM && this.bloomTextures && this.bindGroups.drawBloomTexture)
            ? this.bindGroups.drawBloomTexture
            : this.bindGroups.drawTexture;
        pass.setBindGroup(0, bindGroup);
        pass.draw(6, 1);
        pass.end();

        this.device.queue.submit([encoder.finish()]);
    }

    
    drawBuffer(buffer) {
        let bindGroupIndex;
        const isDensity = (buffer === this.buffers.densityBuffers[0] || buffer === this.buffers.densityBuffers[1]);

        if (buffer === this.buffers.densityBuffers[0]) bindGroupIndex = 0;
        else if (buffer === this.buffers.densityBuffers[1]) bindGroupIndex = 1;
        else if (buffer === this.buffers.velocityBuffers[0]) bindGroupIndex = 2;
        else bindGroupIndex = 3; // velocityBuffers[1]

        // Set uniforms with appropriate N value for the buffer type
        const N = isDensity ? CONFIG.DYE_N : CONFIG.N;
        const GRID_SIZE = isDensity ? CONFIG.DYE_GRID_SIZE : CONFIG.GRID_SIZE;
        const uniformArray = new Float32Array([
            0, 0,  // mouse (not used in rendering)
            GRID_SIZE, GRID_SIZE,
            0, 0,  // diff, visc (not used in rendering)
            N, 0,  // N, dt
            0, 0   // b, padding
        ]);
        this.device.queue.writeBuffer(this.buffers.uniformBuffer, 0, uniformArray);

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
        pass.setBindGroup(0, this.bindGroups.drawBuffer[bindGroupIndex]);
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

    
    updateFPS() {
        if (CONFIG.SHOW_FPS) {
            STATE.frameCount++;
            const currentTime = performance.now();
            const elapsed = currentTime - STATE.lastFpsTime;
            if (elapsed >= 500) {
                STATE.currentFps = Math.round((STATE.frameCount * 1000) / elapsed);
                STATE.frameCount = 0;
                STATE.lastFpsTime = currentTime;

                const fpsCounter = document.getElementById('fpsCounter');
                if (fpsCounter) {
                    fpsCounter.textContent = `FPS: ${STATE.currentFps}`;
                }
            }
        }
    }

    
    applyBloom() {
        if (!this.bloomTextures) return;

        const canvas = document.querySelector("canvas");
        const workgroupCountX = Math.ceil(canvas.width / CONFIG.WORKGROUP_SIZE);
        const workgroupCountY = Math.ceil(canvas.height / CONFIG.WORKGROUP_SIZE);

        const encoder = this.device.createCommandEncoder();

        // Pass 1: Extract bright areas
        let computePass = encoder.beginComputePass();
        computePass.setPipeline(this.pipelines.bloomExtract.program);
        computePass.setBindGroup(0, this.bindGroups.bloomExtract);
        computePass.dispatchWorkgroups(workgroupCountX, workgroupCountY);
        computePass.end();

        // Pass 2: Blur horizontally
        computePass = encoder.beginComputePass();
        computePass.setPipeline(this.pipelines.bloomBlurH.program);
        computePass.setBindGroup(0, this.bindGroups.bloomBlurH);
        computePass.dispatchWorkgroups(workgroupCountX, workgroupCountY);
        computePass.end();

        // Pass 3: Blur vertically
        computePass = encoder.beginComputePass();
        computePass.setPipeline(this.pipelines.bloomBlurV.program);
        computePass.setBindGroup(0, this.bindGroups.bloomBlurV);
        computePass.dispatchWorkgroups(workgroupCountX, workgroupCountY);
        computePass.end();

        // Pass 4: Composite
        computePass = encoder.beginComputePass();
        computePass.setPipeline(this.pipelines.bloomComposite.program);
        computePass.setBindGroup(0, this.bindGroups.bloomComposite);
        computePass.dispatchWorkgroups(workgroupCountX, workgroupCountY);
        computePass.end();

        this.device.queue.submit([encoder.finish()]);
    }

    render(useTexture) {
        const buffer = this.getDrawBuffer();

        if (useTexture) {
            this.createTextureFromBuffer(buffer);
            if (CONFIG.ENABLE_BLOOM) {
                this.applyBloom();
            }
            this.drawTexture();
        } else {
            this.drawBuffer(buffer);
        }

        this.updateFPS();
    }
}

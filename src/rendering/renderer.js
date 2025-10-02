import { CONFIG, STATE } from '../core/config.js';

export class FluidRenderer {
    
    constructor(device, context, buffers, pipelines, bindGroups, vertexBuffer) {
        this.device = device;
        this.context = context;
        this.buffers = buffers;
        this.pipelines = pipelines;
        this.bindGroups = bindGroups;
        this.vertexBuffer = vertexBuffer;
    }

    
    createTextureFromBuffer(buffer) {
        let bindGroupIndex;
        if (buffer === this.buffers.densityBuffers[0]) bindGroupIndex = 0;
        else if (buffer === this.buffers.densityBuffers[1]) bindGroupIndex = 1;
        else if (buffer === this.buffers.velocityBuffers[0]) bindGroupIndex = 2;
        else bindGroupIndex = 3; // velocityBuffers[1]

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
        pass.setBindGroup(0, this.bindGroups.drawTexture);
        pass.draw(6, 1);
        pass.end();

        this.device.queue.submit([encoder.finish()]);
    }

    
    drawBuffer(buffer) {
        let bindGroupIndex;
        if (buffer === this.buffers.densityBuffers[0]) bindGroupIndex = 0;
        else if (buffer === this.buffers.densityBuffers[1]) bindGroupIndex = 1;
        else if (buffer === this.buffers.velocityBuffers[0]) bindGroupIndex = 2;
        else bindGroupIndex = 3; // velocityBuffers[1]

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

    
    render(useTexture) {
        const buffer = this.getDrawBuffer();

        if (useTexture) {
            this.createTextureFromBuffer(buffer);
            this.drawTexture();
        } else {
            this.drawBuffer(buffer);
        }

        this.updateFPS();
    }
}

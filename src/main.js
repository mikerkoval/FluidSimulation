import { CONFIG } from './core/config.js';
import { initGPU, createVertexBuffer, createBuffers, createTexture } from './gpu/gpuSetup.js';
import { createPipelines } from './gpu/pipelines.js';
import { FluidSimulation } from './core/FluidSimulation.js';
import { setupInputHandlers } from './ui/input.js';
import { initializeUI, loadSettingsFromURL } from './ui/ui.js';

async function main() {
    try {
        loadSettingsFromURL();

        const canvas = document.querySelector("canvas");

        function resizeCanvas() {
            canvas.width = CONFIG.DISPLAY_RESOLUTION;
            canvas.height = CONFIG.DISPLAY_RESOLUTION;
        }

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const { device, canvasFormat, context } = await initGPU();
        const { vertexBuffer, vertexBufferLayout } = createVertexBuffer(device);
        const buffers = createBuffers(device, CONFIG.GRID_SIZE);
        const { texture, sampler } = createTexture(device, CONFIG.N);
        const pipelines = createPipelines(device, canvasFormat, vertexBufferLayout);
        const simulation = new FluidSimulation(device, context, buffers, pipelines, vertexBuffer, texture, sampler);

        setupInputHandlers(canvas, simulation);
        initializeUI();

        document.getElementById('clearBtn')?.addEventListener('click', () => simulation.clear());

        function animate() {
            simulation.run();
            requestAnimationFrame(animate);
        }
        animate();

    } catch (error) {
        alert('WebGPU not supported');
    }
}

main();

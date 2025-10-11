import { CONFIG } from './config.js';
import { initGPU, createVertexBuffer, createBuffers, createTexture } from './gpuSetup.js';
import { createPipelines, FluidSimulation } from './fluidSimulation.js';
import { setupInputHandlers } from './input.js';
import { initializeUI } from './ui.js';

async function main() {
    try {
        // Initialize WebGPU
        const gpuInfo = await initGPU();
        const { device, canvasFormat, context } = gpuInfo;
        
        // Create vertex buffer
        const squareInfo = createVertexBuffer(device);
        
        // Create simulation buffers
        const buffers = createBuffers(device, CONFIG.GRID_SIZE);
        
        // Create texture and sampler
        const { texture, sampler } = createTexture(device, CONFIG.N);
        
        // Create all pipelines
        const pipelines = createPipelines(device, canvasFormat, squareInfo.vertexBufferLayout);
        
        // Create simulation instance
        const simulation = new FluidSimulation(
            device,
            context,
            buffers,
            pipelines,
            squareInfo.vertexBuffer,
            texture,
            sampler
        );
        
        // Setup input handlers
        const canvas = document.querySelector("canvas");
        setupInputHandlers(canvas);
        
        // Initialize UI controls
        const uiController = initializeUI();
        
        // Connect clear button to simulation
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (simulation.clear) {
                    simulation.clear();
                }
            });
        }
        
        // Start simulation loop
        setInterval(() => simulation.run(), CONFIG.UPDATE_INTERVAL);
        
        console.log('Fluid simulation started successfully!');
        console.log('UI controls initialized');
        
    } catch (error) {
        console.error('Failed to initialize fluid simulation:', error);
        alert('WebGPU is not supported on this browser. Please use a browser with WebGPU support.');
    }
}

main();

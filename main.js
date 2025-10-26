import { CONFIG } from './config.js';
import { initGPU, createVertexBuffer, createBuffers, createTexture } from './gpuSetup.js';
import { createPipelines, FluidSimulation } from './fluidSimulation.js';
import { setupInputHandlers } from './input.js';
import { initializeUI } from './ui.js';

// Load settings from URL FIRST, before anything else
function loadSettingsFromURL() {
    const params = new URLSearchParams(window.location.search);

    if (params.has('diffuse')) CONFIG.DIFFUSE = parseFloat(params.get('diffuse'));
    if (params.has('viscosity')) CONFIG.VISCOSITY = parseFloat(params.get('viscosity'));
    if (params.has('gridSize')) {
        CONFIG.N = parseInt(params.get('gridSize'));
        CONFIG.GRID_SIZE = CONFIG.N + 2;
    }
    if (params.has('colorRadius')) CONFIG.COLOR_RADIUS = parseInt(params.get('colorRadius'));
    if (params.has('velocityRadius')) CONFIG.VELOCITY_RADIUS = parseInt(params.get('velocityRadius'));
    if (params.has('updateInterval')) CONFIG.UPDATE_INTERVAL = parseInt(params.get('updateInterval'));
}

async function main() {
    try {
        // Load URL parameters FIRST
        loadSettingsFromURL();
        console.log('Loaded CONFIG.N from URL:', CONFIG.N);

        // Setup canvas to match display size
        const canvas = document.querySelector("canvas");

        function resizeCanvas() {
            // Setup canvas with adaptive resolution based on grid size
            const canvas = document.querySelector("canvas");
            const resolution = CONFIG.getAdaptiveDisplayResolution();
            canvas.width = resolution;
            canvas.height = resolution;
            console.log('Canvas set to:', canvas.width, 'x', canvas.height, 'for grid size', CONFIG.N);
        }

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Initialize WebGPU
        const gpuInfo = await initGPU();
        const { device, canvasFormat, context } = gpuInfo;

        // Create vertex buffer
        const squareInfo = createVertexBuffer(device);

        // Create simulation buffers
        const buffers = createBuffers(device, CONFIG.GRID_SIZE);

        // Create texture and sampler
        const { texture, sampler, bloomTexture1, bloomTexture2, renderTexture } = createTexture(device, CONFIG.N);

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
            sampler,
            bloomTexture1,
            bloomTexture2,
            renderTexture
        );

        // Setup input handlers
        setupInputHandlers(canvas, simulation);

        // Initialize UI controls
        console.log('Initializing UI controller...');
        const uiController = initializeUI();
        console.log('UI controller created:', uiController);

        // Make it globally accessible for debugging
        window.uiController = uiController;

        // Connect clear button to simulation
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                simulation.clear();
            });
        }

        // Connect clear obstacles button to simulation
        const clearObstaclesBtn = document.getElementById('clearObstaclesBtn');
        if (clearObstaclesBtn) {
            clearObstaclesBtn.addEventListener('click', () => {
                simulation.clearObstacles();
            });
        }

        // Start simulation loop using requestAnimationFrame for proper GPU synchronization
        console.log('Starting animation loop for grid size', CONFIG.N);

        function animate() {
            simulation.run();
            requestAnimationFrame(animate);
        }

        // Start the animation loop
        requestAnimationFrame(animate);

        console.log('Fluid simulation started successfully!');
        console.log('UI controls initialized');

    } catch (error) {
        console.error('Failed to initialize fluid simulation:', error);
        alert('WebGPU is not supported on this browser. Please use a browser with WebGPU support.');
    }
}

main();

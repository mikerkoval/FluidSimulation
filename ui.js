import { CONFIG, STATE } from './config.js';

export class UIController {
    constructor() {
        this.elements = {};
        this.loadSettingsFromURL();
        this.initializeUI();
        this.attachEventListeners();
    }

    loadSettingsFromURL() {
        // Parse URL parameters to restore settings
        const params = new URLSearchParams(window.location.search);

        if (params.has('diffuse')) CONFIG.DIFFUSE = parseFloat(params.get('diffuse'));
        if (params.has('viscosity')) CONFIG.VISCOSITY = parseFloat(params.get('viscosity'));
        if (params.has('fade')) CONFIG.FADE = parseFloat(params.get('fade'));
        if (params.has('vorticity')) CONFIG.VORTICITY = parseFloat(params.get('vorticity'));
        if (params.has('bloomIntensity')) CONFIG.BLOOM_INTENSITY = parseFloat(params.get('bloomIntensity'));
        if (params.has('bloomThreshold')) CONFIG.BLOOM_THRESHOLD = parseFloat(params.get('bloomThreshold'));
        if (params.has('gridSize')) {
            CONFIG.N = parseInt(params.get('gridSize'));
            CONFIG.GRID_SIZE = CONFIG.N + 2;
        }
        if (params.has('colorRadius')) CONFIG.COLOR_RADIUS = parseInt(params.get('colorRadius'));
        if (params.has('velocityRadius')) CONFIG.VELOCITY_RADIUS = parseInt(params.get('velocityRadius'));
        if (params.has('updateInterval')) CONFIG.UPDATE_INTERVAL = parseInt(params.get('updateInterval'));
        if (params.has('solverIterations')) CONFIG.SOLVER_ITERATIONS = parseInt(params.get('solverIterations'));
        if (params.has('displayResolution')) CONFIG.DISPLAY_RESOLUTION = parseInt(params.get('displayResolution'));

        // Update STATE to match CONFIG
        STATE.diffuseState = CONFIG.DIFFUSE;
    }

    saveSettingsToURL() {
        const params = new URLSearchParams();
        params.set('diffuse', CONFIG.DIFFUSE);
        params.set('viscosity', CONFIG.VISCOSITY);
        params.set('fade', CONFIG.FADE);
        params.set('vorticity', CONFIG.VORTICITY);
        params.set('bloomIntensity', CONFIG.BLOOM_INTENSITY);
        params.set('bloomThreshold', CONFIG.BLOOM_THRESHOLD);
        params.set('gridSize', CONFIG.N);
        params.set('colorRadius', CONFIG.COLOR_RADIUS);
        params.set('velocityRadius', CONFIG.VELOCITY_RADIUS);
        params.set('updateInterval', CONFIG.UPDATE_INTERVAL);
        params.set('solverIterations', CONFIG.SOLVER_ITERATIONS);
        params.set('displayResolution', CONFIG.DISPLAY_RESOLUTION);
        return params.toString();
    }

    initializeUI() {
        // Get all UI elements
        this.elements = {
            diffuseSlider: document.getElementById('diffuseSlider'),
            diffuseValue: document.getElementById('diffuseValue'),
            viscositySlider: document.getElementById('viscositySlider'),
            viscosityValue: document.getElementById('viscosityValue'),
            fadeSlider: document.getElementById('fadeSlider'),
            fadeValue: document.getElementById('fadeValue'),
            vorticitySlider: document.getElementById('vorticitySlider'),
            vorticityValue: document.getElementById('vorticityValue'),
            bloomIntensitySlider: document.getElementById('bloomIntensitySlider'),
            bloomIntensityValue: document.getElementById('bloomIntensityValue'),
            bloomThresholdSlider: document.getElementById('bloomThresholdSlider'),
            bloomThresholdValue: document.getElementById('bloomThresholdValue'),
            gridSizeSlider: document.getElementById('gridSizeSlider'),
            gridSizeValue: document.getElementById('gridSizeValue'),
            colorRadiusSlider: document.getElementById('colorRadiusSlider'),
            colorRadiusValue: document.getElementById('colorRadiusValue'),
            velocityRadiusSlider: document.getElementById('velocityRadiusSlider'),
            velocityRadiusValue: document.getElementById('velocityRadiusValue'),
            updateIntervalSlider: document.getElementById('updateIntervalSlider'),
            updateIntervalValue: document.getElementById('updateIntervalValue'),
            drawModeToggle: document.getElementById('drawModeToggle'),
            drawModeText: document.getElementById('drawModeText'),
            textureDrawToggle: document.getElementById('textureDrawToggle'),
            pauseBtn: document.getElementById('pauseBtn'),
            clearBtn: document.getElementById('clearBtn'),
            reloadBtn: document.getElementById('reloadBtn'),
            minimizeBtn: document.getElementById('minimizeBtn'),
            controlsPanel: document.getElementById('controlsPanel'),
            solverIterationsSlider: document.getElementById('solverIterationsSlider'),
            solverIterationsValue: document.getElementById('solverIterationsValue'),
            displayResolutionSlider: document.getElementById('displayResolutionSlider'),
            displayResolutionValue: document.getElementById('displayResolutionValue'),
            bloomToggle: document.getElementById('bloomToggle'),
            vorticityToggle: document.getElementById('vorticityToggle'),
            fadeToggle: document.getElementById('fadeToggle'),
            fpsToggle: document.getElementById('fpsToggle'),
            adaptiveToggle: document.getElementById('adaptiveToggle'),
            fpsCounter: document.getElementById('fpsCounter'),
            paletteSelector: document.getElementById('paletteSelector'),
            clearObstaclesBtn: document.getElementById('clearObstaclesBtn'),
            obstacleRadiusSlider: document.getElementById('obstacleRadiusSlider'),
            obstacleRadiusValue: document.getElementById('obstacleRadiusValue'),
        };

        // Set slider values to match current CONFIG
        if (this.elements.diffuseSlider) this.elements.diffuseSlider.value = CONFIG.DIFFUSE;
        if (this.elements.viscositySlider) this.elements.viscositySlider.value = CONFIG.VISCOSITY;
        if (this.elements.fadeSlider) this.elements.fadeSlider.value = CONFIG.FADE;
        if (this.elements.vorticitySlider) this.elements.vorticitySlider.value = CONFIG.VORTICITY;
        if (this.elements.bloomIntensitySlider) this.elements.bloomIntensitySlider.value = CONFIG.BLOOM_INTENSITY;
        if (this.elements.bloomThresholdSlider) this.elements.bloomThresholdSlider.value = CONFIG.BLOOM_THRESHOLD;
        if (this.elements.gridSizeSlider) this.elements.gridSizeSlider.value = CONFIG.N;
        if (this.elements.colorRadiusSlider) this.elements.colorRadiusSlider.value = CONFIG.COLOR_RADIUS;
        if (this.elements.velocityRadiusSlider) this.elements.velocityRadiusSlider.value = CONFIG.VELOCITY_RADIUS;
        if (this.elements.updateIntervalSlider) this.elements.updateIntervalSlider.value = CONFIG.UPDATE_INTERVAL;
        if (this.elements.solverIterationsSlider) this.elements.solverIterationsSlider.value = CONFIG.SOLVER_ITERATIONS;
        if (this.elements.displayResolutionSlider) this.elements.displayResolutionSlider.value = CONFIG.DISPLAY_RESOLUTION;
        if (this.elements.paletteSelector) this.elements.paletteSelector.value = CONFIG.COLOR_PALETTE;
        if (this.elements.obstacleRadiusSlider) this.elements.obstacleRadiusSlider.value = STATE.obstacleRadius;

        // Initialize FPS tracking if SHOW_FPS is enabled by default
        if (CONFIG.SHOW_FPS) {
            STATE.frameCount = 0;
            STATE.lastFpsTime = performance.now();
        }

        // Update all displays
        this.updateAllDisplays();

        // Initialize collapsible categories
        this.initializeCollapsibleCategories();
    }

    initializeCollapsibleCategories() {
        const categoryHeaders = document.querySelectorAll('.category-header');

        categoryHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const category = header.closest('.settings-category');
                category.classList.toggle('collapsed');
            });
        });
    }

    updateAllDisplays() {
        this.updateSliderDisplay('diffuse', CONFIG.DIFFUSE.toFixed(3));
        this.updateSliderDisplay('viscosity', CONFIG.VISCOSITY.toFixed(3));
        this.updateSliderDisplay('fade', CONFIG.FADE.toFixed(3));
        this.updateSliderDisplay('vorticity', CONFIG.VORTICITY.toFixed(3));
        this.updateSliderDisplay('bloomIntensity', CONFIG.BLOOM_INTENSITY.toFixed(3));
        this.updateSliderDisplay('bloomThreshold', CONFIG.BLOOM_THRESHOLD.toFixed(3));
        this.updateSliderDisplay('gridSize', CONFIG.N);
        this.updateSliderDisplay('colorRadius', CONFIG.COLOR_RADIUS);
        this.updateSliderDisplay('velocityRadius', CONFIG.VELOCITY_RADIUS);
        this.updateSliderDisplay('updateInterval', CONFIG.UPDATE_INTERVAL, 'ms');
        this.updateSliderDisplay('solverIterations', CONFIG.SOLVER_ITERATIONS);
        this.updateSliderDisplay('displayResolution', CONFIG.DISPLAY_RESOLUTION);
        this.updateSliderDisplay('obstacleRadius', STATE.obstacleRadius);
    }

    updateSliderDisplay(name, value, suffix = '') {
        const valueElement = this.elements[name + 'Value'];
        if (valueElement) {
            valueElement.textContent = value + suffix;
        }
    }

    attachEventListeners() {
        // Diffusion slider
        this.elements.diffuseSlider?.addEventListener('input', (e) => {
            CONFIG.DIFFUSE = parseFloat(e.target.value);
            STATE.diffuseState = CONFIG.DIFFUSE;
            this.updateSliderDisplay('diffuse', parseFloat(e.target.value).toFixed(3));
        });

        // Viscosity slider
        this.elements.viscositySlider?.addEventListener('input', (e) => {
            CONFIG.VISCOSITY = parseFloat(e.target.value);
            this.updateSliderDisplay('viscosity', parseFloat(e.target.value).toFixed(3));
        });

        // Fade slider
        this.elements.fadeSlider?.addEventListener('input', (e) => {
            CONFIG.FADE = parseFloat(e.target.value);
            this.updateSliderDisplay('fade', parseFloat(e.target.value).toFixed(3));
        });

        // Vorticity slider
        this.elements.vorticitySlider?.addEventListener('input', (e) => {
            CONFIG.VORTICITY = parseFloat(e.target.value);
            this.updateSliderDisplay('vorticity', parseFloat(e.target.value).toFixed(3));
        });

        // Bloom intensity slider
        this.elements.bloomIntensitySlider?.addEventListener('input', (e) => {
            CONFIG.BLOOM_INTENSITY = parseFloat(e.target.value);
            this.updateSliderDisplay('bloomIntensity', parseFloat(e.target.value).toFixed(3));
        });

        // Bloom threshold slider
        this.elements.bloomThresholdSlider?.addEventListener('input', (e) => {
            CONFIG.BLOOM_THRESHOLD = parseFloat(e.target.value);
            this.updateSliderDisplay('bloomThreshold', parseFloat(e.target.value).toFixed(3));
        });

        // Grid size slider
        this.elements.gridSizeSlider?.addEventListener('input', (e) => {
            const newSize = parseInt(e.target.value);
            this.updateSliderDisplay('gridSize', newSize);
        });

        // Color radius slider
        this.elements.colorRadiusSlider?.addEventListener('input', (e) => {
            CONFIG.COLOR_RADIUS = parseInt(e.target.value);
            this.updateSliderDisplay('colorRadius', e.target.value);
        });

        // Velocity radius slider
        this.elements.velocityRadiusSlider?.addEventListener('input', (e) => {
            CONFIG.VELOCITY_RADIUS = parseInt(e.target.value);
            this.updateSliderDisplay('velocityRadius', e.target.value);
        });

        // Update interval slider
        this.elements.updateIntervalSlider?.addEventListener('input', (e) => {
            CONFIG.UPDATE_INTERVAL = parseInt(e.target.value);
            this.updateSliderDisplay('updateInterval', e.target.value, 'ms');
        });

        // Draw mode toggle
        this.elements.drawModeToggle?.addEventListener('click', () => {
            this.elements.drawModeToggle.classList.toggle('active');
            if (STATE.drawState === CONFIG.DRAW_DENSITY) {
                STATE.drawState = CONFIG.DRAW_VELOCITY;
                this.elements.drawModeText.textContent = 'Velocity';
            } else {
                STATE.drawState = CONFIG.DRAW_DENSITY;
                this.elements.drawModeText.textContent = 'Density';
            }
        });

        // Texture draw toggle
        this.elements.textureDrawToggle?.addEventListener('click', () => {
            this.elements.textureDrawToggle.classList.toggle('active');
            STATE.textureDraw = !STATE.textureDraw;
        });

        // Pause button
        this.elements.pauseBtn?.addEventListener('click', () => {
            STATE.pause = !STATE.pause;
            this.elements.pauseBtn.textContent = STATE.pause ? 'Resume' : 'Pause';
        });

        // Clear button
        this.elements.clearBtn?.addEventListener('click', () => {
            this.clearSimulation();
        });

        // Reload button
        this.elements.reloadBtn?.addEventListener('click', () => {
            this.reloadSimulation();
        });

        // Minimize button
        this.elements.minimizeBtn?.addEventListener('click', () => {
            this.elements.controlsPanel?.classList.toggle('minimized');
            this.elements.minimizeBtn.textContent =
                this.elements.controlsPanel?.classList.contains('minimized') ? '+' : '−';
        });
        // Solver iterations slider
        this.elements.solverIterationsSlider?.addEventListener('input', (e) => {
            CONFIG.SOLVER_ITERATIONS = parseInt(e.target.value);
            this.updateSliderDisplay('solverIterations', e.target.value);
        });

        // Display resolution slider
        this.elements.displayResolutionSlider?.addEventListener('input', (e) => {
            CONFIG.DISPLAY_RESOLUTION = parseInt(e.target.value);
            this.updateSliderDisplay('displayResolution', e.target.value);
        });

        // Bloom toggle
        this.elements.bloomToggle?.addEventListener('click', () => {
            CONFIG.ENABLE_BLOOM = !CONFIG.ENABLE_BLOOM;
            this.elements.bloomToggle.classList.toggle('active');
            const span = this.elements.bloomToggle.querySelector('span');
            if (span) span.textContent = CONFIG.ENABLE_BLOOM ? 'Enabled' : 'Disabled';
        });

        // Vorticity toggle
        this.elements.vorticityToggle?.addEventListener('click', () => {
            CONFIG.ENABLE_VORTICITY = !CONFIG.ENABLE_VORTICITY;
            this.elements.vorticityToggle.classList.toggle('active');
            const span = this.elements.vorticityToggle.querySelector('span');
            if (span) span.textContent = CONFIG.ENABLE_VORTICITY ? 'Enabled' : 'Disabled';
        });

        // Fade toggle
        this.elements.fadeToggle?.addEventListener('click', () => {
            CONFIG.ENABLE_FADE = !CONFIG.ENABLE_FADE;
            this.elements.fadeToggle.classList.toggle('active');
            const span = this.elements.fadeToggle.querySelector('span');
            if (span) span.textContent = CONFIG.ENABLE_FADE ? 'Enabled' : 'Disabled';
        });

        // FPS toggle
        this.elements.fpsToggle?.addEventListener('click', () => {
            CONFIG.SHOW_FPS = !CONFIG.SHOW_FPS;
            this.elements.fpsToggle.classList.toggle('active');
            const span = this.elements.fpsToggle.querySelector('span');
            if (span) span.textContent = CONFIG.SHOW_FPS ? 'Enabled' : 'Disabled';

            // Show/hide FPS counter
            if (this.elements.fpsCounter) {
                this.elements.fpsCounter.style.display = CONFIG.SHOW_FPS ? 'block' : 'none';
            }

            // Reset FPS tracking
            if (CONFIG.SHOW_FPS) {
                STATE.frameCount = 0;
                STATE.lastFpsTime = performance.now();
            }
        });

        // Adaptive Performance toggle
        this.elements.adaptiveToggle?.addEventListener('click', () => {
            CONFIG.ENABLE_ADAPTIVE_PERFORMANCE = !CONFIG.ENABLE_ADAPTIVE_PERFORMANCE;
            this.elements.adaptiveToggle.classList.toggle('active');
            const span = this.elements.adaptiveToggle.querySelector('span');
            if (span) span.textContent = CONFIG.ENABLE_ADAPTIVE_PERFORMANCE ? 'Enabled' : 'Disabled';

            // Reset to default iterations when disabled
            if (!CONFIG.ENABLE_ADAPTIVE_PERFORMANCE) {
                STATE.currentSolverIterations = CONFIG.SOLVER_ITERATIONS;
                STATE.fpsHistory = [];
                console.log(`Adaptive Performance disabled. Iterations reset to ${CONFIG.SOLVER_ITERATIONS}`);
            } else {
                console.log(`Adaptive Performance enabled. Target FPS: ${CONFIG.TARGET_FPS}`);
            }
        });

        // Color Palette selector
        this.elements.paletteSelector?.addEventListener('change', (e) => {
            CONFIG.COLOR_PALETTE = e.target.value;
            console.log(`Color palette changed to: ${CONFIG.COLOR_PALETTE}`);
        });

        // Obstacle Radius slider
        this.elements.obstacleRadiusSlider?.addEventListener('input', (e) => {
            STATE.obstacleRadius = parseInt(e.target.value);
            this.updateSliderDisplay('obstacleRadius', e.target.value);
        });
    }

    clearSimulation() {
        // This method should be connected to your simulation's clear function
        console.log('Clear simulation requested');
        // You'll need to implement this in your FluidSimulation class
    }

    reloadSimulation() {
        // Update grid size if changed
        const newGridSize = parseInt(this.elements.gridSizeSlider?.value || CONFIG.N);
        if (newGridSize !== CONFIG.N) {
            CONFIG.N = newGridSize;
            CONFIG.GRID_SIZE = newGridSize + 2;
        }

        // Save settings to URL and reload
        const settingsQuery = this.saveSettingsToURL();
        console.log('Reloading with settings:', settingsQuery);
        console.log('New URL will be:', window.location.pathname + '?' + settingsQuery);

        // Use location.search instead to properly set query params
        const newURL = window.location.origin + window.location.pathname + '?' + settingsQuery;
        console.log('Full URL:', newURL);
        window.location.href = newURL;
    }
}

export function initializeUI() {
    return new UIController();
}

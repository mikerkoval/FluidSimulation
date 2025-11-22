import { CONFIG, STATE } from '../core/config.js';

export function loadSettingsFromURL() {
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
    if (params.has('solverIterations')) CONFIG.SOLVER_ITERATIONS = parseInt(params.get('solverIterations'));
    if (params.has('displayResolution')) CONFIG.DISPLAY_RESOLUTION = parseInt(params.get('displayResolution'));
    STATE.diffuseState = CONFIG.DIFFUSE;
}

export class UIController {
    constructor() {
        this.elements = {};
        this.initializeUI();
        this.attachEventListeners();
    }

    saveSettingsToURL() {
        const params = new URLSearchParams();
        params.set('diffuse', CONFIG.DIFFUSE);
        params.set('viscosity', CONFIG.VISCOSITY);
        params.set('gridSize', CONFIG.N);
        params.set('colorRadius', CONFIG.COLOR_RADIUS);
        params.set('velocityRadius', CONFIG.VELOCITY_RADIUS);
        params.set('updateInterval', CONFIG.UPDATE_INTERVAL);
        params.set('solverIterations', CONFIG.SOLVER_ITERATIONS);
        params.set('displayResolution', CONFIG.DISPLAY_RESOLUTION);
        return params.toString();
    }

    initializeUI() {
        this.elements = {
            diffuseSlider: document.getElementById('diffuseSlider'),
            diffuseValue: document.getElementById('diffuseValue'),
            viscositySlider: document.getElementById('viscositySlider'),
            viscosityValue: document.getElementById('viscosityValue'),
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
            fpsToggle: document.getElementById('fpsToggle'),
            fpsCounter: document.getElementById('fpsCounter')
        };
        if (this.elements.diffuseSlider) this.elements.diffuseSlider.value = CONFIG.DIFFUSE;
        if (this.elements.viscositySlider) this.elements.viscositySlider.value = CONFIG.VISCOSITY;
        if (this.elements.gridSizeSlider) this.elements.gridSizeSlider.value = CONFIG.N;
        if (this.elements.colorRadiusSlider) this.elements.colorRadiusSlider.value = CONFIG.COLOR_RADIUS;
        if (this.elements.velocityRadiusSlider) this.elements.velocityRadiusSlider.value = CONFIG.VELOCITY_RADIUS;
        if (this.elements.updateIntervalSlider) this.elements.updateIntervalSlider.value = CONFIG.UPDATE_INTERVAL;
        if (this.elements.solverIterationsSlider) this.elements.solverIterationsSlider.value = CONFIG.SOLVER_ITERATIONS;
        if (this.elements.displayResolutionSlider) this.elements.displayResolutionSlider.value = CONFIG.DISPLAY_RESOLUTION;
        if (CONFIG.SHOW_FPS) {
            STATE.frameCount = 0;
            STATE.lastFpsTime = performance.now();
        }
        this.updateAllDisplays();
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
        this.updateSliderDisplay('gridSize', CONFIG.N);
        this.updateSliderDisplay('colorRadius', CONFIG.COLOR_RADIUS);
        this.updateSliderDisplay('velocityRadius', CONFIG.VELOCITY_RADIUS);
        this.updateSliderDisplay('updateInterval', CONFIG.UPDATE_INTERVAL, 'ms');
        this.updateSliderDisplay('solverIterations', CONFIG.SOLVER_ITERATIONS);
        this.updateSliderDisplay('displayResolution', CONFIG.DISPLAY_RESOLUTION);
    }

    updateSliderDisplay(name, value, suffix = '') {
        const valueElement = this.elements[name + 'Value'];
        if (valueElement) {
            valueElement.textContent = value + suffix;
        }
    }

    attachEventListeners() {
        this.elements.diffuseSlider?.addEventListener('input', (e) => {
            CONFIG.DIFFUSE = parseFloat(e.target.value);
            STATE.diffuseState = CONFIG.DIFFUSE;
            this.updateSliderDisplay('diffuse', parseFloat(e.target.value).toFixed(3));
        });
        this.elements.viscositySlider?.addEventListener('input', (e) => {
            CONFIG.VISCOSITY = parseFloat(e.target.value);
            this.updateSliderDisplay('viscosity', parseFloat(e.target.value).toFixed(3));
        });
        this.elements.gridSizeSlider?.addEventListener('input', (e) => {
            const newSize = parseInt(e.target.value);
            this.updateSliderDisplay('gridSize', newSize);
        });
        this.elements.colorRadiusSlider?.addEventListener('input', (e) => {
            CONFIG.COLOR_RADIUS = parseInt(e.target.value);
            this.updateSliderDisplay('colorRadius', e.target.value);
        });
        this.elements.velocityRadiusSlider?.addEventListener('input', (e) => {
            CONFIG.VELOCITY_RADIUS = parseInt(e.target.value);
            this.updateSliderDisplay('velocityRadius', e.target.value);
        });
        this.elements.updateIntervalSlider?.addEventListener('input', (e) => {
            CONFIG.UPDATE_INTERVAL = parseInt(e.target.value);
            this.updateSliderDisplay('updateInterval', e.target.value, 'ms');
        });
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
        this.elements.textureDrawToggle?.addEventListener('click', () => {
            this.elements.textureDrawToggle.classList.toggle('active');
            STATE.textureDraw = !STATE.textureDraw;
        });
        this.elements.pauseBtn?.addEventListener('click', () => {
            STATE.pause = !STATE.pause;
            this.elements.pauseBtn.textContent = STATE.pause ? 'Resume' : 'Pause';
        });
        this.elements.reloadBtn?.addEventListener('click', () => {
            this.reloadSimulation();
        });
        this.elements.minimizeBtn?.addEventListener('click', () => {
            this.elements.controlsPanel?.classList.toggle('minimized');
            this.elements.minimizeBtn.textContent =
                this.elements.controlsPanel?.classList.contains('minimized') ? '+' : '−';
        });
        this.elements.solverIterationsSlider?.addEventListener('input', (e) => {
            CONFIG.SOLVER_ITERATIONS = parseInt(e.target.value);
            this.updateSliderDisplay('solverIterations', e.target.value);
        });
        this.elements.displayResolutionSlider?.addEventListener('input', (e) => {
            CONFIG.DISPLAY_RESOLUTION = parseInt(e.target.value);
            this.updateSliderDisplay('displayResolution', e.target.value);
        });
        this.elements.fpsToggle?.addEventListener('click', () => {
            CONFIG.SHOW_FPS = !CONFIG.SHOW_FPS;
            this.elements.fpsToggle.classList.toggle('active');
            const span = this.elements.fpsToggle.querySelector('span');
            if (span) span.textContent = CONFIG.SHOW_FPS ? 'Enabled' : 'Disabled';
            if (this.elements.fpsCounter) {
                this.elements.fpsCounter.style.display = CONFIG.SHOW_FPS ? 'block' : 'none';
            }
            if (CONFIG.SHOW_FPS) {
                STATE.frameCount = 0;
                STATE.lastFpsTime = performance.now();
            }
        });
    }

    reloadSimulation() {
        const newGridSize = parseInt(this.elements.gridSizeSlider?.value || CONFIG.N);
        if (newGridSize !== CONFIG.N) {
            CONFIG.N = newGridSize;
            CONFIG.GRID_SIZE = newGridSize + 2;
        }
        const settingsQuery = this.saveSettingsToURL();
        const newURL = window.location.origin + window.location.pathname + '?' + settingsQuery;
        window.location.href = newURL;
    }
}

export function initializeUI() {
    return new UIController();
}

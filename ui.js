import { CONFIG, STATE } from './config.js';

export class UIController {
    constructor() {
        this.elements = {};
        this.initializeUI();
        this.attachEventListeners();
    }

    initializeUI() {
        // Get all UI elements
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
            controlsPanel: document.getElementById('controlsPanel')
        };

        // Set initial values
        this.updateAllDisplays();
    }

    updateAllDisplays() {
        this.updateSliderDisplay('diffuse', CONFIG.DIFFUSE);
        this.updateSliderDisplay('viscosity', CONFIG.VISCOSITY);
        this.updateSliderDisplay('gridSize', CONFIG.N);
        this.updateSliderDisplay('colorRadius', CONFIG.COLOR_RADIUS);
        this.updateSliderDisplay('velocityRadius', CONFIG.VELOCITY_RADIUS);
        this.updateSliderDisplay('updateInterval', CONFIG.UPDATE_INTERVAL, 'ms');
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
            this.updateSliderDisplay('diffuse', e.target.value);
        });

        // Viscosity slider
        this.elements.viscositySlider?.addEventListener('input', (e) => {
            CONFIG.VISCOSITY = parseFloat(e.target.value);
            this.updateSliderDisplay('viscosity', e.target.value);
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

        // Reload the page to reinitialize with new settings
        window.location.reload();
    }
}

export function initializeUI() {
    return new UIController();
}

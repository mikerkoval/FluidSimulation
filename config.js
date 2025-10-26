export const CONFIG = {
    DIFFUSE: 0.0,
    VISCOSITY: 0,
    N: 64,
    GRID_SIZE: 66,
    COLOR_RADIUS: 3,  // Smaller radius for 64 grid
    VELOCITY_RADIUS: 2,  // Slightly larger for better flow
    WORKGROUP_SIZE: 16,
    UPDATE_INTERVAL: 16,  // Faster updates for smoother animation (~60fps)
    DRAW_DENSITY: 1,
    DRAW_VELOCITY: 2,
    SOLVER_ITERATIONS: 10,  // More iterations for better quality at 64 grid
    DISPLAY_RESOLUTION: 512,
    FADE: 0.98,  // Slightly faster fade for better visual
    VORTICITY: 0.5,  // Higher vorticity for more pronounced swirls
    BLOOM_INTENSITY: 0.4,  // Bloom glow strength (0 = off, higher = more glow)
    BLOOM_THRESHOLD: 0.7,  // Brightness threshold for bloom (0-1)
    ENABLE_BLOOM: true,  // Toggle bloom effect on/off
    ENABLE_VORTICITY: true,  // Toggle vorticity confinement on/off
    ENABLE_FADE: true,  // Toggle fade effect on/off
    SHOW_FPS: true,  // Toggle FPS counter display
    // Color palette settings
    COLOR_PALETTE: 'rainbow',  // Available: rainbow, ocean, fire, neon, pastel, monochrome, sunset
    getPaletteIndex() {
        const palettes = {
            'rainbow': 0,
            'ocean': 1,
            'fire': 2,
            'neon': 3,
            'pastel': 4,
            'monochrome': 5,
            'sunset': 6
        };
        return palettes[this.COLOR_PALETTE] || 0;
    },
    // Adaptive performance settings
    ENABLE_ADAPTIVE_PERFORMANCE: true,  // Auto-adjust quality based on FPS
    TARGET_FPS: 30,  // Target FPS for adaptive performance
    FPS_SAMPLE_SIZE: 60,  // Number of frames to average for FPS measurement
    // Auto-adjust update interval based on grid size for performance
    getAdaptiveUpdateInterval() {
        if (this.N <= 64) return this.UPDATE_INTERVAL;
        if (this.N <= 128) return Math.max(this.UPDATE_INTERVAL, 40);
        if (this.N <= 256) return Math.max(this.UPDATE_INTERVAL, 60);
        return Math.max(this.UPDATE_INTERVAL, 80);
    },
    // Auto-adjust display resolution based on grid size
    getAdaptiveDisplayResolution() {
        if (this.N <= 64) return this.DISPLAY_RESOLUTION;
        if (this.N <= 128) return Math.min(this.DISPLAY_RESOLUTION, 512);
        if (this.N <= 256) return Math.min(this.DISPLAY_RESOLUTION, 256);
        return Math.min(this.DISPLAY_RESOLUTION, 256);
    }
};

export const STATE = {
    diffuseState: CONFIG.DIFFUSE,
    drawState: CONFIG.DRAW_DENSITY,
    pause: false,
    textureDraw: true,
    step: 0,
    densityStep: 0,
    velocityStep: 0,
    mousePosition: { x: 0, y: 0, x0: 0, y0: 0 },
    // FPS tracking
    frameCount: 0,
    lastFpsTime: performance.now(),
    currentFps: 0,
    fpsHistory: [],
    // Adaptive performance state
    currentSolverIterations: CONFIG.SOLVER_ITERATIONS,
    lastAdjustmentTime: performance.now(),
    adjustmentCooldown: 2000,  // Wait 2 seconds between adjustments
    // Obstacle mode
    obstacleMode: true,  // Always enabled
    obstacleRadius: 3
};

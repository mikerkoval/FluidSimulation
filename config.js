export const CONFIG = {
    DIFFUSE: 0.0,
    VISCOSITY: 0,
    N: 64,
    GRID_SIZE: 66,
    COLOR_RADIUS: 5,
    VELOCITY_RADIUS: 1,
    WORKGROUP_SIZE: 16,
    UPDATE_INTERVAL: 30,
    DRAW_DENSITY: 1,
    DRAW_VELOCITY: 2,
    SOLVER_ITERATIONS: 5,
    DISPLAY_RESOLUTION: 512,
    FADE: 0.99,  // 1.0 = no fade, lower = faster fade
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
    mousePosition: { x: 0, y: 0, x0: 0, y0: 0 }
};

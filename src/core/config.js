export const CONFIG = {
    DIFFUSE: 0.0,
    VISCOSITY: 0,
    VORTICITY: 0.05,
    GRAVITY: 0,
    VELOCITY_DECAY: 1.0,
    DENSITY_DECAY: 0.99,  // Fade of colors over time
    N: 64,  // Velocity simulation resolution
    GRID_SIZE: 66,  // N + 2 for boundary
    DYE_N: 128,  // Dye resolution (higher for smoother visuals)
    DYE_GRID_SIZE: 130,  // DYE_N + 2 for boundary
    COLOR_RADIUS: 4,
    VELOCITY_RADIUS: 3,
    VELOCITY_FORCE_MULTIPLIER: 0.3,
    WORKGROUP_SIZE: 16,
    UPDATE_INTERVAL: 16,  // ~60fps
    DRAW_DENSITY: 1,
    DRAW_VELOCITY: 2,
    SOLVER_ITERATIONS: 5,  // Number of iterations for diffuse and project solvers
    DISPLAY_RESOLUTION: 128,
    SHOW_FPS: true,
    ENABLE_BLOOM: true  // Toggle bloom effect
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
    frameCount: 0,
    lastFpsTime: performance.now(),
    currentFps: 0
};

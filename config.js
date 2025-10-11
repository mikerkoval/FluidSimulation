export const CONFIG = {
    DIFFUSE: 0.0,
    VISCOSITY: 0,
    N: 64,              // Changed from 512
    GRID_SIZE: 130,      // Changed from 514 (N + 2)
    COLOR_RADIUS: 5,
    VELOCITY_RADIUS: 1,
    WORKGROUP_SIZE: 16,
    UPDATE_INTERVAL: 30,
    DRAW_DENSITY: 1,
    DRAW_VELOCITY: 2
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

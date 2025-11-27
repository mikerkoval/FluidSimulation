import { STATE } from './config.js';
import { FluidSolver } from './solver.js';
import { FluidRenderer } from '../rendering/renderer.js';
import { createBindGroups } from '../gpu/bindGroups.js';

export class FluidSimulation {

    constructor(device, context, buffers, pipelines, vertexBuffer, texture, sampler, bloomTextures) {
        this.device = device;
        this.context = context;
        this.buffers = buffers;
        this.pipelines = pipelines;
        this.bloomTextures = bloomTextures;
        this.bindGroups = createBindGroups(device, buffers, pipelines, texture, sampler, bloomTextures);
        this.solver = new FluidSolver(device, buffers, pipelines, this.bindGroups);
        this.renderer = new FluidRenderer(device, context, buffers, pipelines, this.bindGroups, vertexBuffer, bloomTextures);
    }


    clear() {
        this.solver.clear();
    }


    run() {
        this.solver.setUniforms(0);

        if (!STATE.pause) {
            this.solver.updateDensity();
            this.solver.updateVelocity();
        }

        this.renderer.render(STATE.textureDraw);

        STATE.step++;
    }
}

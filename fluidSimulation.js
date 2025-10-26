import { CONFIG, STATE } from './config.js';
import { createShaderCode } from './shaders.js';

export function createPipelines(device, canvasFormat, vertexBufferLayout) {
    const shaders = createShaderCode(CONFIG.WORKGROUP_SIZE);
    const pipelines = {};

    // Create Texture Pipeline
    const createTextureModule = device.createShaderModule({
        label: "create texture shader",
        code: shaders.createTexture
    });

    const createTextureLayout = device.createBindGroupLayout({
        label: "Create Texture Bind Group Layout",
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: {} },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, storageTexture: { format: "rgba8unorm" } },
            { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage"} },
            { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage"} }
        ]
    });

    pipelines.createTexture = {
        layout: createTextureLayout,
        program: device.createComputePipeline({
            label: "create texture pipeline",
            layout: device.createPipelineLayout({ bindGroupLayouts: [createTextureLayout] }),
            compute: { module: createTextureModule, entryPoint: "computeMain" }
        })
    };

    // Draw Buffer Pipeline
    const drawBufferModule = device.createShaderModule({
        label: "draw buffer shader",
        code: shaders.drawBuffer
    });

    const drawBufferLayout = device.createBindGroupLayout({
        label: "Draw Buffer Bind Group Layout",
        entries: [
            { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {} },
            { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "read-only-storage"} }
        ]
    });

    pipelines.drawBuffer = {
        layout: drawBufferLayout,
        program: device.createRenderPipeline({
            label: "draw buffer pipeline",
            layout: device.createPipelineLayout({ bindGroupLayouts: [drawBufferLayout] }),
            vertex: { module: drawBufferModule, entryPoint: "vertexMain", buffers: [vertexBufferLayout] },
            fragment: { module: drawBufferModule, entryPoint: "fragmentMain", targets: [{ format: canvasFormat }] }
        })
    };

    // Draw Texture Pipeline
    const drawTextureModule = device.createShaderModule({
        label: "draw texture shader",
        code: shaders.drawTexture
    });

    const drawTextureLayout = device.createBindGroupLayout({
        label: "Draw Texture Bind Group Layout",
        entries: [
            { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {} },
            { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: {} },
            { binding: 2, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, sampler: {} }
        ]
    });

    pipelines.drawTexture = {
        layout: drawTextureLayout,
        program: device.createRenderPipeline({
            label: "draw texture pipeline",
            layout: device.createPipelineLayout({ bindGroupLayouts: [drawTextureLayout] }),
            vertex: { module: drawTextureModule, entryPoint: "vertexMain", buffers: [vertexBufferLayout] },
            fragment: { module: drawTextureModule, entryPoint: "fragmentMain", targets: [{ format: canvasFormat }] }
        })
    };

    // Add Density Pipeline
    const addDensityModule = device.createShaderModule({
        label: "add density shader",
        code: shaders.addDensity
    });

    const addDensityLayout = device.createBindGroupLayout({
        label: "Add Density Bind Group Layout",
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: {} },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage"} },
            { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage"} },
            { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: {} },
            { binding: 4, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage"} }
        ]
    });

    pipelines.addDensity = {
        layout: addDensityLayout,
        program: device.createComputePipeline({
            label: "add density pipeline",
            layout: device.createPipelineLayout({ bindGroupLayouts: [addDensityLayout] }),
            compute: { module: addDensityModule, entryPoint: "computeMain" }
        })
    };

    // Boundary Pipeline
    const boundaryModule = device.createShaderModule({
        label: "boundary shader",
        code: shaders.setBoundary
    });

    const boundaryLayout = device.createBindGroupLayout({
        label: "Boundary Bind Group Layout",
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: {} },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage"} },
            { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage"} }
        ]
    });

    pipelines.boundary = {
        layout: boundaryLayout,
        program: device.createComputePipeline({
            label: "boundary pipeline",
            layout: device.createPipelineLayout({ bindGroupLayouts: [boundaryLayout] }),
            compute: { module: boundaryModule, entryPoint: "computeMain" }
        })
    };

    // Diffuse Pipeline
    const diffuseModule = device.createShaderModule({
        label: "diffuse shader",
        code: shaders.diffuse
    });

    const diffuseLayout = device.createBindGroupLayout({
        label: "Diffuse Bind Group Layout",
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: {} },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage"} },
            { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage"} },
            { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage"} }
        ]
    });

    pipelines.diffuse = {
        layout: diffuseLayout,
        program: device.createComputePipeline({
            label: "diffuse pipeline",
            layout: device.createPipelineLayout({ bindGroupLayouts: [diffuseLayout] }),
            compute: { module: diffuseModule, entryPoint: "computeMain" }
        })
    };

    // Advect Pipeline
    const advectModule = device.createShaderModule({
        label: "advect shader",
        code: shaders.advect
    });

    const advectLayout = device.createBindGroupLayout({
        label: "Advect Bind Group Layout",
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: {} },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage"} },
            { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage"} },
            { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage"} },
            { binding: 4, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage"} }
        ]
    });

    pipelines.advect = {
        layout: advectLayout,
        program: device.createComputePipeline({
            label: "advect pipeline",
            layout: device.createPipelineLayout({ bindGroupLayouts: [advectLayout] }),
            compute: { module: advectModule, entryPoint: "computeMain" }
        })
    };

    // Project Pipelines
    const project1Module = device.createShaderModule({ label: "project1 shader", code: shaders.project1 });
    const project2Module = device.createShaderModule({ label: "project2 shader", code: shaders.project2 });
    const project3Module = device.createShaderModule({ label: "project3 shader", code: shaders.project3 });

    const projectLayout = device.createBindGroupLayout({
        label: "Project Bind Group Layout",
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: {} },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage"} },
            { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage"} }
        ]
    });

    const pipelineLayoutProject = device.createPipelineLayout({ bindGroupLayouts: [projectLayout] });

    pipelines.project1 = {
        layout: projectLayout,
        program: device.createComputePipeline({
            label: "project1 pipeline",
            layout: pipelineLayoutProject,
            compute: { module: project1Module, entryPoint: "computeMain" }
        })
    };

    pipelines.project2 = {
        layout: projectLayout,
        program: device.createComputePipeline({
            label: "project2 pipeline",
            layout: pipelineLayoutProject,
            compute: { module: project2Module, entryPoint: "computeMain" }
        })
    };

    const project3Layout = device.createBindGroupLayout({
        label: "Project3 Bind Group Layout",
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: {} },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage"} },
            { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage"} }
        ]
    });

    pipelines.project3 = {
        layout: project3Layout,
        program: device.createComputePipeline({
            label: "project3 pipeline",
            layout: device.createPipelineLayout({ bindGroupLayouts: [project3Layout] }),
            compute: { module: project3Module, entryPoint: "computeMain" }
        })
    };

    // Fade Pipeline
    const fadeModule = device.createShaderModule({
        label: "fade shader",
        code: shaders.fade
    });

    const fadeLayout = device.createBindGroupLayout({
        label: "Fade Bind Group Layout",
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: {} },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage"} }
        ]
    });

    pipelines.fade = {
        layout: fadeLayout,
        program: device.createComputePipeline({
            label: "fade pipeline",
            layout: device.createPipelineLayout({ bindGroupLayouts: [fadeLayout] }),
            compute: { module: fadeModule, entryPoint: "computeMain" }
        })
    };

    // Vorticity Pipeline - calculates curl of velocity field
    const vorticityModule = device.createShaderModule({
        label: "vorticity shader",
        code: shaders.vorticity
    });

    const vorticityLayout = device.createBindGroupLayout({
        label: "Vorticity Bind Group Layout",
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: {} },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage"} },
            { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage"} }
        ]
    });

    pipelines.vorticity = {
        layout: vorticityLayout,
        program: device.createComputePipeline({
            label: "vorticity pipeline",
            layout: device.createPipelineLayout({ bindGroupLayouts: [vorticityLayout] }),
            compute: { module: vorticityModule, entryPoint: "computeMain" }
        })
    };

    // Vorticity Confinement Pipeline - applies vorticity force
    const vorticityConfinementModule = device.createShaderModule({
        label: "vorticity confinement shader",
        code: shaders.vorticityConfinement
    });

    const vorticityConfinementLayout = device.createBindGroupLayout({
        label: "Vorticity Confinement Bind Group Layout",
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: {} },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage"} },
            { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage"} }
        ]
    });

    pipelines.vorticityConfinement = {
        layout: vorticityConfinementLayout,
        program: device.createComputePipeline({
            label: "vorticity confinement pipeline",
            layout: device.createPipelineLayout({ bindGroupLayouts: [vorticityConfinementLayout] }),
            compute: { module: vorticityConfinementModule, entryPoint: "computeMain" }
        })
    };

    // Bloom Extract Pipeline
    const bloomExtractModule = device.createShaderModule({ label: "bloom extract shader", code: shaders.bloomExtract });
    const bloomExtractLayout = device.createBindGroupLayout({
        label: "Bloom Extract Layout",
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, texture: { sampleType: "float" } },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, storageTexture: { format: "rgba16float" } },
            { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: {} }
        ]
    });
    pipelines.bloomExtract = {
        layout: bloomExtractLayout,
        program: device.createComputePipeline({
            label: "bloom extract pipeline",
            layout: device.createPipelineLayout({ bindGroupLayouts: [bloomExtractLayout] }),
            compute: { module: bloomExtractModule, entryPoint: "computeMain" }
        })
    };

    // Bloom Blur Pipelines
    const bloomBlurHModule = device.createShaderModule({ label: "bloom blur H shader", code: shaders.bloomBlurH });
    const bloomBlurVModule = device.createShaderModule({ label: "bloom blur V shader", code: shaders.bloomBlurV });
    const bloomBlurLayout = device.createBindGroupLayout({
        label: "Bloom Blur Layout",
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, texture: { sampleType: "float" } },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, storageTexture: { format: "rgba16float" } }
        ]
    });
    pipelines.bloomBlurH = {
        layout: bloomBlurLayout,
        program: device.createComputePipeline({
            label: "bloom blur H pipeline",
            layout: device.createPipelineLayout({ bindGroupLayouts: [bloomBlurLayout] }),
            compute: { module: bloomBlurHModule, entryPoint: "computeMain" }
        })
    };
    pipelines.bloomBlurV = {
        layout: bloomBlurLayout,
        program: device.createComputePipeline({
            label: "bloom blur V pipeline",
            layout: device.createPipelineLayout({ bindGroupLayouts: [bloomBlurLayout] }),
            compute: { module: bloomBlurVModule, entryPoint: "computeMain" }
        })
    };

    // Bloom Composite Pipeline
    const bloomCompositeModule = device.createShaderModule({ label: "bloom composite shader", code: shaders.bloomComposite });
    const bloomCompositeLayout = device.createBindGroupLayout({
        label: "Bloom Composite Layout",
        entries: [
            { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
            { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
            { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
            { binding: 3, visibility: GPUShaderStage.FRAGMENT, buffer: {} }
        ]
    });
    pipelines.bloomComposite = {
        layout: bloomCompositeLayout,
        program: device.createRenderPipeline({
            label: "bloom composite pipeline",
            layout: device.createPipelineLayout({ bindGroupLayouts: [bloomCompositeLayout] }),
            vertex: { module: bloomCompositeModule, entryPoint: "vertexMain", buffers: [vertexBufferLayout] },
            fragment: { module: bloomCompositeModule, entryPoint: "fragmentMain", targets: [{ format: canvasFormat }] }
        })
    };

    // Set Obstacle Pipeline
    const setObstacleModule = device.createShaderModule({
        label: "set obstacle shader",
        code: shaders.setObstacle
    });

    const setObstacleLayout = device.createBindGroupLayout({
        label: "Set Obstacle Bind Group Layout",
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: {} },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage"} },
            { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: {} }
        ]
    });

    pipelines.setObstacle = {
        layout: setObstacleLayout,
        program: device.createComputePipeline({
            label: "set obstacle pipeline",
            layout: device.createPipelineLayout({ bindGroupLayouts: [setObstacleLayout] }),
            compute: { module: setObstacleModule, entryPoint: "computeMain" }
        })
    };

    return pipelines;
}

export class FluidSimulation {
    constructor(device, context, buffers, pipelines, vertexBuffer, texture, sampler, bloomTexture1, bloomTexture2, renderTexture) {
        this.device = device;
        this.context = context;
        this.buffers = buffers;
        this.pipelines = pipelines;
        this.vertexBuffer = vertexBuffer;
        this.texture = texture;
        this.sampler = sampler;
        this.bloomTexture1 = bloomTexture1;
        this.bloomTexture2 = bloomTexture2;
        this.renderTexture = renderTexture;

	    const canvas = document.querySelector("canvas");
	    this.width = canvas.width;
	    this.height = canvas.height;
	    console.log('Simulation canvas size:', this.width, 'x', this.height);

        // Create all bind groups upfront to avoid recreating them every frame
        this.createBindGroups();
    }

    createBindGroups() {
        // Cache for bind groups that don't change
        this.bindGroups = {};

        // Add source bind groups (need 4 combinations for density/velocity buffers)
        this.bindGroups.addDensity = [
            this.device.createBindGroup({
                label: "Add density 0 bind group",
                layout: this.pipelines.addDensity.layout,
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.buffers.densityBuffers[0] } },
                    { binding: 2, resource: { buffer: this.buffers.densityBuffers[1] } },
                    { binding: 3, resource: { buffer: this.buffers.addDensityBuffer } },
                    { binding: 4, resource: { buffer: this.buffers.obstacleBuffer } }
                ]
            }),
            this.device.createBindGroup({
                label: "Add density 1 bind group",
                layout: this.pipelines.addDensity.layout,
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.buffers.densityBuffers[1] } },
                    { binding: 2, resource: { buffer: this.buffers.densityBuffers[0] } },
                    { binding: 3, resource: { buffer: this.buffers.addDensityBuffer } },
                    { binding: 4, resource: { buffer: this.buffers.obstacleBuffer } }
                ]
            })
        ];

        this.bindGroups.addVelocity = [
            this.device.createBindGroup({
                label: "Add velocity 0 bind group",
                layout: this.pipelines.addDensity.layout,
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.buffers.velocityBuffers[0] } },
                    { binding: 2, resource: { buffer: this.buffers.velocityBuffers[1] } },
                    { binding: 3, resource: { buffer: this.buffers.addVelocityBuffer } },
                    { binding: 4, resource: { buffer: this.buffers.obstacleBuffer } }
                ]
            }),
            this.device.createBindGroup({
                label: "Add velocity 1 bind group",
                layout: this.pipelines.addDensity.layout,
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.buffers.velocityBuffers[1] } },
                    { binding: 2, resource: { buffer: this.buffers.velocityBuffers[0] } },
                    { binding: 3, resource: { buffer: this.buffers.addVelocityBuffer } },
                    { binding: 4, resource: { buffer: this.buffers.obstacleBuffer } }
                ]
            })
        ];

        // Boundary bind groups
        this.bindGroups.boundary = [
            this.device.createBindGroup({
                label: "Boundary density 0",
                layout: this.pipelines.boundary.layout,
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.buffers.densityBuffers[0] } },
                    { binding: 2, resource: { buffer: this.buffers.obstacleBuffer } }
                ]
            }),
            this.device.createBindGroup({
                label: "Boundary density 1",
                layout: this.pipelines.boundary.layout,
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.buffers.densityBuffers[1] } },
                    { binding: 2, resource: { buffer: this.buffers.obstacleBuffer } }
                ]
            }),
            this.device.createBindGroup({
                label: "Boundary velocity 0",
                layout: this.pipelines.boundary.layout,
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.buffers.velocityBuffers[0] } },
                    { binding: 2, resource: { buffer: this.buffers.obstacleBuffer } }
                ]
            }),
            this.device.createBindGroup({
                label: "Boundary velocity 1",
                layout: this.pipelines.boundary.layout,
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.buffers.velocityBuffers[1] } },
                    { binding: 2, resource: { buffer: this.buffers.obstacleBuffer } }
                ]
            })
        ];

        // Diffuse bind groups (density and velocity)
        this.bindGroups.diffuseDensity = [
            this.device.createBindGroup({
                label: "Diffuse density 0",
                layout: this.pipelines.diffuse.layout,
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.buffers.densityBuffers[0] } },
                    { binding: 2, resource: { buffer: this.buffers.densityBuffers[1] } },
                    { binding: 3, resource: { buffer: this.buffers.obstacleBuffer } }
                ]
            }),
            this.device.createBindGroup({
                label: "Diffuse density 1",
                layout: this.pipelines.diffuse.layout,
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.buffers.densityBuffers[1] } },
                    { binding: 2, resource: { buffer: this.buffers.densityBuffers[0] } },
                    { binding: 3, resource: { buffer: this.buffers.obstacleBuffer } }
                ]
            })
        ];

        this.bindGroups.diffuseVelocity = [
            this.device.createBindGroup({
                label: "Diffuse velocity 0",
                layout: this.pipelines.diffuse.layout,
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.buffers.velocityBuffers[0] } },
                    { binding: 2, resource: { buffer: this.buffers.velocityBuffers[1] } },
                    { binding: 3, resource: { buffer: this.buffers.obstacleBuffer } }
                ]
            }),
            this.device.createBindGroup({
                label: "Diffuse velocity 1",
                layout: this.pipelines.diffuse.layout,
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.buffers.velocityBuffers[1] } },
                    { binding: 2, resource: { buffer: this.buffers.velocityBuffers[0] } },
                    { binding: 3, resource: { buffer: this.buffers.obstacleBuffer } }
                ]
            })
        ];

        // Advect bind groups
        this.bindGroups.advectDensity = [
            this.device.createBindGroup({
                label: "Advect density 0→0",
                layout: this.pipelines.advect.layout,
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.buffers.densityBuffers[0] } },
                    { binding: 2, resource: { buffer: this.buffers.densityBuffers[1] } },
                    { binding: 3, resource: { buffer: this.buffers.velocityBuffers[0] } },
                    { binding: 4, resource: { buffer: this.buffers.obstacleBuffer } }
                ]
            }),
            this.device.createBindGroup({
                label: "Advect density 1→0",
                layout: this.pipelines.advect.layout,
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.buffers.densityBuffers[0] } },
                    { binding: 2, resource: { buffer: this.buffers.densityBuffers[1] } },
                    { binding: 3, resource: { buffer: this.buffers.velocityBuffers[1] } },
                    { binding: 4, resource: { buffer: this.buffers.obstacleBuffer } }
                ]
            }),
            this.device.createBindGroup({
                label: "Advect density 0→1",
                layout: this.pipelines.advect.layout,
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.buffers.densityBuffers[1] } },
                    { binding: 2, resource: { buffer: this.buffers.densityBuffers[0] } },
                    { binding: 3, resource: { buffer: this.buffers.velocityBuffers[0] } },
                    { binding: 4, resource: { buffer: this.buffers.obstacleBuffer } }
                ]
            }),
            this.device.createBindGroup({
                label: "Advect density 1→1",
                layout: this.pipelines.advect.layout,
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.buffers.densityBuffers[1] } },
                    { binding: 2, resource: { buffer: this.buffers.densityBuffers[0] } },
                    { binding: 3, resource: { buffer: this.buffers.velocityBuffers[1] } },
                    { binding: 4, resource: { buffer: this.buffers.obstacleBuffer } }
                ]
            })
        ];

        this.bindGroups.advectVelocity = [
            this.device.createBindGroup({
                label: "Advect velocity 0",
                layout: this.pipelines.advect.layout,
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.buffers.velocityBuffers[0] } },
                    { binding: 2, resource: { buffer: this.buffers.velocityBuffers[1] } },
                    { binding: 3, resource: { buffer: this.buffers.velocityBuffers[1] } },
                    { binding: 4, resource: { buffer: this.buffers.obstacleBuffer } }
                ]
            }),
            this.device.createBindGroup({
                label: "Advect velocity 1",
                layout: this.pipelines.advect.layout,
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.buffers.velocityBuffers[1] } },
                    { binding: 2, resource: { buffer: this.buffers.velocityBuffers[0] } },
                    { binding: 3, resource: { buffer: this.buffers.velocityBuffers[0] } },
                    { binding: 4, resource: { buffer: this.buffers.obstacleBuffer } }
                ]
            })
        ];

        // Project bind groups
        this.bindGroups.project1 = [
            this.device.createBindGroup({
                label: "Project1 0",
                layout: this.pipelines.project1.layout,
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.buffers.velocityBuffers[0] } },
                    { binding: 2, resource: { buffer: this.buffers.velocityBuffers[1] } }
                ]
            }),
            this.device.createBindGroup({
                label: "Project1 1",
                layout: this.pipelines.project1.layout,
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.buffers.velocityBuffers[1] } },
                    { binding: 2, resource: { buffer: this.buffers.velocityBuffers[0] } }
                ]
            })
        ];

        this.bindGroups.project2 = [
            this.device.createBindGroup({
                label: "Project2 0",
                layout: this.pipelines.project2.layout,
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.buffers.velocityBuffers[0] } },
                    { binding: 2, resource: { buffer: this.buffers.velocityBuffers[1] } }
                ]
            }),
            this.device.createBindGroup({
                label: "Project2 1",
                layout: this.pipelines.project2.layout,
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.buffers.velocityBuffers[1] } },
                    { binding: 2, resource: { buffer: this.buffers.velocityBuffers[0] } }
                ]
            })
        ];

        this.bindGroups.project3 = [
            this.device.createBindGroup({
                label: "Project3 0",
                layout: this.pipelines.project3.layout,
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.buffers.velocityBuffers[0] } },
                    { binding: 2, resource: { buffer: this.buffers.velocityBuffers[1] } }
                ]
            }),
            this.device.createBindGroup({
                label: "Project3 1",
                layout: this.pipelines.project3.layout,
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.buffers.velocityBuffers[1] } },
                    { binding: 2, resource: { buffer: this.buffers.velocityBuffers[0] } }
                ]
            })
        ];

        // Fade bind groups
        this.bindGroups.fade = [
            this.device.createBindGroup({
                label: "Fade density 0",
                layout: this.pipelines.fade.layout,
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.buffers.densityBuffers[0] } }
                ]
            }),
            this.device.createBindGroup({
                label: "Fade density 1",
                layout: this.pipelines.fade.layout,
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.buffers.densityBuffers[1] } }
                ]
            })
        ];

        // Vorticity bind groups
        this.bindGroups.vorticity = [
            this.device.createBindGroup({
                label: "Vorticity 0",
                layout: this.pipelines.vorticity.layout,
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.buffers.velocityBuffers[0] } },
                    { binding: 2, resource: { buffer: this.buffers.curlBuffer } }
                ]
            }),
            this.device.createBindGroup({
                label: "Vorticity 1",
                layout: this.pipelines.vorticity.layout,
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.buffers.velocityBuffers[1] } },
                    { binding: 2, resource: { buffer: this.buffers.curlBuffer } }
                ]
            })
        ];

        this.bindGroups.vorticityConfinement = [
            this.device.createBindGroup({
                label: "Vorticity confinement 0",
                layout: this.pipelines.vorticityConfinement.layout,
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.buffers.velocityBuffers[0] } },
                    { binding: 2, resource: { buffer: this.buffers.curlBuffer } }
                ]
            }),
            this.device.createBindGroup({
                label: "Vorticity confinement 1",
                layout: this.pipelines.vorticityConfinement.layout,
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.buffers.velocityBuffers[1] } },
                    { binding: 2, resource: { buffer: this.buffers.curlBuffer } }
                ]
            })
        ];

        // Texture creation bind groups
        this.bindGroups.createTexture = [
            this.device.createBindGroup({
                label: "Create texture density 0",
                layout: this.pipelines.createTexture.layout,
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                    { binding: 1, resource: this.texture.createView() },
                    { binding: 2, resource: { buffer: this.buffers.densityBuffers[0] } },
                    { binding: 3, resource: { buffer: this.buffers.obstacleBuffer } }
                ]
            }),
            this.device.createBindGroup({
                label: "Create texture density 1",
                layout: this.pipelines.createTexture.layout,
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                    { binding: 1, resource: this.texture.createView() },
                    { binding: 2, resource: { buffer: this.buffers.densityBuffers[1] } },
                    { binding: 3, resource: { buffer: this.buffers.obstacleBuffer } }
                ]
            }),
            this.device.createBindGroup({
                label: "Create texture velocity 0",
                layout: this.pipelines.createTexture.layout,
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                    { binding: 1, resource: this.texture.createView() },
                    { binding: 2, resource: { buffer: this.buffers.velocityBuffers[0] } },
                    { binding: 3, resource: { buffer: this.buffers.obstacleBuffer } }
                ]
            }),
            this.device.createBindGroup({
                label: "Create texture velocity 1",
                layout: this.pipelines.createTexture.layout,
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                    { binding: 1, resource: this.texture.createView() },
                    { binding: 2, resource: { buffer: this.buffers.velocityBuffers[1] } },
                    { binding: 3, resource: { buffer: this.buffers.obstacleBuffer } }
                ]
            })
        ];

        // Draw texture bind group (static)
        this.bindGroups.drawTexture = this.device.createBindGroup({
            label: "Draw texture",
            layout: this.pipelines.drawTexture.layout,
            entries: [
                { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                { binding: 1, resource: this.texture.createView() },
                { binding: 2, resource: this.sampler }
            ]
        });

        // Draw buffer bind groups
        this.bindGroups.drawBuffer = [
            this.device.createBindGroup({
                label: "Draw buffer density 0",
                layout: this.pipelines.drawBuffer.layout,
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.buffers.densityBuffers[0] } }
                ]
            }),
            this.device.createBindGroup({
                label: "Draw buffer density 1",
                layout: this.pipelines.drawBuffer.layout,
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.buffers.densityBuffers[1] } }
                ]
            }),
            this.device.createBindGroup({
                label: "Draw buffer velocity 0",
                layout: this.pipelines.drawBuffer.layout,
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.buffers.velocityBuffers[0] } }
                ]
            }),
            this.device.createBindGroup({
                label: "Draw buffer velocity 1",
                layout: this.pipelines.drawBuffer.layout,
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.buffers.velocityBuffers[1] } }
                ]
            })
        ];

        // Bloom bind groups (static)
        this.bindGroups.bloomExtract = this.device.createBindGroup({
            label: "Bloom extract",
            layout: this.pipelines.bloomExtract.layout,
            entries: [
                { binding: 0, resource: this.texture.createView() },
                { binding: 1, resource: this.bloomTexture1.createView() },
                { binding: 2, resource: { buffer: this.buffers.bloomParamsBuffer } }
            ]
        });

        this.bindGroups.bloomBlurH = this.device.createBindGroup({
            label: "Bloom blur H",
            layout: this.pipelines.bloomBlurH.layout,
            entries: [
                { binding: 0, resource: this.bloomTexture1.createView() },
                { binding: 1, resource: this.bloomTexture2.createView() }
            ]
        });

        this.bindGroups.bloomBlurV = this.device.createBindGroup({
            label: "Bloom blur V",
            layout: this.pipelines.bloomBlurV.layout,
            entries: [
                { binding: 0, resource: this.bloomTexture2.createView() },
                { binding: 1, resource: this.bloomTexture1.createView() }
            ]
        });

        this.bindGroups.bloomComposite = this.device.createBindGroup({
            label: "Bloom composite",
            layout: this.pipelines.bloomComposite.layout,
            entries: [
                { binding: 0, resource: this.texture.createView() },
                { binding: 1, resource: this.bloomTexture1.createView() },
                { binding: 2, resource: this.sampler },
                { binding: 3, resource: { buffer: this.buffers.bloomParamsBuffer } }
            ]
        });

        // Set Obstacle bind group
        this.bindGroups.setObstacle = this.device.createBindGroup({
            label: "Set obstacle",
            layout: this.pipelines.setObstacle.layout,
            entries: [
                { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                { binding: 1, resource: { buffer: this.buffers.obstacleBuffer } },
                { binding: 2, resource: { buffer: this.buffers.obstacleSourceBuffer } }
            ]
        });

        console.log('Bind groups created and cached');
    }

    setUniforms(b) {
        // Mouse position is in canvas pixels, convert to grid coordinates
        // Grid coordinates go from 1 to N+1 (with 0 and N+1 being boundaries)
        const mouseX = (STATE.mousePosition.x / this.width) * CONFIG.N + 1;
        const mouseY = ((this.height - STATE.mousePosition.y) / this.height) * CONFIG.N + 1;
        const dt = CONFIG.UPDATE_INTERVAL / 1000;

        const uniformArray = new Float32Array([
            mouseX, mouseY,
            CONFIG.GRID_SIZE, CONFIG.GRID_SIZE,
            STATE.diffuseState, 0,
            CONFIG.N, dt,
            b, CONFIG.getPaletteIndex()
        ]);

        this.device.queue.writeBuffer(this.buffers.uniformBuffer, 0, uniformArray);
    }

    addSource(outputBuffer, inputBuffer, sourceBuffer) {
        // Determine which cached bind group to use based on buffer type
        let bindGroup;
        if (sourceBuffer === this.buffers.addDensityBuffer) {
            // Density source - check which buffer is output
            bindGroup = (outputBuffer === this.buffers.densityBuffers[0]) ?
                this.bindGroups.addDensity[0] : this.bindGroups.addDensity[1];
        } else {
            // Velocity source
            bindGroup = (outputBuffer === this.buffers.velocityBuffers[0]) ?
                this.bindGroups.addVelocity[0] : this.bindGroups.addVelocity[1];
        }

        const encoder = this.device.createCommandEncoder();
        const computePass = encoder.beginComputePass();
        computePass.setPipeline(this.pipelines.addDensity.program);
        computePass.setBindGroup(0, bindGroup);
        const workgroupCount = Math.ceil(CONFIG.N / CONFIG.WORKGROUP_SIZE);
        computePass.dispatchWorkgroups(workgroupCount, workgroupCount);
        computePass.end();

        this.device.queue.submit([encoder.finish()]);
    }

    setBoundary(encoder, b, buffer) {
        this.setUniforms(b);

        // Determine which cached bind group to use
        let bindGroupIndex;
        if (buffer === this.buffers.densityBuffers[0]) bindGroupIndex = 0;
        else if (buffer === this.buffers.densityBuffers[1]) bindGroupIndex = 1;
        else if (buffer === this.buffers.velocityBuffers[0]) bindGroupIndex = 2;
        else bindGroupIndex = 3; // velocityBuffers[1]

        const computePass = encoder.beginComputePass();
        computePass.setPipeline(this.pipelines.boundary.program);
        computePass.setBindGroup(0, this.bindGroups.boundary[bindGroupIndex]);
        const workgroupCount = Math.ceil(CONFIG.GRID_SIZE / CONFIG.WORKGROUP_SIZE);
        computePass.dispatchWorkgroups(workgroupCount, workgroupCount);
        computePass.end();
    }

    diffuse(b, outputBuffer, inputBuffer, diffusion) {
        // Use adaptive iteration count based on performance
        const iterations = Math.max(2, Math.floor(STATE.currentSolverIterations * Math.sqrt(64 / CONFIG.N)));

        // Determine which cached bind group to use
        let bindGroup;
        if (outputBuffer === this.buffers.densityBuffers[0]) {
            bindGroup = this.bindGroups.diffuseDensity[0];
        } else if (outputBuffer === this.buffers.densityBuffers[1]) {
            bindGroup = this.bindGroups.diffuseDensity[1];
        } else if (outputBuffer === this.buffers.velocityBuffers[0]) {
            bindGroup = this.bindGroups.diffuseVelocity[0];
        } else {
            bindGroup = this.bindGroups.diffuseVelocity[1];
        }

        const encoder = this.device.createCommandEncoder();
        const workgroupCount = Math.ceil(CONFIG.N / CONFIG.WORKGROUP_SIZE);

        for (let i = 0; i < iterations; i++) {
            const computePass = encoder.beginComputePass();
            computePass.setPipeline(this.pipelines.diffuse.program);
            computePass.setBindGroup(0, bindGroup);
            computePass.dispatchWorkgroups(workgroupCount, workgroupCount);
            computePass.end();

            this.setBoundary(encoder, b, outputBuffer);
        }

        this.device.queue.submit([encoder.finish()]);
    }

    advect(b, outputBuffer, inputBuffer, velocityBuffer) {
        // Determine which cached bind group to use
        let bindGroup;

        // Check if we're advecting density or velocity
        if (outputBuffer === this.buffers.densityBuffers[0] || outputBuffer === this.buffers.densityBuffers[1]) {
            // Advecting density - need to check output buffer and velocity buffer
            const outputIdx = (outputBuffer === this.buffers.densityBuffers[0]) ? 0 : 1;
            const velIdx = (velocityBuffer === this.buffers.velocityBuffers[0]) ? 0 : 1;
            bindGroup = this.bindGroups.advectDensity[outputIdx * 2 + velIdx];
        } else {
            // Advecting velocity - simpler case, velocity uses same velocity buffer
            bindGroup = (outputBuffer === this.buffers.velocityBuffers[0]) ?
                this.bindGroups.advectVelocity[0] : this.bindGroups.advectVelocity[1];
        }

        const encoder = this.device.createCommandEncoder();
        const computePass = encoder.beginComputePass();
        computePass.setPipeline(this.pipelines.advect.program);
        computePass.setBindGroup(0, bindGroup);
        const workgroupCount = Math.ceil(CONFIG.N / CONFIG.WORKGROUP_SIZE);
        computePass.dispatchWorkgroups(workgroupCount, workgroupCount);
        computePass.end();

        this.setBoundary(encoder, b, outputBuffer);
        this.device.queue.submit([encoder.finish()]);
    }

    project(velocityBuffer, pressureBuffer) {
        // Use adaptive iteration count based on performance
        const iterations = Math.max(2, Math.floor(STATE.currentSolverIterations * Math.sqrt(64 / CONFIG.N)));
        const workgroupCount = Math.ceil(CONFIG.N / CONFIG.WORKGROUP_SIZE);

        // Determine which cached bind groups to use
        const bufferIndex = (velocityBuffer === this.buffers.velocityBuffers[0]) ? 0 : 1;

        // Batch all operations into a single encoder for better performance
        const encoder = this.device.createCommandEncoder();

        // Step 1: Calculate divergence
        let computePass = encoder.beginComputePass();
        computePass.setPipeline(this.pipelines.project1.program);
        computePass.setBindGroup(0, this.bindGroups.project1[bufferIndex]);
        computePass.dispatchWorkgroups(workgroupCount, workgroupCount);
        computePass.end();
        this.setBoundary(encoder, 0, pressureBuffer);

        // Step 2: Solve for pressure
        for (let i = 0; i < iterations; i++) {
            computePass = encoder.beginComputePass();
            computePass.setPipeline(this.pipelines.project2.program);
            computePass.setBindGroup(0, this.bindGroups.project2[bufferIndex]);
            computePass.dispatchWorkgroups(workgroupCount, workgroupCount);
            computePass.end();
            this.setBoundary(encoder, 0, pressureBuffer);
        }

        // Step 3: Subtract pressure gradient
        computePass = encoder.beginComputePass();
        computePass.setPipeline(this.pipelines.project3.program);
        computePass.setBindGroup(0, this.bindGroups.project3[bufferIndex]);
        computePass.dispatchWorkgroups(workgroupCount, workgroupCount);
        computePass.end();
        this.setBoundary(encoder, 1, velocityBuffer);

        // Submit all operations at once
        this.device.queue.submit([encoder.finish()]);
    }

    updateVelocity() {
        STATE.diffuseState = CONFIG.VISCOSITY;
        const velocityBuffers = this.buffers.velocityBuffers;

        STATE.velocityStep = (STATE.velocityStep + 1) % 2;

        const dx = STATE.mousePosition.x - STATE.mousePosition.x0;
        const dy = -1 * (STATE.mousePosition.y - STATE.mousePosition.y0);

        const addSourceArr = new Float32Array([
            dx, dy, 0, 0,
            CONFIG.VELOCITY_RADIUS, 0, 0, 0
        ]);

        this.device.queue.writeBuffer(this.buffers.addVelocityBuffer, 0, addSourceArr);

        // Always add source (even if dx=0 and dy=0)
        this.addSource(
            velocityBuffers[STATE.velocityStep % 2],
            velocityBuffers[(STATE.velocityStep + 1) % 2],
            this.buffers.addVelocityBuffer
        );
        STATE.velocityStep = (STATE.velocityStep + 1) % 2;

        // Always diffuse - the solver will be fast when viscosity is 0
        this.diffuse(1, velocityBuffers[STATE.velocityStep % 2],
                     velocityBuffers[(STATE.velocityStep + 1) % 2], CONFIG.VISCOSITY);
        STATE.velocityStep = (STATE.velocityStep + 1) % 2;

        this.project(velocityBuffers[STATE.velocityStep % 2],
                     velocityBuffers[(STATE.velocityStep + 1) % 2]);
        STATE.velocityStep = (STATE.velocityStep + 1) % 2;

        this.advect(1, velocityBuffers[STATE.velocityStep % 2],
                    velocityBuffers[(STATE.velocityStep + 1) % 2],
                    velocityBuffers[(STATE.velocityStep + 1) % 2]);

        this.project(velocityBuffers[STATE.velocityStep % 2],
                     velocityBuffers[(STATE.velocityStep + 1) % 2]);

        // Apply vorticity confinement to add swirling motion
        this.applyVorticityConfinement(velocityBuffers[STATE.velocityStep % 2]);
    }

    fade(buffer) {
        // Apply fade effect by multiplying density by fade factor
        // We need to set the fade factor in the diffuse uniform temporarily
        const uniformArray = new Float32Array([
            0, 0,  // mouse (not used)
            CONFIG.GRID_SIZE, CONFIG.GRID_SIZE,
            CONFIG.FADE, 0,  // Use fade value in diffuse slot
            CONFIG.N, 0,  // dt not used
            0, CONFIG.getPaletteIndex()  // b, palette
        ]);
        this.device.queue.writeBuffer(this.buffers.uniformBuffer, 0, uniformArray);

        // Determine which cached bind group to use
        const bindGroupIndex = (buffer === this.buffers.densityBuffers[0]) ? 0 : 1;

        const encoder = this.device.createCommandEncoder();
        const computePass = encoder.beginComputePass();
        computePass.setPipeline(this.pipelines.fade.program);
        computePass.setBindGroup(0, this.bindGroups.fade[bindGroupIndex]);
        const workgroupCount = Math.ceil(CONFIG.GRID_SIZE / CONFIG.WORKGROUP_SIZE);
        computePass.dispatchWorkgroups(workgroupCount, workgroupCount);
        computePass.end();

        this.device.queue.submit([encoder.finish()]);
    }

    applyVorticityConfinement(velocityBuffer) {
        if (!CONFIG.ENABLE_VORTICITY || CONFIG.VORTICITY === 0) return;

        const workgroupCount = Math.ceil(CONFIG.N / CONFIG.WORKGROUP_SIZE);

        // Set uniforms for vorticity (we'll pass VORTICITY strength via diffuse slot)
        const uniformArray = new Float32Array([
            0, 0,  // mouse (not used)
            CONFIG.GRID_SIZE, CONFIG.GRID_SIZE,
            CONFIG.VORTICITY, 0,  // vorticity strength in diffuse slot
            CONFIG.N, CONFIG.UPDATE_INTERVAL / 1000,  // N and dt
            0, CONFIG.getPaletteIndex()  // b, palette
        ]);
        this.device.queue.writeBuffer(this.buffers.uniformBuffer, 0, uniformArray);

        // Determine which cached bind groups to use
        const bufferIndex = (velocityBuffer === this.buffers.velocityBuffers[0]) ? 0 : 1;

        const encoder = this.device.createCommandEncoder();

        // Step 1: Calculate vorticity (curl of velocity field)
        let computePass = encoder.beginComputePass();
        computePass.setPipeline(this.pipelines.vorticity.program);
        computePass.setBindGroup(0, this.bindGroups.vorticity[bufferIndex]);
        computePass.dispatchWorkgroups(workgroupCount, workgroupCount);
        computePass.end();

        // Step 2: Apply vorticity confinement force
        computePass = encoder.beginComputePass();
        computePass.setPipeline(this.pipelines.vorticityConfinement.program);
        computePass.setBindGroup(0, this.bindGroups.vorticityConfinement[bufferIndex]);
        computePass.dispatchWorkgroups(workgroupCount, workgroupCount);
        computePass.end();

        this.device.queue.submit([encoder.finish()]);
    }

    updateDensity() {
        STATE.diffuseState = CONFIG.DIFFUSE;
        const densityBuffers = this.buffers.densityBuffers;
        const velocityBuffers = this.buffers.velocityBuffers;

        STATE.densityStep = (STATE.densityStep + 1) % 2;

        const dx = STATE.mousePosition.x - STATE.mousePosition.x0;
        const dy = -1 * (STATE.mousePosition.y - STATE.mousePosition.y0);

        // Calculate mouse velocity for color modulation
        const mouseVelocity = Math.sqrt(dx * dx + dy * dy);

        // Generate rainbow colors that cycle through the spectrum
        // Base cycling with optional velocity boost
        const baseHue = (STATE.step * 2) % 360; // Slow base rotation through rainbow
        const velocityBoost = mouseVelocity * 5; // Fast movement adds to hue
        const hue = (baseHue + velocityBoost) % 360;

        // Convert HSV to RGB (H=hue, S=1.0 for vibrant, V=1.0 for bright)
        // Using standard HSV to RGB algorithm
        const h = hue / 60;
        const c = 1.0; // Chroma
        const x = 1.0 - Math.abs((h % 2) - 1);

        let r1, g1, b1;
        if (h >= 0 && h < 1) { r1 = 1; g1 = x; b1 = 0; }
        else if (h >= 1 && h < 2) { r1 = x; g1 = 1; b1 = 0; }
        else if (h >= 2 && h < 3) { r1 = 0; g1 = 1; b1 = x; }
        else if (h >= 3 && h < 4) { r1 = 0; g1 = x; b1 = 1; }
        else if (h >= 4 && h < 5) { r1 = x; g1 = 0; b1 = 1; }
        else { r1 = 1; g1 = 0; b1 = x; }

        // Scale down the color intensity to avoid adding too much
        const intensity = 0.3; // Reduce from 1.0 to make it more subtle
        const r = r1 * intensity;
        const g = g1 * intensity;
        const b = b1 * intensity;

        const addSourceArr = new Float32Array([
            r, g, b, 1,
            CONFIG.COLOR_RADIUS, 0, 0, 0
        ]);

        // Only add density if not in velocity-only mode
        if (!STATE.velocityOnlyMode && (dx !== 0 || dy !== 0)) {
            this.device.queue.writeBuffer(this.buffers.addDensityBuffer, 0, addSourceArr);
            this.addSource(
                densityBuffers[STATE.densityStep % 2],
                densityBuffers[(STATE.densityStep + 1) % 2],
                this.buffers.addDensityBuffer
            );
            STATE.densityStep = (STATE.densityStep + 1) % 2;
        }

        // Apply fade effect
        if (CONFIG.ENABLE_FADE && CONFIG.FADE < 1.0) {
            this.fade(densityBuffers[STATE.densityStep % 2]);
        }

        // Always diffuse - the solver will be fast when diffusion is 0
        this.diffuse(0, densityBuffers[STATE.densityStep % 2],
                     densityBuffers[(STATE.densityStep + 1) % 2], CONFIG.DIFFUSE);
        STATE.densityStep = (STATE.densityStep + 1) % 2;

        this.advect(0, densityBuffers[STATE.densityStep % 2],
                    densityBuffers[(STATE.densityStep + 1) % 2],
                    velocityBuffers[STATE.velocityStep % 2]);
    }

	createTextureFromBuffer(buffer) {
        // Determine which cached bind group to use
        let bindGroupIndex;
        if (buffer === this.buffers.densityBuffers[0]) bindGroupIndex = 0;
        else if (buffer === this.buffers.densityBuffers[1]) bindGroupIndex = 1;
        else if (buffer === this.buffers.velocityBuffers[0]) bindGroupIndex = 2;
        else bindGroupIndex = 3; // velocityBuffers[1]

        const encoder = this.device.createCommandEncoder();
        const computePass = encoder.beginComputePass();
        computePass.setPipeline(this.pipelines.createTexture.program);
        computePass.setBindGroup(0, this.bindGroups.createTexture[bindGroupIndex]);

        const canvas = document.querySelector("canvas");
        const workgroupCountX = Math.ceil(canvas.width / CONFIG.WORKGROUP_SIZE);
        const workgroupCountY = Math.ceil(canvas.height / CONFIG.WORKGROUP_SIZE);

        computePass.dispatchWorkgroups(workgroupCountX, workgroupCountY);
        computePass.end();

        this.device.queue.submit([encoder.finish()]);
    }
    drawTexture() {
        const encoder = this.device.createCommandEncoder();
        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                view: this.context.getCurrentTexture().createView(),
                clearValue: { r: 0, g: 0, b: 0, a: 1 },
                loadOp: "clear",
                storeOp: "store",
            }]
        });

        pass.setPipeline(this.pipelines.drawTexture.program);
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.setBindGroup(0, this.bindGroups.drawTexture);
        pass.draw(6, 1);
        pass.end();

        this.device.queue.submit([encoder.finish()]);
    }

    drawBuffer(buffer) {
        // Determine which cached bind group to use
        let bindGroupIndex;
        if (buffer === this.buffers.densityBuffers[0]) bindGroupIndex = 0;
        else if (buffer === this.buffers.densityBuffers[1]) bindGroupIndex = 1;
        else if (buffer === this.buffers.velocityBuffers[0]) bindGroupIndex = 2;
        else bindGroupIndex = 3; // velocityBuffers[1]

        const encoder = this.device.createCommandEncoder();
        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                view: this.context.getCurrentTexture().createView(),
                clearValue: { r: 0, g: 0, b: 0, a: 1 },
                loadOp: "clear",
                storeOp: "store",
            }]
        });

        pass.setPipeline(this.pipelines.drawBuffer.program);
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.setBindGroup(0, this.bindGroups.drawBuffer[bindGroupIndex]);
        pass.draw(6, 1);
        pass.end();

        this.device.queue.submit([encoder.finish()]);
    }

    getDrawBuffer() {
        if (STATE.drawState === CONFIG.DRAW_DENSITY) {
            return this.buffers.densityBuffers[STATE.densityStep % 2];
        }
        if (STATE.drawState === CONFIG.DRAW_VELOCITY) {
            return this.buffers.velocityBuffers[STATE.velocityStep % 2];
        }
    }

    clear() {
        // Reset all buffers to zero
        const stateArray = new Float32Array(4 * CONFIG.GRID_SIZE * CONFIG.GRID_SIZE);

        this.device.queue.writeBuffer(this.buffers.densityBuffers[0], 0, stateArray);
        this.device.queue.writeBuffer(this.buffers.densityBuffers[1], 0, stateArray);
        this.device.queue.writeBuffer(this.buffers.velocityBuffers[0], 0, stateArray);
        this.device.queue.writeBuffer(this.buffers.velocityBuffers[1], 0, stateArray);

        // Reset step counters
        STATE.densityStep = 0;
        STATE.velocityStep = 0;
        STATE.step = 0;
    }

    applyBloom() {
        if (!CONFIG.ENABLE_BLOOM || CONFIG.BLOOM_INTENSITY === 0) {
            // No bloom, just draw the texture directly
            this.drawTexture();
            return;
        }

        // Update bloom parameters uniform
        const bloomParams = new Float32Array([
            CONFIG.BLOOM_THRESHOLD,
            CONFIG.BLOOM_INTENSITY,
            0, 0  // padding
        ]);
        this.device.queue.writeBuffer(this.buffers.bloomParamsBuffer, 0, bloomParams);

        const encoder = this.device.createCommandEncoder();
        const workgroupCountX = Math.ceil(this.width / 8);
        const workgroupCountY = Math.ceil(this.height / 8);

        // Step 1: Extract bright pixels
        let computePass = encoder.beginComputePass();
        computePass.setPipeline(this.pipelines.bloomExtract.program);
        computePass.setBindGroup(0, this.bindGroups.bloomExtract);
        computePass.dispatchWorkgroups(workgroupCountX, workgroupCountY);
        computePass.end();

        // Step 2: Blur horizontally (bloomTexture1 -> bloomTexture2)
        computePass = encoder.beginComputePass();
        computePass.setPipeline(this.pipelines.bloomBlurH.program);
        computePass.setBindGroup(0, this.bindGroups.bloomBlurH);
        computePass.dispatchWorkgroups(workgroupCountX, workgroupCountY);
        computePass.end();

        // Step 3: Blur vertically (bloomTexture2 -> bloomTexture1)
        computePass = encoder.beginComputePass();
        computePass.setPipeline(this.pipelines.bloomBlurV.program);
        computePass.setBindGroup(0, this.bindGroups.bloomBlurV);
        computePass.dispatchWorkgroups(workgroupCountX, workgroupCountY);
        computePass.end();

        this.device.queue.submit([encoder.finish()]);

        // Step 4: Composite bloom with original
        const compositeEncoder = this.device.createCommandEncoder();
        const pass = compositeEncoder.beginRenderPass({
            colorAttachments: [{
                view: this.context.getCurrentTexture().createView(),
                clearValue: { r: 0, g: 0, b: 0, a: 1 },
                loadOp: "clear",
                storeOp: "store",
            }]
        });

        pass.setPipeline(this.pipelines.bloomComposite.program);
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.setBindGroup(0, this.bindGroups.bloomComposite);
        pass.draw(6, 1);
        pass.end();

        this.device.queue.submit([compositeEncoder.finish()]);
    }

    setObstacle(value) {
        // value: 1.0 to place obstacle, 0.0 to remove

        // Update uniforms to get current mouse position
        this.setUniforms(0);

        const obstacleSourceArr = new Float32Array([
            value,
            STATE.obstacleRadius,
            0, 0  // padding
        ]);
        this.device.queue.writeBuffer(this.buffers.obstacleSourceBuffer, 0, obstacleSourceArr);

        const encoder = this.device.createCommandEncoder();
        const computePass = encoder.beginComputePass();
        computePass.setPipeline(this.pipelines.setObstacle.program);
        computePass.setBindGroup(0, this.bindGroups.setObstacle);
        const workgroupCount = Math.ceil(CONFIG.N / CONFIG.WORKGROUP_SIZE);
        computePass.dispatchWorkgroups(workgroupCount, workgroupCount);
        computePass.end();

        this.device.queue.submit([encoder.finish()]);
    }

    clearObstacles() {
        // Reset obstacle buffer to zero (all fluid cells)
        const stateArray = new Float32Array(4 * CONFIG.GRID_SIZE * CONFIG.GRID_SIZE);
        this.device.queue.writeBuffer(this.buffers.obstacleBuffer, 0, stateArray);
        console.log('All obstacles cleared');
    }

    run() {
        this.setUniforms(0);

        if (!STATE.pause) {
            this.updateDensity();
            this.updateVelocity();
        }

        const buffer = this.getDrawBuffer();

        if (STATE.textureDraw) {
            this.createTextureFromBuffer(buffer);
            this.applyBloom();
        } else {
            this.drawBuffer(buffer);
        }

        STATE.step++;

        // Update FPS counter
        if (CONFIG.SHOW_FPS) {
            STATE.frameCount++;
            const currentTime = performance.now();
            const elapsed = currentTime - STATE.lastFpsTime;

            // Update FPS display every 500ms
            if (elapsed >= 500) {
                STATE.currentFps = Math.round((STATE.frameCount * 1000) / elapsed);
                STATE.frameCount = 0;
                STATE.lastFpsTime = currentTime;

                // Update FPS display element
                const fpsCounter = document.getElementById('fpsCounter');
                if (fpsCounter) {
                    fpsCounter.textContent = `FPS: ${STATE.currentFps} (iter: ${STATE.currentSolverIterations})`;
                }

                // Adaptive performance: adjust solver iterations based on FPS
                if (CONFIG.ENABLE_ADAPTIVE_PERFORMANCE) {
                    const timeSinceLastAdjustment = currentTime - STATE.lastAdjustmentTime;

                    // Only adjust every 2 seconds to avoid oscillation
                    if (timeSinceLastAdjustment >= STATE.adjustmentCooldown) {
                        // Track FPS history for smoother adjustments
                        STATE.fpsHistory.push(STATE.currentFps);
                        if (STATE.fpsHistory.length > CONFIG.FPS_SAMPLE_SIZE) {
                            STATE.fpsHistory.shift();
                        }

                        // Calculate average FPS over sample period
                        const avgFps = STATE.fpsHistory.reduce((a, b) => a + b, 0) / STATE.fpsHistory.length;

                        // Adjust iterations based on FPS
                        if (avgFps < CONFIG.TARGET_FPS - 5 && STATE.currentSolverIterations > 2) {
                            // FPS too low, reduce quality
                            STATE.currentSolverIterations = Math.max(2, STATE.currentSolverIterations - 1);
                            console.log(`Adaptive: Reducing iterations to ${STATE.currentSolverIterations} (FPS: ${avgFps.toFixed(1)})`);
                            STATE.lastAdjustmentTime = currentTime;
                        } else if (avgFps > CONFIG.TARGET_FPS + 10 && STATE.currentSolverIterations < CONFIG.SOLVER_ITERATIONS) {
                            // FPS comfortably above target, can increase quality
                            STATE.currentSolverIterations = Math.min(CONFIG.SOLVER_ITERATIONS, STATE.currentSolverIterations + 1);
                            console.log(`Adaptive: Increasing iterations to ${STATE.currentSolverIterations} (FPS: ${avgFps.toFixed(1)})`);
                            STATE.lastAdjustmentTime = currentTime;
                        }
                    }
                }
            }
        }
    }
}

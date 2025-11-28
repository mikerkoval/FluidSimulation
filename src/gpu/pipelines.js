import { CONFIG } from '../core/config.js';
import { createShaderCode } from '../rendering/shaders.js';

export function createPipelines(device, canvasFormat, vertexBufferLayout) {
    const shaders = createShaderCode(CONFIG.WORKGROUP_SIZE);
    const pipelines = {};
    const createTextureModule = device.createShaderModule({
        label: "create texture shader",
        code: shaders.createTexture
    });

    const createTextureLayout = device.createBindGroupLayout({
        label: "Create Texture Bind Group Layout",
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: {} },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, storageTexture: { format: "rgba8unorm" } },
            { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage"} }
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
            { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: {} }
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
    const boundaryModule = device.createShaderModule({
        label: "boundary shader",
        code: shaders.setBoundary
    });

    const boundaryLayout = device.createBindGroupLayout({
        label: "Boundary Bind Group Layout",
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: {} },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage"} }
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
    const diffuseModule = device.createShaderModule({
        label: "diffuse shader",
        code: shaders.diffuse
    });

    const diffuseLayout = device.createBindGroupLayout({
        label: "Diffuse Bind Group Layout",
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: {} },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage"} },
            { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage"} }
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
            { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage"} }
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

    const vorticityModule = device.createShaderModule({
        label: "vorticity shader",
        code: shaders.vorticity
    });

    const vorticityLayout = device.createBindGroupLayout({
        label: "Vorticity Bind Group Layout",
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: {} },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage"} },
            { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage"} }
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
    const bloomExtractModule = device.createShaderModule({
        label: "bloom extract shader",
        code: shaders.bloomExtract
    });

    const bloomExtractLayout = device.createBindGroupLayout({
        label: "Bloom Extract Bind Group Layout",
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, texture: { sampleType: "float" } },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, storageTexture: { format: "rgba16float" } }
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

    // Bloom Blur Horizontal Pipeline
    const bloomBlurHModule = device.createShaderModule({
        label: "bloom blur H shader",
        code: shaders.bloomBlurH
    });

    const bloomBlurLayout = device.createBindGroupLayout({
        label: "Bloom Blur Bind Group Layout",
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

    // Bloom Blur Vertical Pipeline
    const bloomBlurVModule = device.createShaderModule({
        label: "bloom blur V shader",
        code: shaders.bloomBlurV
    });

    pipelines.bloomBlurV = {
        layout: bloomBlurLayout,
        program: device.createComputePipeline({
            label: "bloom blur V pipeline",
            layout: device.createPipelineLayout({ bindGroupLayouts: [bloomBlurLayout] }),
            compute: { module: bloomBlurVModule, entryPoint: "computeMain" }
        })
    };

    // Bloom Composite Pipeline
    const bloomCompositeModule = device.createShaderModule({
        label: "bloom composite shader",
        code: shaders.bloomComposite
    });

    const bloomCompositeLayout = device.createBindGroupLayout({
        label: "Bloom Composite Bind Group Layout",
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, texture: { sampleType: "float" } },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, texture: { sampleType: "float" } },
            { binding: 2, visibility: GPUShaderStage.COMPUTE, storageTexture: { format: "rgba8unorm" } }
        ]
    });

    pipelines.bloomComposite = {
        layout: bloomCompositeLayout,
        program: device.createComputePipeline({
            label: "bloom composite pipeline",
            layout: device.createPipelineLayout({ bindGroupLayouts: [bloomCompositeLayout] }),
            compute: { module: bloomCompositeModule, entryPoint: "computeMain" }
        })
    };

    return pipelines;
}

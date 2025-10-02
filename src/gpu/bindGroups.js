export function createBindGroups(device, buffers, pipelines, texture, sampler) {
    const bindGroups = {};
    bindGroups.addDensity = [
        device.createBindGroup({
            label: "Add density 0 bind group",
            layout: pipelines.addDensity.layout,
            entries: [
                { binding: 0, resource: { buffer: buffers.uniformBuffer } },
                { binding: 1, resource: { buffer: buffers.densityBuffers[0] } },
                { binding: 2, resource: { buffer: buffers.densityBuffers[1] } },
                { binding: 3, resource: { buffer: buffers.addDensityBuffer } }
            ]
        }),
        device.createBindGroup({
            label: "Add density 1 bind group",
            layout: pipelines.addDensity.layout,
            entries: [
                { binding: 0, resource: { buffer: buffers.uniformBuffer } },
                { binding: 1, resource: { buffer: buffers.densityBuffers[1] } },
                { binding: 2, resource: { buffer: buffers.densityBuffers[0] } },
                { binding: 3, resource: { buffer: buffers.addDensityBuffer } }
            ]
        })
    ];

    bindGroups.addVelocity = [
        device.createBindGroup({
            label: "Add velocity 0 bind group",
            layout: pipelines.addDensity.layout,
            entries: [
                { binding: 0, resource: { buffer: buffers.uniformBuffer } },
                { binding: 1, resource: { buffer: buffers.velocityBuffers[0] } },
                { binding: 2, resource: { buffer: buffers.velocityBuffers[1] } },
                { binding: 3, resource: { buffer: buffers.addVelocityBuffer } }
            ]
        }),
        device.createBindGroup({
            label: "Add velocity 1 bind group",
            layout: pipelines.addDensity.layout,
            entries: [
                { binding: 0, resource: { buffer: buffers.uniformBuffer } },
                { binding: 1, resource: { buffer: buffers.velocityBuffers[1] } },
                { binding: 2, resource: { buffer: buffers.velocityBuffers[0] } },
                { binding: 3, resource: { buffer: buffers.addVelocityBuffer } }
            ]
        })
    ];
    bindGroups.boundary = [
        device.createBindGroup({
            label: "Boundary density 0",
            layout: pipelines.boundary.layout,
            entries: [
                { binding: 0, resource: { buffer: buffers.uniformBuffer } },
                { binding: 1, resource: { buffer: buffers.densityBuffers[0] } }
            ]
        }),
        device.createBindGroup({
            label: "Boundary density 1",
            layout: pipelines.boundary.layout,
            entries: [
                { binding: 0, resource: { buffer: buffers.uniformBuffer } },
                { binding: 1, resource: { buffer: buffers.densityBuffers[1] } }
            ]
        }),
        device.createBindGroup({
            label: "Boundary velocity 0",
            layout: pipelines.boundary.layout,
            entries: [
                { binding: 0, resource: { buffer: buffers.uniformBuffer } },
                { binding: 1, resource: { buffer: buffers.velocityBuffers[0] } }
            ]
        }),
        device.createBindGroup({
            label: "Boundary velocity 1",
            layout: pipelines.boundary.layout,
            entries: [
                { binding: 0, resource: { buffer: buffers.uniformBuffer } },
                { binding: 1, resource: { buffer: buffers.velocityBuffers[1] } }
            ]
        })
    ];
    bindGroups.diffuseDensity = [
        device.createBindGroup({
            label: "Diffuse density 0",
            layout: pipelines.diffuse.layout,
            entries: [
                { binding: 0, resource: { buffer: buffers.uniformBuffer } },
                { binding: 1, resource: { buffer: buffers.densityBuffers[0] } },
                { binding: 2, resource: { buffer: buffers.densityBuffers[1] } }
            ]
        }),
        device.createBindGroup({
            label: "Diffuse density 1",
            layout: pipelines.diffuse.layout,
            entries: [
                { binding: 0, resource: { buffer: buffers.uniformBuffer } },
                { binding: 1, resource: { buffer: buffers.densityBuffers[1] } },
                { binding: 2, resource: { buffer: buffers.densityBuffers[0] } }
            ]
        })
    ];

    bindGroups.diffuseVelocity = [
        device.createBindGroup({
            label: "Diffuse velocity 0",
            layout: pipelines.diffuse.layout,
            entries: [
                { binding: 0, resource: { buffer: buffers.uniformBuffer } },
                { binding: 1, resource: { buffer: buffers.velocityBuffers[0] } },
                { binding: 2, resource: { buffer: buffers.velocityBuffers[1] } }
            ]
        }),
        device.createBindGroup({
            label: "Diffuse velocity 1",
            layout: pipelines.diffuse.layout,
            entries: [
                { binding: 0, resource: { buffer: buffers.uniformBuffer } },
                { binding: 1, resource: { buffer: buffers.velocityBuffers[1] } },
                { binding: 2, resource: { buffer: buffers.velocityBuffers[0] } }
            ]
        })
    ];
    bindGroups.advectDensity = [
        device.createBindGroup({
            label: "Advect density 0→0",
            layout: pipelines.advect.layout,
            entries: [
                { binding: 0, resource: { buffer: buffers.uniformBuffer } },
                { binding: 1, resource: { buffer: buffers.densityBuffers[0] } },
                { binding: 2, resource: { buffer: buffers.densityBuffers[1] } },
                { binding: 3, resource: { buffer: buffers.velocityBuffers[0] } }
            ]
        }),
        device.createBindGroup({
            label: "Advect density 1→0",
            layout: pipelines.advect.layout,
            entries: [
                { binding: 0, resource: { buffer: buffers.uniformBuffer } },
                { binding: 1, resource: { buffer: buffers.densityBuffers[0] } },
                { binding: 2, resource: { buffer: buffers.densityBuffers[1] } },
                { binding: 3, resource: { buffer: buffers.velocityBuffers[1] } }
            ]
        }),
        device.createBindGroup({
            label: "Advect density 0→1",
            layout: pipelines.advect.layout,
            entries: [
                { binding: 0, resource: { buffer: buffers.uniformBuffer } },
                { binding: 1, resource: { buffer: buffers.densityBuffers[1] } },
                { binding: 2, resource: { buffer: buffers.densityBuffers[0] } },
                { binding: 3, resource: { buffer: buffers.velocityBuffers[0] } }
            ]
        }),
        device.createBindGroup({
            label: "Advect density 1→1",
            layout: pipelines.advect.layout,
            entries: [
                { binding: 0, resource: { buffer: buffers.uniformBuffer } },
                { binding: 1, resource: { buffer: buffers.densityBuffers[1] } },
                { binding: 2, resource: { buffer: buffers.densityBuffers[0] } },
                { binding: 3, resource: { buffer: buffers.velocityBuffers[1] } }
            ]
        })
    ];

    bindGroups.advectVelocity = [
        device.createBindGroup({
            label: "Advect velocity 0",
            layout: pipelines.advect.layout,
            entries: [
                { binding: 0, resource: { buffer: buffers.uniformBuffer } },
                { binding: 1, resource: { buffer: buffers.velocityBuffers[0] } },
                { binding: 2, resource: { buffer: buffers.velocityBuffers[1] } },
                { binding: 3, resource: { buffer: buffers.velocityBuffers[1] } }
            ]
        }),
        device.createBindGroup({
            label: "Advect velocity 1",
            layout: pipelines.advect.layout,
            entries: [
                { binding: 0, resource: { buffer: buffers.uniformBuffer } },
                { binding: 1, resource: { buffer: buffers.velocityBuffers[1] } },
                { binding: 2, resource: { buffer: buffers.velocityBuffers[0] } },
                { binding: 3, resource: { buffer: buffers.velocityBuffers[0] } }
            ]
        })
    ];
    bindGroups.project1 = [
        device.createBindGroup({
            label: "Project1 0",
            layout: pipelines.project1.layout,
            entries: [
                { binding: 0, resource: { buffer: buffers.uniformBuffer } },
                { binding: 1, resource: { buffer: buffers.velocityBuffers[0] } },
                { binding: 2, resource: { buffer: buffers.velocityBuffers[1] } }
            ]
        }),
        device.createBindGroup({
            label: "Project1 1",
            layout: pipelines.project1.layout,
            entries: [
                { binding: 0, resource: { buffer: buffers.uniformBuffer } },
                { binding: 1, resource: { buffer: buffers.velocityBuffers[1] } },
                { binding: 2, resource: { buffer: buffers.velocityBuffers[0] } }
            ]
        })
    ];

    bindGroups.project2 = [
        device.createBindGroup({
            label: "Project2 0",
            layout: pipelines.project2.layout,
            entries: [
                { binding: 0, resource: { buffer: buffers.uniformBuffer } },
                { binding: 1, resource: { buffer: buffers.velocityBuffers[0] } },
                { binding: 2, resource: { buffer: buffers.velocityBuffers[1] } }
            ]
        }),
        device.createBindGroup({
            label: "Project2 1",
            layout: pipelines.project2.layout,
            entries: [
                { binding: 0, resource: { buffer: buffers.uniformBuffer } },
                { binding: 1, resource: { buffer: buffers.velocityBuffers[1] } },
                { binding: 2, resource: { buffer: buffers.velocityBuffers[0] } }
            ]
        })
    ];

    bindGroups.project3 = [
        device.createBindGroup({
            label: "Project3 0",
            layout: pipelines.project3.layout,
            entries: [
                { binding: 0, resource: { buffer: buffers.uniformBuffer } },
                { binding: 1, resource: { buffer: buffers.velocityBuffers[0] } },
                { binding: 2, resource: { buffer: buffers.velocityBuffers[1] } }
            ]
        }),
        device.createBindGroup({
            label: "Project3 1",
            layout: pipelines.project3.layout,
            entries: [
                { binding: 0, resource: { buffer: buffers.uniformBuffer } },
                { binding: 1, resource: { buffer: buffers.velocityBuffers[1] } },
                { binding: 2, resource: { buffer: buffers.velocityBuffers[0] } }
            ]
        })
    ];
    bindGroups.createTexture = [
        device.createBindGroup({
            label: "Create texture density 0",
            layout: pipelines.createTexture.layout,
            entries: [
                { binding: 0, resource: { buffer: buffers.uniformBuffer } },
                { binding: 1, resource: texture.createView() },
                { binding: 2, resource: { buffer: buffers.densityBuffers[0] } }
            ]
        }),
        device.createBindGroup({
            label: "Create texture density 1",
            layout: pipelines.createTexture.layout,
            entries: [
                { binding: 0, resource: { buffer: buffers.uniformBuffer } },
                { binding: 1, resource: texture.createView() },
                { binding: 2, resource: { buffer: buffers.densityBuffers[1] } }
            ]
        }),
        device.createBindGroup({
            label: "Create texture velocity 0",
            layout: pipelines.createTexture.layout,
            entries: [
                { binding: 0, resource: { buffer: buffers.uniformBuffer } },
                { binding: 1, resource: texture.createView() },
                { binding: 2, resource: { buffer: buffers.velocityBuffers[0] } }
            ]
        }),
        device.createBindGroup({
            label: "Create texture velocity 1",
            layout: pipelines.createTexture.layout,
            entries: [
                { binding: 0, resource: { buffer: buffers.uniformBuffer } },
                { binding: 1, resource: texture.createView() },
                { binding: 2, resource: { buffer: buffers.velocityBuffers[1] } }
            ]
        })
    ];
    bindGroups.drawTexture = device.createBindGroup({
        label: "Draw texture",
        layout: pipelines.drawTexture.layout,
        entries: [
            { binding: 0, resource: { buffer: buffers.uniformBuffer } },
            { binding: 1, resource: texture.createView() },
            { binding: 2, resource: sampler }
        ]
    });
    bindGroups.drawBuffer = [
        device.createBindGroup({
            label: "Draw buffer density 0",
            layout: pipelines.drawBuffer.layout,
            entries: [
                { binding: 0, resource: { buffer: buffers.uniformBuffer } },
                { binding: 1, resource: { buffer: buffers.densityBuffers[0] } }
            ]
        }),
        device.createBindGroup({
            label: "Draw buffer density 1",
            layout: pipelines.drawBuffer.layout,
            entries: [
                { binding: 0, resource: { buffer: buffers.uniformBuffer } },
                { binding: 1, resource: { buffer: buffers.densityBuffers[1] } }
            ]
        }),
        device.createBindGroup({
            label: "Draw buffer velocity 0",
            layout: pipelines.drawBuffer.layout,
            entries: [
                { binding: 0, resource: { buffer: buffers.uniformBuffer } },
                { binding: 1, resource: { buffer: buffers.velocityBuffers[0] } }
            ]
        }),
        device.createBindGroup({
            label: "Draw buffer velocity 1",
            layout: pipelines.drawBuffer.layout,
            entries: [
                { binding: 0, resource: { buffer: buffers.uniformBuffer } },
                { binding: 1, resource: { buffer: buffers.velocityBuffers[1] } }
            ]
        })
    ];
    return bindGroups;
}

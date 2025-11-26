export function createShaderCode(WORKGROUP_SIZE) {
    return {
	    createTexture: `
    struct Uniforms {
        mouse: vec2f,
        grid_size: vec2f,
        diff: f32, visc: f32,
        N: f32, dt: f32, b: f32,
    };

    fn IX(x: u32, y: u32) -> u32 {
        var grid = uniforms.grid_size;
        return y * u32(grid.x) + x;
    }

    @group(0) @binding(0) var<uniform> uniforms: Uniforms;
    @group(0) @binding(1) var out_texture: texture_storage_2d<rgba8unorm, write>;
    @group(0) @binding(2) var<storage> stateIn: array<vec4f>;

    @compute @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
    fn computeMain(@builtin(global_invocation_id) global_id: vec3u) {
        let texDims = textureDimensions(out_texture);

        // Bounds check
        if (global_id.x >= texDims.x || global_id.y >= texDims.y) {
            return;
        }

        // Determine grid size from buffer length
        let bufferSize = arrayLength(&stateIn);
        let gridSizePlusBoundary = u32(sqrt(f32(bufferSize)));
        let N = f32(gridSizePlusBoundary - 2);

        // Scale texture coordinates to grid coordinates
        let simX = (f32(global_id.x) / f32(texDims.x)) * N;
        let simY = (f32(global_id.y) / f32(texDims.y)) * N;

        // Clamp to valid simulation bounds
        if (simX < 0.0 || simX >= N || simY < 0.0 || simY >= N) {
            textureStore(out_texture, vec2<u32>(global_id.x, global_id.y), vec4<f32>(0.0, 0.0, 0.0, 1.0));
            return;
        }

        // Bilinear interpolation
        let x0 = u32(floor(simX));
        let y0 = u32(floor(simY));
        let x1 = min(x0 + 1, u32(N) - 1);
        let y1 = min(y0 + 1, u32(N) - 1);

        let fx = fract(simX);
        let fy = fract(simY);

        let gridWidth = gridSizePlusBoundary;
        let c00 = stateIn[(y0 + 1) * gridWidth + (x0 + 1)];
        let c10 = stateIn[(y0 + 1) * gridWidth + (x1 + 1)];
        let c01 = stateIn[(y1 + 1) * gridWidth + (x0 + 1)];
        let c11 = stateIn[(y1 + 1) * gridWidth + (x1 + 1)];

        // Bilinear blend
        let c0 = mix(c00, c10, fx);
        let c1 = mix(c01, c11, fx);
        var color = mix(c0, c1, fy);

        textureStore(out_texture, vec2<u32>(global_id.x, global_id.y), vec4<f32>(color.rgb, 1.0));
    }
`,
        drawBuffer: `
            struct VertexInput {
                @location(0) position: vec2f,
                @location(1) uv: vec2f,
            };

            struct VertexOutput {
                @builtin(position) position: vec4f,
                @location(0) uv: vec2f,
            };

            struct Uniforms {
                mouse: vec2f,
                grid_size: vec2f,
                diff: f32, visc: f32,
                N: f32, dt: f32, b: f32,
            };

            @group(0) @binding(0) var<uniform> uniforms: Uniforms;
            @group(0) @binding(1) var<storage> buffer: array<vec4f>;

            fn IX(x: u32, y: u32) -> u32 {
                var grid = uniforms.grid_size;
                return y * u32(grid.x) + x;
            }

            @vertex
            fn vertexMain(input: VertexInput) -> VertexOutput {
                var output: VertexOutput;
                output.position = vec4f(input.position, 0, 1);
                output.uv = input.uv;
                return output;
            }

            @fragment
            fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
                var id = vec2u((floor(input.uv * uniforms.N)));
                var index = IX(id.x + 1, id.y + 1);
                var value = buffer[index];
                return value;
            }
        `,

        drawTexture: `
            struct VertexInput {
                @location(0) position: vec2f,
                @location(1) uv: vec2f,
            };

            struct VertexOutput {
                @builtin(position) position: vec4f,
                @location(0) uv: vec2f,
            };

            struct Uniforms {
                mouse: vec2f,
                grid_size: vec2f,
                diff: f32, visc: f32,
                N: f32, dt: f32, b: f32,
            };

            @group(0) @binding(0) var<uniform> uniforms: Uniforms;
            @group(0) @binding(1) var myTexture: texture_2d<f32>;
            @group(0) @binding(2) var mySampler: sampler;

            @vertex
            fn vertexMain(input: VertexInput) -> VertexOutput {
                var output: VertexOutput;
                output.position = vec4f(input.position, 0, 1);
                output.uv = input.uv;
                return output;
            }

            @fragment
            fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
                return textureSample(myTexture, mySampler, input.uv);
            }
        `,

        addDensity: `
            struct Uniforms {
                mouse: vec2f,
                grid_size: vec2f,
                diff: f32, visc: f32,
                N: f32, dt: f32, b: f32,
            };

            struct Source {
                color: vec4f,
                radius: f32,
            };

            @group(0) @binding(0) var<uniform> uniforms: Uniforms;
            @group(0) @binding(1) var<storage, read_write> stateOut: array<vec4f>;
            @group(0) @binding(2) var<storage> stateIn: array<vec4f>;
            @group(0) @binding(3) var<uniform> source: Source;

            @compute @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
            fn computeMain(@builtin(global_invocation_id) global_id: vec3u) {
                var index = (global_id.x + 1) + u32(uniforms.grid_size.x) * (global_id.y + 1);
                stateOut[index] = stateIn[index];

                // Stam's add_source: just add if within radius
                if(length(vec2f(uniforms.mouse) - vec2f((vec2f(global_id.xy) + vec2f(1)))) < source.radius) {
                    stateOut[index] += source.color;
                }
            }
        `,

        setBoundary: `
            struct Uniforms {
                mouse: vec2f,
                grid_size: vec2f,
                diff: f32, visc: f32,
                N: f32, dt: f32, b: f32,
            };

            fn IX(x: u32, y: u32) -> u32 {
                var grid = uniforms.grid_size;
                return y * u32(grid.x) + x;
            }

            @group(0) @binding(0) var<uniform> uniforms: Uniforms;
            @group(0) @binding(1) var<storage, read_write> arr: array<vec4f>;

            @compute @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
            fn computeMain(@builtin(global_invocation_id) global_id: vec3u) {
                var i = global_id.x;
                var j = global_id.y;
                var index = IX(i,j);
                var N = u32(uniforms.N);

                if(f32(i) >= uniforms.grid_size.x) { return; }
                if(f32(j) >= uniforms.grid_size.y) { return; }

                // Stam's set_bnd: b=0 for density, b=1 for u (horizontal vel), b=2 for v (vertical vel)

                // Left and right walls (i=0 and i=N+1)
                if(i == 0 && j >= 1 && j <= N) {
                    if(u32(uniforms.b) == 1) {
                        arr[index] = -arr[IX(1, j)];  // Reverse horizontal velocity
                    } else {
                        arr[index] = arr[IX(1, j)];   // Copy for density and v
                    }
                    return;
                }
                if(i == u32(N + 1) && j >= 1 && j <= N) {
                    if(u32(uniforms.b) == 1) {
                        arr[index] = -arr[IX(N, j)];  // Reverse horizontal velocity
                    } else {
                        arr[index] = arr[IX(N, j)];   // Copy for density and v
                    }
                    return;
                }

                // Top and bottom walls (j=0 and j=N+1)
                if(j == 0 && i >= 1 && i <= N) {
                    if(u32(uniforms.b) == 2) {
                        arr[index] = -arr[IX(i, 1)];  // Reverse vertical velocity
                    } else {
                        arr[index] = arr[IX(i, 1)];   // Copy for density and u
                    }
                    return;
                }
                if(j == u32(N + 1) && i >= 1 && i <= N) {
                    if(u32(uniforms.b) == 2) {
                        arr[index] = -arr[IX(i, N)];  // Reverse vertical velocity
                    } else {
                        arr[index] = arr[IX(i, N)];   // Copy for density and u
                    }
                    return;
                }

                // Corners - average of adjacent cells
                if(i == 0 && j == 0) {
                    arr[index] = (arr[IX(1, 0)] + arr[IX(0, 1)]) * 0.5;
                    return;
                }
                if(i == 0 && j == u32(N + 1)) {
                    arr[index] = (arr[IX(1, N + 1)] + arr[IX(0, N)]) * 0.5;
                    return;
                }
                if(i == u32(N + 1) && j == 0) {
                    arr[index] = (arr[IX(N, 0)] + arr[IX(N + 1, 1)]) * 0.5;
                    return;
                }
                if(i == u32(N + 1) && j == u32(N + 1)) {
                    arr[index] = (arr[IX(N, N + 1)] + arr[IX(N + 1, N)]) * 0.5;
                    return;
                }
            }
        `,

        diffuse: `
            struct Uniforms {
                mouse: vec2f,
                grid_size: vec2f,
                diffuse: f32, viscosity: f32,
                N: f32, dt: f32, b: f32,
            };

            @group(0) @binding(0) var<uniform> uniforms: Uniforms;
            @group(0) @binding(1) var<storage, read_write> x: array<vec4f>;
            @group(0) @binding(2) var<storage> x0: array<vec4f>;

            @compute @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
            fn computeMain(@builtin(global_invocation_id) global_id: vec3u) {
                // Direct index calculation with +1 offset for boundary
                let i = global_id.x + 1;
                let j = global_id.y + 1;
                let grid_width = u32(uniforms.grid_size.x);
                let idx = j * grid_width + i;

                // Stam's diffusion: a = dt*diff*N*N
                let a = uniforms.dt * uniforms.diffuse * uniforms.N * uniforms.N;
                let inv_denom = 1.0 / (1.0 + 4.0 * a);

                // Neighbor indices
                let idx_left = idx - 1;
                let idx_right = idx + 1;
                let idx_bottom = idx - grid_width;
                let idx_top = idx + grid_width;

                // Stam's formula: x[i,j] = (x0[i,j] + a*(x[i-1,j]+x[i+1,j]+x[i,j-1]+x[i,j+1]))/(1+4*a)
                x[idx] = (x0[idx] + a * (x[idx_left] + x[idx_right] + x[idx_bottom] + x[idx_top])) * inv_denom;
            }
        `,

        advect: `
            struct Uniforms {
                mouse: vec2f,
                grid_size: vec2f,
                diffuse: f32, viscosity: f32,
                N: f32, dt: f32, b: f32,
            };

            @group(0) @binding(0) var<uniform> uniforms: Uniforms;
            @group(0) @binding(1) var<storage, read_write> d: array<vec4f>;
            @group(0) @binding(2) var<storage> d0: array<vec4f>;
            @group(0) @binding(3) var<storage> uv: array<vec4f>;

            @compute @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
            fn computeMain(@builtin(global_invocation_id) global_id: vec3u) {
                let grid_width = u32(uniforms.grid_size.x);
                let i = f32(global_id.x + 1);
                let j = f32(global_id.y + 1);
                let idx = u32(j) * grid_width + u32(i);

                // dt0 = dt * N
                let dt0 = uniforms.dt * uniforms.N;

                // Backtrace: find where this particle came from
                var x = i - dt0 * uv[idx].x;
                var y = j - dt0 * uv[idx].y;

                // Clamp to grid bounds
                if (x < 0.5) { x = 0.5; }
                if (x > uniforms.N + 0.5) { x = uniforms.N + 0.5; }
                if (y < 0.5) { y = 0.5; }
                if (y > uniforms.N + 0.5) { y = uniforms.N + 0.5; }

                // Bilinear interpolation
                let i0 = u32(x);
                let i1 = i0 + 1;
                let j0 = u32(y);
                let j1 = j0 + 1;

                let s1 = x - f32(i0);
                let s0 = 1.0 - s1;
                let t1 = y - f32(j0);
                let t0 = 1.0 - t1;

                // Stam's formula: d[i,j] = s0*(t0*d0[i0,j0]+t1*d0[i0,j1]) + s1*(t0*d0[i1,j0]+t1*d0[i1,j1])
                d[idx] = s0 * (t0 * d0[j0 * grid_width + i0] + t1 * d0[j1 * grid_width + i0]) +
                         s1 * (t0 * d0[j0 * grid_width + i1] + t1 * d0[j1 * grid_width + i1]);
            }
        `,

        project1: `
            struct Uniforms {
                mouse: vec2f,
                grid_size: vec2f,
                diffuse: f32, viscosity: f32,
                N: f32, dt: f32, b: f32,
            };

            @group(0) @binding(0) var<uniform> uniforms: Uniforms;
            @group(0) @binding(1) var<storage> uv: array<vec4f>;
            @group(0) @binding(2) var<storage, read_write> p_div: array<vec4f>;

            @compute @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
            fn computeMain(@builtin(global_invocation_id) global_id: vec3u) {
                // Direct index calculation with +1 offset for boundary
                let i = global_id.x + 1;
                let j = global_id.y + 1;
                let grid_width = u32(uniforms.grid_size.x);
                let idx = j * grid_width + i;

                // Precompute coefficient: -0.5 * h where h = 1/N
                let coeff = -0.5 / uniforms.N;

                // Precompute neighbor indices
                let idx_left = idx - 1;
                let idx_right = idx + 1;
                let idx_bottom = idx - grid_width;
                let idx_top = idx + grid_width;

                // Calculate divergence
                p_div[idx].x = 0.0;
                p_div[idx].y = coeff * (uv[idx_right].x - uv[idx_left].x +
                                        uv[idx_top].y - uv[idx_bottom].y);
            }
        `,

        project2: `
            struct Uniforms {
                mouse: vec2f,
                grid_size: vec2f,
                diffuse: f32, viscosity: f32,
                N: f32, dt: f32, b: f32,
            };

            @group(0) @binding(0) var<uniform> uniforms: Uniforms;
            @group(0) @binding(1) var<storage> uv: array<vec4f>;
            @group(0) @binding(2) var<storage, read_write> p_div: array<vec4f>;

            @compute @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
            fn computeMain(@builtin(global_invocation_id) global_id: vec3u) {
                // Direct index calculation with +1 offset for boundary
                let i = global_id.x + 1;
                let j = global_id.y + 1;
                let grid_width = u32(uniforms.grid_size.x);
                let idx = j * grid_width + i;

                // Precompute neighbor indices
                let idx_center = idx;
                let idx_left = idx - 1;
                let idx_right = idx + 1;
                let idx_bottom = idx - grid_width;
                let idx_top = idx + grid_width;

                // Average: (center.y + left.x + right.x + bottom.x + top.x) / 4
                // Use multiplication instead of division for performance
                p_div[idx_center].x = (p_div[idx_center].y + p_div[idx_left].x +
                                       p_div[idx_right].x + p_div[idx_bottom].x +
                                       p_div[idx_top].x) * 0.25;
            }
        `,

        project3: `
            struct Uniforms {
                mouse: vec2f,
                grid_size: vec2f,
                diffuse: f32, viscosity: f32,
                N: f32, dt: f32, b: f32,
            };

            @group(0) @binding(0) var<uniform> uniforms: Uniforms;
            @group(0) @binding(1) var<storage, read_write> uv: array<vec4f>;
            @group(0) @binding(2) var<storage> p_div: array<vec4f>;

            @compute @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
            fn computeMain(@builtin(global_invocation_id) global_id: vec3u) {
                // Direct index calculation with +1 offset for boundary
                let i = global_id.x + 1;
                let j = global_id.y + 1;
                let grid_width = u32(uniforms.grid_size.x);
                let idx = j * grid_width + i;

                // Precompute coefficient: -1.0 / h where h = 1/N, so this is -N
                let coeff = -uniforms.N;

                // Precompute neighbor indices
                let idx_left = idx - 1;
                let idx_right = idx + 1;
                let idx_bottom = idx - grid_width;
                let idx_top = idx + grid_width;

                // Subtract pressure gradient
                uv[idx].x += coeff * (p_div[idx_right].x - p_div[idx_left].x);
                uv[idx].y += coeff * (p_div[idx_top].x - p_div[idx_bottom].x);
            }
        `,

        vorticity: `
            @group(0) @binding(0) var<uniform> uniforms: Uniforms;
            @group(0) @binding(1) var<storage, read_write> vort: array<vec4f>;
            @group(0) @binding(2) var<storage> uv: array<vec4f>;

            @compute @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
            fn computeMain(@builtin(global_invocation_id) global_id: vec3u) {
                let N = u32(uniforms.N);
                let x = global_id.x + 1;
                let y = global_id.y + 1;

                if (x > N || y > N) { return; }

                let grid_width = u32(uniforms.grid_size.x);
                let idx = y * grid_width + x;
                let idx_left = idx - 1;
                let idx_right = idx + 1;
                let idx_bottom = idx - grid_width;
                let idx_top = idx + grid_width;

                let du_dy = (uv[idx_top].x - uv[idx_bottom].x) * 0.5;
                let dv_dx = (uv[idx_right].y - uv[idx_left].y) * 0.5;

                vort[idx].x = du_dy - dv_dx;
            }
        `,

        vorticityConfinement: `
            @group(0) @binding(0) var<uniform> uniforms: Uniforms;
            @group(0) @binding(1) var<storage, read_write> uv: array<vec4f>;
            @group(0) @binding(2) var<storage> vort: array<vec4f>;

            @compute @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
            fn computeMain(@builtin(global_invocation_id) global_id: vec3u) {
                let N = u32(uniforms.N);
                let x = global_id.x + 1;
                let y = global_id.y + 1;

                if (x > N || y > N) { return; }

                let grid_width = u32(uniforms.grid_size.x);
                let idx = y * grid_width + x;
                let idx_left = idx - 1;
                let idx_right = idx + 1;
                let idx_bottom = idx - grid_width;
                let idx_top = idx + grid_width;

                let dw_dx = (abs(vort[idx_right].x) - abs(vort[idx_left].x)) * 0.5;
                let dw_dy = (abs(vort[idx_top].x) - abs(vort[idx_bottom].x)) * 0.5;

                let length = sqrt(dw_dx * dw_dx + dw_dy * dw_dy) + 0.000001;
                let force_x = (dw_dy / length) * vort[idx].x;
                let force_y = -(dw_dx / length) * vort[idx].x;

                uv[idx].x += uniforms.visc * uniforms.dt * force_x * 100.0;
                uv[idx].y += uniforms.visc * uniforms.dt * force_y * 100.0;
            }
        `
    };
}

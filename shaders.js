export function createShaderCode(WORKGROUP_SIZE) {
    return {
	    createTexture: `
    struct Uniforms {
        mouse: vec2f,
        grid_size: vec2f,
        diff: f32, visc: f32,
        N: f32, dt: f32, b: f32,
        palette: f32,  // Color palette selector
    };

    fn IX(x: u32, y: u32) -> u32 {
        var grid = uniforms.grid_size;
        return y * u32(grid.x) + x;
    }

    // Color palette functions
    fn applyPalette(color: vec4f, paletteType: f32) -> vec4f {
        let intensity = length(color.rgb);
        if (intensity < 0.001) {
            return vec4f(0.0, 0.0, 0.0, 1.0);
        }

        let normalizedColor = color.rgb / max(intensity, 0.001);

        // 0: Rainbow (default)
        if (paletteType < 0.5) {
            return color;  // Keep original rainbow colors
        }
        // 1: Ocean
        else if (paletteType < 1.5) {
            let t = intensity;
            return vec4f(
                mix(0.0, 0.3, t),
                mix(0.2, 0.8, t),
                mix(0.4, 1.0, t),
                1.0
            );
        }
        // 2: Fire
        else if (paletteType < 2.5) {
            let t = clamp(intensity * 1.5, 0.0, 1.0);
            var fireColor: vec3f;
            if (t < 0.33) {
                fireColor = mix(vec3f(0.1, 0.0, 0.0), vec3f(0.8, 0.0, 0.0), t * 3.0);
            } else if (t < 0.66) {
                fireColor = mix(vec3f(0.8, 0.0, 0.0), vec3f(1.0, 0.5, 0.0), (t - 0.33) * 3.0);
            } else {
                fireColor = mix(vec3f(1.0, 0.5, 0.0), vec3f(1.0, 1.0, 0.3), (t - 0.66) * 3.0);
            }
            return vec4f(fireColor, 1.0);
        }
        // 3: Neon
        else if (paletteType < 3.5) {
            let hue = atan2(normalizedColor.y - 0.5, normalizedColor.x - 0.5) / 6.28318 + 0.5;
            let t = intensity;
            return vec4f(
                sin(hue * 6.28318) * 0.5 + 0.5,
                sin((hue + 0.33) * 6.28318) * 0.5 + 0.5,
                sin((hue + 0.66) * 6.28318) * 0.5 + 0.5,
                1.0
            ) * t + vec4f(0.1, 0.1, 0.1, 0.0);
        }
        // 4: Pastel
        else if (paletteType < 4.5) {
            let t = intensity * 0.7;
            return vec4f(
                mix(0.9, normalizedColor.r * 0.8 + 0.2, t),
                mix(0.9, normalizedColor.g * 0.8 + 0.2, t),
                mix(0.9, normalizedColor.b * 0.8 + 0.2, t),
                1.0
            );
        }
        // 5: Monochrome
        else if (paletteType < 5.5) {
            return vec4f(intensity, intensity, intensity, 1.0);
        }
        // 6: Sunset
        else {
            let t = clamp(intensity * 1.2, 0.0, 1.0);
            var sunsetColor: vec3f;
            if (t < 0.5) {
                sunsetColor = mix(vec3f(0.2, 0.0, 0.3), vec3f(0.8, 0.2, 0.5), t * 2.0);
            } else {
                sunsetColor = mix(vec3f(0.8, 0.2, 0.5), vec3f(1.0, 0.6, 0.3), (t - 0.5) * 2.0);
            }
            return vec4f(sunsetColor, 1.0);
        }
    }

    @group(0) @binding(0) var<uniform> uniforms: Uniforms;
    @group(0) @binding(1) var out_texture: texture_storage_2d<rgba8unorm, write>;
    @group(0) @binding(2) var<storage> stateIn: array<vec4f>;
    @group(0) @binding(3) var<storage> obstacles: array<vec4f>;

    @compute @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
    fn computeMain(@builtin(global_invocation_id) global_id: vec3u) {
        let texDims = textureDimensions(out_texture);

        // Bounds check
        if (global_id.x >= texDims.x || global_id.y >= texDims.y) {
            return;
        }

        // Calculate aspect ratios
        let texAspect = f32(texDims.x) / f32(texDims.y);
        let simAspect = 1.0; // Simulation is always square

        var simX: f32;
        var simY: f32;

        // Map texture coordinates to simulation grid, handling aspect ratio
        if (texAspect > simAspect) {
            // Texture is wider - fit height
            let scale = f32(texDims.y);
            let offset = (f32(texDims.x) - scale) / 2.0;
            simX = (f32(global_id.x) - offset) * uniforms.N / scale;
            simY = f32(global_id.y) * uniforms.N / f32(texDims.y);
        } else {
            // Texture is taller - fit width
            let scale = f32(texDims.x);
            let offset = (f32(texDims.y) - scale) / 2.0;
            simX = f32(global_id.x) * uniforms.N / f32(texDims.x);
            simY = (f32(global_id.y) - offset) * uniforms.N / scale;
        }

        // Clamp to valid simulation bounds
        if (simX < 0.0 || simX >= uniforms.N || simY < 0.0 || simY >= uniforms.N) {
            textureStore(out_texture, vec2<u32>(global_id.x, global_id.y), vec4<f32>(0.0, 0.0, 0.0, 1.0));
            return;
        }

        // Bilinear interpolation
        let x0 = u32(floor(simX));
        let y0 = u32(floor(simY));
        let x1 = min(x0 + 1, u32(uniforms.N) - 1);
        let y1 = min(y0 + 1, u32(uniforms.N) - 1);

        let fx = fract(simX);
        let fy = fract(simY);

        let c00 = stateIn[IX(x0 + 1, y0 + 1)];
        let c10 = stateIn[IX(x1 + 1, y0 + 1)];
        let c01 = stateIn[IX(x0 + 1, y1 + 1)];
        let c11 = stateIn[IX(x1 + 1, y1 + 1)];

        // Bilinear blend
        let c0 = mix(c00, c10, fx);
        let c1 = mix(c01, c11, fx);
        let color = mix(c0, c1, fy);

        // Sample obstacle field with bilinear interpolation for smooth edges
        let o00 = obstacles[IX(x0 + 1, y0 + 1)].x;
        let o10 = obstacles[IX(x1 + 1, y0 + 1)].x;
        let o01 = obstacles[IX(x0 + 1, y1 + 1)].x;
        let o11 = obstacles[IX(x1 + 1, y1 + 1)].x;

        // Bilinear interpolation of obstacle field
        let o0 = mix(o00, o10, fx);
        let o1 = mix(o01, o11, fx);
        let obstacleValue = mix(o0, o1, fy);

        // Smooth transition between fluid and obstacle
        // obstacleValue ranges from 0.0 (fluid) to 1.0 (obstacle)
        let obstacleColor = vec4f(0.6, 0.6, 0.6, 1.0);
        let fluidColor = applyPalette(color, uniforms.palette);

        // Use smoothstep for even smoother antialiasing at obstacle edges
        let t = smoothstep(0.3, 0.7, obstacleValue);
        let finalColor = mix(fluidColor, obstacleColor, t);

        textureStore(out_texture, vec2<u32>(global_id.x, global_id.y), vec4<f32>(finalColor.rgb, 1.0));
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
            @group(0) @binding(4) var<storage> obstacles: array<vec4f>;

            @compute @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
            fn computeMain(@builtin(global_invocation_id) global_id: vec3u) {
                var index = (global_id.x + 1) + u32(uniforms.grid_size.x) * (global_id.y + 1);
                stateOut[index] = stateIn[index];

                // Don't add density/velocity to obstacle cells
                if (obstacles[index].x < 0.5) {
                    if(length(vec2f(uniforms.mouse) - vec2f((vec2f(global_id.xy) + vec2f(1)))) < source.radius) {
                        stateOut[index] += source.color;
                    }
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
            @group(0) @binding(2) var<storage> obstacles: array<vec4f>;

            @compute @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
            fn computeMain(@builtin(global_invocation_id) global_id: vec3u) {
                var i = global_id.x;
                var j = global_id.y;
                var index = IX(i,j);
                var N = u32(uniforms.N);

                if(f32(i) >= uniforms.grid_size.x) { return; }
                if(f32(j) >= uniforms.grid_size.y) { return; }

                // Handle corners first
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

                // Check if this is an obstacle cell first
                if (obstacles[index].x > 0.5) {
                    // Obstacle cell - set to zero (solid wall)
                    arr[index] = vec4f(0.0, 0.0, 0.0, 0.0);
                    return;
                }

                // Handle edges
                if(u32(uniforms.b) == 0) {
                    // Density boundary - just copy from adjacent cell
                    if(i == 0) { arr[index] = arr[IX(1, j)]; }
                    else if(i == u32(N + 1)) { arr[index] = arr[IX(N, j)]; }
                    else if(j == 0) { arr[index] = arr[IX(i, 1)]; }
                    else if(j == u32(N+1)) { arr[index] = arr[IX(i, N)]; }
                } else {
                    // Velocity boundary - reflect velocity component perpendicular to wall
                    if(i == 0) {
                        arr[index] = arr[IX(1, j)];
                        arr[index].x *= -1.0;
                    }
                    else if(i == u32(N + 1)) {
                        arr[index] = arr[IX(N, j)];
                        arr[index].x *= -1.0;
                    }
                    else if(j == 0) {
                        arr[index] = arr[IX(i, 1)];
                        arr[index].y *= -1.0;
                    }
                    else if(j == u32(N + 1)) {
                        arr[index] = arr[IX(i, N)];
                        arr[index].y *= -1.0;
                    }
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
            @group(0) @binding(3) var<storage> obstacles: array<vec4f>;

            @compute @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
            fn computeMain(@builtin(global_invocation_id) global_id: vec3u) {
                // Direct index calculation with +1 offset for boundary
                let i = global_id.x + 1;
                let j = global_id.y + 1;
                let grid_width = u32(uniforms.grid_size.x);
                let idx = j * grid_width + i;

                // Skip diffusion for obstacle cells
                if (obstacles[idx].x > 0.5) {
                    x[idx] = vec4f(0.0, 0.0, 0.0, 0.0);
                    return;
                }

                // Precompute diffusion coefficient
                let a = uniforms.dt * uniforms.diffuse * uniforms.N * 0.1;
                let inv_denom = 1.0 / (1.0 + 4.0 * a);  // Replace division with multiplication

                // Precompute neighbor indices
                let idx_left = idx - 1;
                let idx_right = idx + 1;
                let idx_bottom = idx - grid_width;
                let idx_top = idx + grid_width;

                // Get center value from previous state
                var color = x0[idx];

                // Add weighted neighbor contributions from current state
                // For obstacle neighbors, use zero (no-flux boundary)
                var left_val = x[idx_left];
                var right_val = x[idx_right];
                var bottom_val = x[idx_bottom];
                var top_val = x[idx_top];
                var neighbor_count = 4.0;

                // If neighbor is obstacle, treat as zero flux (use center value from previous step)
                if (obstacles[idx_left].x > 0.5) { left_val = color; neighbor_count -= 1.0; }
                if (obstacles[idx_right].x > 0.5) { right_val = color; neighbor_count -= 1.0; }
                if (obstacles[idx_bottom].x > 0.5) { bottom_val = color; neighbor_count -= 1.0; }
                if (obstacles[idx_top].x > 0.5) { top_val = color; neighbor_count -= 1.0; }

                // Adjust diffusion based on number of valid neighbors
                if (neighbor_count > 0.0) {
                    let adjusted_a = a * neighbor_count / 4.0;
                    let adjusted_inv_denom = 1.0 / (1.0 + 4.0 * adjusted_a);
                    color += adjusted_a * (left_val + right_val + bottom_val + top_val);
                    x[idx] = color * adjusted_inv_denom;
                } else {
                    // Completely surrounded by obstacles
                    x[idx] = color;
                }
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
            @group(0) @binding(4) var<storage> obstacles: array<vec4f>;

            @compute @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
            fn computeMain(@builtin(global_invocation_id) global_id: vec3u) {
                let grid_width = u32(uniforms.grid_size.x);
                let i = f32(global_id.x + 1);
                let j = f32(global_id.y + 1);
                let idx = u32(j) * grid_width + u32(i);

                // Skip advection for obstacle cells
                if (obstacles[idx].x > 0.5) {
                    d[idx] = vec4f(0.0, 0.0, 0.0, 0.0);
                    return;
                }

                // Precompute dt0 = dt * N
                let dt0 = uniforms.dt * uniforms.N;

                // Backtrace position
                var x = i - dt0 * uv[idx].x;
                var y = j - dt0 * uv[idx].y;

                // Clamp to valid range
                x = clamp(x, 0.5, uniforms.N + 0.5);
                y = clamp(y, 0.5, uniforms.N + 0.5);

                // Get integer and fractional parts for bilinear interpolation
                let i0 = floor(x);
                let j0 = floor(y);
                let i1 = i0 + 1.0;
                let j1 = j0 + 1.0;

                let s1 = x - i0;
                let s0 = 1.0 - s1;
                let t1 = y - j0;
                let t0 = 1.0 - t1;

                // Direct index calculation for bilinear samples
                let i0u = u32(i0);
                let i1u = u32(i1);
                let j0u = u32(j0);
                let j1u = u32(j1);

                let idx00 = j0u * grid_width + i0u;
                let idx10 = j0u * grid_width + i1u;
                let idx01 = j1u * grid_width + i0u;
                let idx11 = j1u * grid_width + i1u;

                // Bilinear interpolation - skip obstacle samples
                var v00 = d0[idx00];
                var v10 = d0[idx10];
                var v01 = d0[idx01];
                var v11 = d0[idx11];

                var w00 = s0 * t0;
                var w10 = s1 * t0;
                var w01 = s0 * t1;
                var w11 = s1 * t1;

                // If sample point is in obstacle, zero out that sample and weight
                if (obstacles[idx00].x > 0.5) { v00 = vec4f(0.0); w00 = 0.0; }
                if (obstacles[idx10].x > 0.5) { v10 = vec4f(0.0); w10 = 0.0; }
                if (obstacles[idx01].x > 0.5) { v01 = vec4f(0.0); w01 = 0.0; }
                if (obstacles[idx11].x > 0.5) { v11 = vec4f(0.0); w11 = 0.0; }

                // Weighted bilinear interpolation with renormalization
                let total_weight = w00 + w10 + w01 + w11;
                if (total_weight > 0.0) {
                    d[idx] = (w00 * v00 + w10 * v10 + w01 * v01 + w11 * v11) / total_weight;
                } else {
                    d[idx] = vec4f(0.0);
                }
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

        fade: `
            struct Uniforms {
                mouse: vec2f,
                grid_size: vec2f,
                diffuse: f32, viscosity: f32,
                N: f32, dt: f32, b: f32,
            };

            @group(0) @binding(0) var<uniform> uniforms: Uniforms;
            @group(0) @binding(1) var<storage, read_write> density: array<vec4f>;

            fn IX(x: u32, y: u32) -> u32 {
                var grid = uniforms.grid_size;
                return y * u32(grid.x) + x;
            }

            @compute @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
            fn computeMain(@builtin(global_invocation_id) global_id: vec3u) {
                if(f32(global_id.x) >= uniforms.grid_size.x) { return; }
                if(f32(global_id.y) >= uniforms.grid_size.y) { return; }

                var index = IX(global_id.x, global_id.y);
                // Fade factor is stored in diffuse uniform (we'll reuse it)
                density[index] *= uniforms.diffuse;
            }
        `,

        // Vorticity calculation - computes curl of velocity field
        vorticity: `
            struct Uniforms {
                mouse: vec2f,
                grid_size: vec2f,
                diffuse: f32, viscosity: f32,
                N: f32, dt: f32, b: f32,
            };

            @group(0) @binding(0) var<uniform> uniforms: Uniforms;
            @group(0) @binding(1) var<storage> velocity: array<vec4f>;
            @group(0) @binding(2) var<storage, read_write> curl: array<vec4f>;

            fn IX(x: u32, y: u32) -> u32 {
                var grid = uniforms.grid_size;
                return y * u32(grid.x) + x;
            }

            @compute @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
            fn computeMain(@builtin(global_invocation_id) global_id: vec3u) {
                var i = global_id.x + 1;
                var j = global_id.y + 1;

                if(f32(i) >= uniforms.N + 1) { return; }
                if(f32(j) >= uniforms.N + 1) { return; }

                // Calculate curl (vorticity) = dv/dx - du/dy
                var dudy = (velocity[IX(i, j+1)].x - velocity[IX(i, j-1)].x) * 0.5;
                var dvdx = (velocity[IX(i+1, j)].y - velocity[IX(i-1, j)].y) * 0.5;

                // Store curl in x component (it's a scalar in 2D)
                curl[IX(i, j)].x = dvdx - dudy;
            }
        `,

        // Vorticity confinement - applies force to enhance vortices
        vorticityConfinement: `
            struct Uniforms {
                mouse: vec2f,
                grid_size: vec2f,
                diffuse: f32, viscosity: f32,
                N: f32, dt: f32, b: f32,
            };

            @group(0) @binding(0) var<uniform> uniforms: Uniforms;
            @group(0) @binding(1) var<storage, read_write> velocity: array<vec4f>;
            @group(0) @binding(2) var<storage> curl: array<vec4f>;

            @compute @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
            fn computeMain(@builtin(global_invocation_id) global_id: vec3u) {
                let i = global_id.x + 1;
                let j = global_id.y + 1;

                if(f32(i) >= uniforms.N + 1.0) { return; }
                if(f32(j) >= uniforms.N + 1.0) { return; }

                // Direct index calculation
                let grid_width = u32(uniforms.grid_size.x);
                let idx = j * grid_width + i;
                let idx_left = idx - 1;
                let idx_right = idx + 1;
                let idx_bottom = idx - grid_width;
                let idx_top = idx + grid_width;

                // Get curl magnitude at neighboring cells
                let curlL = abs(curl[idx_left].x);
                let curlR = abs(curl[idx_right].x);
                let curlB = abs(curl[idx_bottom].x);
                let curlT = abs(curl[idx_top].x);
                let curlC = curl[idx].x;

                // Calculate gradient of curl magnitude
                let dx = (curlR - curlL) * 0.5;
                let dy = (curlT - curlB) * 0.5;

                // Normalize the gradient using inverseSqrt for performance
                let len_sq = dx * dx + dy * dy + 1e-10;
                let inv_len = inverseSqrt(len_sq);
                let norm_dx = dx * inv_len;
                let norm_dy = dy * inv_len;

                // Precompute force magnitude
                let force = curlC * uniforms.diffuse * uniforms.dt;

                // Apply force perpendicular to gradient, in direction of curl
                velocity[idx].x += norm_dy * force;
                velocity[idx].y += -norm_dx * force;
            }
        `,

        // Bloom extraction - extract bright pixels above threshold
        bloomExtract: `
            @group(0) @binding(0) var inputTexture: texture_2d<f32>;
            @group(0) @binding(1) var outputTexture: texture_storage_2d<rgba16float, write>;

            struct BloomParams {
                threshold: f32,
                intensity: f32,
            };
            @group(0) @binding(2) var<uniform> params: BloomParams;

            @compute @workgroup_size(8, 8)
            fn computeMain(@builtin(global_invocation_id) global_id: vec3u) {
                let texSize = textureDimensions(inputTexture);
                if (global_id.x >= texSize.x || global_id.y >= texSize.y) {
                    return;
                }

                let color = textureLoad(inputTexture, vec2<i32>(global_id.xy), 0);
                let brightness = dot(color.rgb, vec3<f32>(0.2126, 0.7152, 0.0722));

                // Extract bright pixels above threshold
                var bright = vec4<f32>(0.0);
                if (brightness > params.threshold) {
                    bright = color * ((brightness - params.threshold) / (1.0 - params.threshold));
                }

                textureStore(outputTexture, vec2<i32>(global_id.xy), bright);
            }
        `,

        // Bloom blur horizontal pass
        bloomBlurH: `
            @group(0) @binding(0) var inputTexture: texture_2d<f32>;
            @group(0) @binding(1) var outputTexture: texture_storage_2d<rgba16float, write>;

            @compute @workgroup_size(8, 8)
            fn computeMain(@builtin(global_invocation_id) global_id: vec3u) {
                let texSize = textureDimensions(inputTexture);
                if (global_id.x >= texSize.x || global_id.y >= texSize.y) {
                    return;
                }

                // 9-tap Gaussian blur
                let offsets = array<i32, 5>(-2, -1, 0, 1, 2);
                let weights = array<f32, 5>(0.06, 0.24, 0.40, 0.24, 0.06);

                var result = vec4<f32>(0.0);
                for (var i = 0; i < 5; i++) {
                    let offset = vec2<i32>(offsets[i], 0);
                    let samplePos = vec2<i32>(global_id.xy) + offset;
                    let clampedPos = clamp(samplePos, vec2<i32>(0), vec2<i32>(texSize) - vec2<i32>(1));
                    result += textureLoad(inputTexture, clampedPos, 0) * weights[i];
                }

                textureStore(outputTexture, vec2<i32>(global_id.xy), result);
            }
        `,

        // Bloom blur vertical pass
        bloomBlurV: `
            @group(0) @binding(0) var inputTexture: texture_2d<f32>;
            @group(0) @binding(1) var outputTexture: texture_storage_2d<rgba16float, write>;

            @compute @workgroup_size(8, 8)
            fn computeMain(@builtin(global_invocation_id) global_id: vec3u) {
                let texSize = textureDimensions(inputTexture);
                if (global_id.x >= texSize.x || global_id.y >= texSize.y) {
                    return;
                }

                // 9-tap Gaussian blur
                let offsets = array<i32, 5>(-2, -1, 0, 1, 2);
                let weights = array<f32, 5>(0.06, 0.24, 0.40, 0.24, 0.06);

                var result = vec4<f32>(0.0);
                for (var i = 0; i < 5; i++) {
                    let offset = vec2<i32>(0, offsets[i]);
                    let samplePos = vec2<i32>(global_id.xy) + offset;
                    let clampedPos = clamp(samplePos, vec2<i32>(0), vec2<i32>(texSize) - vec2<i32>(1));
                    result += textureLoad(inputTexture, clampedPos, 0) * weights[i];
                }

                textureStore(outputTexture, vec2<i32>(global_id.xy), result);
            }
        `,

        // Bloom composite - add bloom to original
        bloomComposite: `
            struct VertexInput {
                @location(0) position: vec2f,
                @location(1) uv: vec2f,
            };

            struct VertexOutput {
                @builtin(position) position: vec4f,
                @location(0) uv: vec2f,
            };

            @group(0) @binding(0) var originalTexture: texture_2d<f32>;
            @group(0) @binding(1) var bloomTexture: texture_2d<f32>;
            @group(0) @binding(2) var texSampler: sampler;

            struct BloomParams {
                threshold: f32,
                intensity: f32,
            };
            @group(0) @binding(3) var<uniform> params: BloomParams;

            @vertex
            fn vertexMain(input: VertexInput) -> VertexOutput {
                var output: VertexOutput;
                output.position = vec4f(input.position, 0, 1);
                output.uv = input.uv;
                return output;
            }

            @fragment
            fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
                let original = textureSample(originalTexture, texSampler, input.uv);
                let bloom = textureSample(bloomTexture, texSampler, input.uv);

                // Additive blend with intensity
                return original + bloom * params.intensity;
            }
        `,

        // Set obstacle - marks cells as solid (1.0) or fluid (0.0)
        setObstacle: `
            struct Uniforms {
                mouse: vec2f,
                grid_size: vec2f,
                diff: f32, visc: f32,
                N: f32, dt: f32, b: f32,
            };

            struct ObstacleSource {
                value: f32,  // 1.0 to place obstacle, 0.0 to remove
                radius: f32,
                padding: vec2f,
            };

            @group(0) @binding(0) var<uniform> uniforms: Uniforms;
            @group(0) @binding(1) var<storage, read_write> obstacles: array<vec4f>;
            @group(0) @binding(2) var<uniform> source: ObstacleSource;

            @compute @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
            fn computeMain(@builtin(global_invocation_id) global_id: vec3u) {
                var index = (global_id.x + 1) + u32(uniforms.grid_size.x) * (global_id.y + 1);
                if(length(vec2f(uniforms.mouse) - vec2f((vec2f(global_id.xy) + vec2f(1)))) < source.radius) {
                    obstacles[index].x = source.value;
                }
            }
        `
    };
}

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
                var index = IX(global_id.x+1, global_id.y+1);
                var color = stateIn[index];
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
                return buffer[index];
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

                if(u32(uniforms.b) == 0) {
                    if(i == 0) { arr[index] = arr[IX(1, j)]; }
                    if(i == u32(N + 1)) { arr[index] = arr[IX(N, j)]; }
                    if(j == 0) { arr[index] = arr[IX(i, 1)]; }
                    if(j == u32(N+1)) { arr[index] = arr[IX(i, N)]; }
                } else {
                    if(i == 0) {
                        arr[index] = arr[IX(1, j)];
                        arr[index].x *= -1;
                    }
                    if(i == u32(N + 1)) {
                        arr[index] = arr[IX(N, j)];
                        arr[index].x *= -1;
                    }
                    if(j == 0) {
                        arr[index] = arr[IX(i, 1)];
                        arr[index].y *= -1;
                    }
                    if(j == u32(N + 1)) {
                        arr[index] = arr[IX(i, N)];
                        arr[index].y *= -1;
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

            fn cellIndex(cell: vec2u, grid: vec2f) -> u32 {
                return (cell.y + 1) * u32(grid.x) + (cell.x + 1);
            }

            fn getColorNew(cell: vec2i) -> vec4f {
                var index = cellIndex(vec2u(cell), uniforms.grid_size);
                return x[index];
            }

            fn getColorPrev(cell: vec2i) -> vec4f {
                var index = cellIndex(vec2u(cell), uniforms.grid_size);
                return x0[index];
            }

            @compute @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
            fn computeMain(@builtin(global_invocation_id) global_id: vec3u) {
                var dt = uniforms.dt;
                var diff = uniforms.diffuse;
                var a = dt * diff * (uniforms.grid_size.x -2) * (uniforms.grid_size.x - 2);
                var index = cellIndex(global_id.xy, uniforms.grid_size.xy);
                var color = getColorPrev(vec2i(global_id.xy));
                color += a * (getColorNew(vec2i(global_id.xy) + vec2i( 0, 1)) +
                             getColorNew(vec2i(global_id.xy) + vec2i( 0,-1)) +
                             getColorNew(vec2i(global_id.xy) + vec2i( 1, 0)) +
                             getColorNew(vec2i(global_id.xy) + vec2i(-1, 0)));
                x[index] = color / (1 + 4 * a);
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

            fn IX(cell: vec2u) -> u32 {
                var grid = uniforms.grid_size;
                return (cell.y) * u32(grid.x) + (cell.x);
            }

            fn IXf(x: f32, y: f32) -> u32 {
                return IX(vec2u(u32(x), u32(y)));
            }

            @compute @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
            fn computeMain(@builtin(global_invocation_id) global_id: vec3u) {
                var dt = uniforms.dt;
                var N = uniforms.N;
                var grid = uniforms.grid_size;
                var index = IX(global_id.xy + vec2u(1));
                var dt0 = dt*N;
                var i = f32(global_id.x + 1);
                var j = f32(global_id.y + 1);

                var x = i-dt0*uv[IXf(i,j)].x;
                var y = j-dt0*uv[IXf(i,j)].y;

                if (x<0.5) { x=0.5; }
                if (x>N+0.5) { x=N+ 0.5; }
                var i0 = floor(x);
                var i1 = i0+1;

                if (y<0.5) {y=0.5;}
                if (y>N+0.5) {y=N+ 0.5;}
                var j0 = floor(y);
                var j1 = j0+1;

                var s1 = x-f32(i0);
                var s0 = 1-s1;
                var t1 = y-f32(j0);
                var t0 = 1-t1;

                d[IXf(i,j)] = s0*(t0*d0[IXf(i0,j0)]+t1*d0[IXf(i0,j1)])+
                              s1*(t0*d0[IXf(i1,j0)]+t1*d0[IXf(i1,j1)]);
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

            fn IX(x: u32, y: u32) -> u32 {
                var grid = uniforms.grid_size;
                return y * u32(grid.x) + x;
            }

            @compute @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
            fn computeMain(@builtin(global_invocation_id) global_id: vec3u) {
                var dt = uniforms.dt;
                var N = uniforms.N;
                var grid = uniforms.grid_size;
                var h = 1 / N;
                var i = global_id.x + 1;
                var j = global_id.y + 1;
                p_div[IX(i,j)].x = 0;
                p_div[IX(i,j)].y = -0.5*h*(uv[IX(i+1,j)].x-uv[IX(i-1,j)].x +
                                           uv[IX(i,j+1)].y-uv[IX(i,j-1)].y);
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

            fn IX(x: u32, y: u32) -> u32 {
                var grid = uniforms.grid_size;
                return y * u32(grid.x) + x;
            }

            @compute @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
            fn computeMain(@builtin(global_invocation_id) global_id: vec3u) {
                var dt = uniforms.dt;
                var N = uniforms.N;
                var grid = uniforms.grid_size;
                var h = 1 / N;
                var i = global_id.x + 1;
                var j = global_id.y + 1;
                p_div[IX(i,j)].x = (p_div[IX(i,j)].y+p_div[IX(i-1,j)].x+p_div[IX(i+1,j)].x+
                                   p_div[IX(i,j-1)].x+p_div[IX(i,j+1)].x)/4;
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

            fn IX(x: u32, y: u32) -> u32 {
                var grid = uniforms.grid_size;
                return y * u32(grid.x) + x;
            }

            @compute @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
            fn computeMain(@builtin(global_invocation_id) global_id: vec3u) {
                var dt = uniforms.dt;
                var N = uniforms.N;
                var grid = uniforms.grid_size;
                var h = 1 / N;
                var i = global_id.x + 1;
                var j = global_id.y + 1;
                uv[IX(i,j)].x -= 1.0*(p_div[IX(i+1,j)].x-p_div[IX(i-1,j)].x)/h;
                uv[IX(i,j)].y -= 1.0*(p_div[IX(i,j+1)].x-p_div[IX(i,j-1)].x)/h;
            }
        `
    };
}

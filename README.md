# WebGPU Fluid Simulation

A GPU-accelerated implementation of Jos Stam's stable fluids algorithm using WebGPU compute shaders.

**[Live Demo](https://mikerkoval.github.io/FluidSimulation/)**

## Overview

This project implements the fluid dynamics algorithm from Jos Stam's "Real-Time Fluid Dynamics for Games" (GDC 2003). The entire simulation runs on the GPU using WebGPU compute shaders written in WGSL.

**Key Features:**
- Real-time fluid simulation with mouse interaction
- Fully GPU-accelerated using WebGPU compute shaders
- Configurable parameters (viscosity, diffusion, grid resolution)
- Interactive controls and visual feedback

## Getting Started

### Prerequisites
- Browser with WebGPU support (Chrome 113+, Edge 113+)
- Local web server for ES6 modules

### Running Locally

```bash
# Clone and navigate to directory
git clone <repository-url>
cd FluidSimulation

# Start a local server
python3 -m http.server 8000

# Open http://localhost:8000 in your browser
```

## Usage

- **Mouse**: Drag to inject velocity and density
- **Keyboard**:
  - `P` - Pause/Resume
  - `A` - Toggle texture rendering
  - `S` - Switch display mode (density/velocity)

## Technical Details

**Architecture:**
- Modular code structure with separation of concerns
- Ping-pong buffer pattern for stable computation
- WGSL compute shaders for all simulation steps

**Algorithm:**
Implements Stam's stable fluids with velocity step (add source → diffuse → project → advect → project) and density step (add source → diffuse → advect).

## Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome/Edge 113+ | ✅ Full |
| Firefox Nightly | 🚧 Experimental |
| Safari TP 185+ | 🚧 Experimental |

## Reference

Stam, Jos. "Real-Time Fluid Dynamics for Games." *GDC 2003*. [[PDF]](https://www.dgp.toronto.edu/public_user/stam/reality/Research/pdf/GDC03.pdf)

## License

MIT

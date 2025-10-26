#!/usr/bin/env python3
"""
Script to update fluidSimulation.js to use cached bind groups instead of creating them every frame.
This will significantly improve performance by eliminating bind group creation overhead.
"""

import re

# Read the file
with open('/home/mike/projects/FluidSimulation/fluidSimulation.js', 'r') as f:
    content = f.read()

# The methods need to figure out which buffer index to use, then use cached bind groups
# For addSource - it's called with specific buffers, need to detect which combination
# For setBoundary - need to detect which buffer
# etc.

# This is complex because we need to know buffer indices at runtime
# Let's use a simpler approach - just update the most frequently called ones

# Simple replacements for static bind groups (drawTexture, bloom)

# drawTexture - completely static
old_draw_texture = '''    drawTexture() {
        const bindGroup = this.device.createBindGroup({
            label: "Draw texture bind group",
            layout: this.pipelines.drawTexture.layout,
            entries: [
                { binding: 0, resource: { buffer: this.buffers.uniformBuffer } },
                { binding: 1, resource: this.texture.createView() },
                { binding: 2, resource: this.sampler }
            ]
        });

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
        pass.setBindGroup(0, bindGroup);
        pass.draw(6, 1);
        pass.end();

        this.device.queue.submit([encoder.finish()]);
    }'''

new_draw_texture = '''    drawTexture() {
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
    }'''

content = content.replace(old_draw_texture, new_draw_texture)

# Update applyBloom to use cached bind groups
content = re.sub(
    r'const extractBindGroup = this\.device\.createBindGroup\(\{[^}]+label: "Bloom extract bind group",[^}]+\}\);',
    '',
    content
)
content = re.sub(
    r'computePass\.setBindGroup\(0, extractBindGroup\);',
    'computePass.setBindGroup(0, this.bindGroups.bloomExtract);',
    content
)

content = re.sub(
    r'const blurHBindGroup = this\.device\.createBindGroup\(\{[^}]+label: "Bloom blur H bind group",[^}]+\}\);',
    '',
    content
)
content = re.sub(
    r'computePass\.setBindGroup\(0, blurHBindGroup\);',
    'computePass.setBindGroup(0, this.bindGroups.bloomBlurH);',
    content
)

content = re.sub(
    r'const blurVBindGroup = this\.device\.createBindGroup\(\{[^}]+label: "Bloom blur V bind group",[^}]+\}\);',
    '',
    content
)
content = re.sub(
    r'computePass\.setBindGroup\(0, blurVBindGroup\);',
    'computePass.setBindGroup(0, this.bindGroups.bloomBlurV);',
    content
)

content = re.sub(
    r'const compositeBindGroup = this\.device\.createBindGroup\(\{[^}]+label: "Bloom composite bind group",[^}]+\}\);',
    '',
    content
)
content = re.sub(
    r'pass\.setBindGroup\(0, compositeBindGroup\);',
    'pass.setBindGroup(0, this.bindGroups.bloomComposite);',
    content
)

# Write back
with open('/home/mike/projects/FluidSimulation/fluidSimulation.js', 'w') as f:
    f.write(content)

print("Updated fluidSimulation.js to use cached bind groups")
print("- drawTexture: using cached bind group")
print("- applyBloom: using 4 cached bind groups (extract, blurH, blurV, composite)")

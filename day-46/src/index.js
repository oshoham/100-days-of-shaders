const canvas = document.getElementById('regl-canvas')
const regl = require('regl')({ canvas: canvas, extensions: ['OES_texture_float'] })
const mouse = require('mouse-change')()
const dat = require('dat.gui')

// reference: https://bl.ocks.org/pbeshai/dbed2fdac94b44d3b4573624a37fa9db
// reference2: https://bl.ocks.org/pbeshai/98c08d22c922688acff852d35b70e4d2

const updateFlowFieldFragmentShader = require('./update-flow-field.frag')
const updateFlowFieldVertexShader = require('./update-flow-field.vert')
const drawFlowFieldFragmentShader = require('./draw-flow-field.frag')

const updateAccelerationFragmentShader = require('./update-acceleration.frag')
const updateParticlesFragmentShader = require('./update-particles.frag')
const setParticleCoordinatesShader = require('./set-particle-coordinates.vert')
const drawParticlesFragmentShader = require('./draw-particles.frag')
const drawParticlesVertexShader = require('./draw-particles.vert')

const constrain = (n, low, high) => Math.max(Math.min(n, high), low)

const map = (n, start1, stop1, start2, stop2, withinBounds) => {
  let newval = (n - start1) / (stop1 - start1) * (stop2 - start2) + start2
  if (!withinBounds) {
    return newval
  }
  if (start2 < stop2) {
    return constrain(newval, start2, stop2)
  } else {
    return constrain(newval, stop2, start2)
  }
}

const normalize = vector => {
  const magnitude = Math.sqrt(Math.pow(vector[0], 2) + Math.pow(vector[1], 2))
  vector[0] /= magnitude
  vector[1] /= magnitude
  return vector
}

// create the flow map
const sqrtFlowDataLength = 4
const numFlowData = sqrtFlowDataLength * sqrtFlowDataLength
let flowData = []

// generate a mesh for a grid
function makeGridMesh(numCols, numRows) {
  // at this point, we are going to create a grid mesh so we can interpolate
  // between the values of our flow so they smoothly merge into one another.
  // if you uncomment drawFlowBuffer() in the regl.frame code way below
  // you can see what the flow buffer looks like.

  // create vertices for each flow data point
  const vertices = Array(numFlowData).fill(0).map((v, i) => [
    map(i % numCols, 0, numCols - 1, -1, 1),
    map(Math.floor(i / numRows), 0, numRows - 1, 1, -1)
  ])

  // helper to find an index in the flat array based on row an doclumn
  const indexAtColRow = (col, row) => col + (row * numCols)

  // create the faces for the mesh (two triangles form a grid cell)
  const faces = vertices.reduce((acc, vertex, i) => {
    const col = i % numCols
    const row = Math.floor(i / numCols)

    if (col + 1 < numCols && row + 1 < numRows) {
      const topLeftTriangle = [i, i + 1, indexAtColRow(col, row + 1)]
      acc.push(topLeftTriangle)
    }

    if (col + 1 < numCols && row - 1 >= 0) {
      const bottomLeftTriangle = [i, i + 1, indexAtColRow(col + 1, row - 1)]
      acc.push(bottomLeftTriangle)
    }

    return acc
  }, [])

  return { positions: vertices, cells: faces }
}
const gridMesh = makeGridMesh(sqrtFlowDataLength, sqrtFlowDataLength)

const generateFlowData = () => Array(numFlowData).fill(0).map(() => {
  return normalize([
    Math.random() * 2 - 1, // column
    Math.random() * 2 - 1, // row
    3 * Math.random(), // magnitude
  ])
})

const upscaleAmount = sqrtFlowDataLength * 16
const flowField = regl.framebuffer({
  color: regl.texture({
    radius: upscaleAmount,
    data: Array(upscaleAmount * upscaleAmount * 4).fill(0),
    type: 'float'
  }),
  depthStencil: false
})

const updateFlowField = regl({
  frag: updateFlowFieldFragmentShader,
  vert: updateFlowFieldVertexShader,
  attributes: {
    a_position: gridMesh.positions,
    a_flow_data: regl.prop('flowData')
  },
  elements: gridMesh.cells,
  framebuffer: regl.prop('framebuffer')
})

const drawFlowField = regl({
  frag: drawFlowFieldFragmentShader,
  vert: setParticleCoordinatesShader,
  attributes: {
    a_texcoord: [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0],
    a_position: [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0],
  },
  uniforms: {
    u_flow_field: regl.prop('flowField')
  },
  count: 6
})

const updateAcceleration = regl({
  frag: updateAccelerationFragmentShader,
  vert: setParticleCoordinatesShader,
  attributes: {
    a_texcoord: [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0],
    a_position: [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]
  },
  context: {
    boundingRect: () => canvas ? canvas.getBoundingClientRect() : document.body.getBoundingClientRect()
  },
  uniforms: {
    u_speed: regl.prop('speed'),
    u_friction: regl.prop('friction'),
    u_flow_field: regl.prop('flowField'),
    u_particle_position: regl.prop('particlePosition'),
    u_resolution: ({ drawingBufferWidth, drawingBufferHeight }) => [
      drawingBufferWidth,
      drawingBufferHeight
    ],
    u_mouse: ({ boundingRect, drawingBufferWidth, drawingBufferHeight }) => {
      let mouseX
      if (mouse.x <= boundingRect.left) {
        mouseX = 0
      } else if (mouse.x > boundingRect.right) {
        mouseX = drawingBufferWidth
      } else {
        mouseX = mouse.x - boundingRect.left
      }

      let mouseY
      if (mouse.y >= boundingRect.bottom) {
        mouseY = 0
      } else if (mouse.y < boundingRect.top) {
        mouseY = drawingBufferHeight
      } else {
        mouseY = drawingBufferHeight - (mouse.y - boundingRect.top)
      }

      return [mouseX, mouseY]
    }
  },
  depth: { enable: false },
  count: 6,
  primitive: 'triangles',
  framebuffer: regl.prop('framebuffer')
})

const updateParticles = regl({
  frag: updateParticlesFragmentShader,
  vert: setParticleCoordinatesShader,
  attributes: {
    a_texcoord: [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0],
    a_position: [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]
  },
  uniforms: {
    u_speed: regl.prop('speed'),
    u_particle_state: regl.prop('particleState'),
    u_acceleration: regl.prop('acceleration')
  },
  depth: { enable: false },
  count: 6,
  primitive: 'triangles',
  framebuffer: regl.prop('framebuffer')
})

const drawParticles = regl({
  frag: drawParticlesFragmentShader,
  vert: drawParticlesVertexShader,
  attributes: {
    a_particle_coordinates: regl.prop('particleCoordinates')
  },
  context: {
    boundingRect: () => canvas ? canvas.getBoundingClientRect() : document.body.getBoundingClientRect()
  },
  uniforms: {
    u_point_width: 3,
    u_particle_state: regl.prop('particleState'),
    u_time: regl.context('time'),
    u_resolution: ({ drawingBufferWidth, drawingBufferHeight }) => [
      drawingBufferWidth,
      drawingBufferHeight
    ],
    u_mouse: ({ boundingRect, drawingBufferWidth, drawingBufferHeight }) => {
      let mouseX
      if (mouse.x <= boundingRect.left) {
        mouseX = 0
      } else if (mouse.x > boundingRect.right) {
        mouseX = drawingBufferWidth
      } else {
        mouseX = mouse.x - boundingRect.left
      }

      let mouseY
      if (mouse.y >= boundingRect.bottom) {
        mouseY = 0
      } else if (mouse.y < boundingRect.top) {
        mouseY = drawingBufferHeight
      } else {
        mouseY = drawingBufferHeight - (mouse.y - boundingRect.top)
      }

      return [mouseX, mouseY]
    }
  },
  depth: { enable: false },
  count: regl.prop('count'),
  primitive: 'points'
})

let particleState
let accelerationBuffer
let particleCoordinates

const initialConditionsLookupTable = {
  32: Array(32 * 32 * 4).fill(0).map((v, i) => ((i + 3) % 4 === 0 || (i + 4) % 4 === 0) ? 2 * Math.random() - 1 : 0.0),
  64: Array(64 * 64 * 4).fill(0).map((v, i) => ((i + 3) % 4 === 0 || (i + 4) % 4 === 0) ? 2 * Math.random() - 1 : 0.0),
  128: Array(128 * 128 * 4).fill(0).map((v, i) => ((i + 3) % 4 === 0 || (i + 4) % 4 === 0) ? 2 * Math.random() - 1 : 0.0),
  256: Array(256 * 256 * 4).fill(0).map((v, i) => ((i + 3) % 4 === 0 || (i + 4) % 4 === 0) ? 2 * Math.random() - 1 : 0.0),
}

const particleCoordinatesLookupTable = {}
for (let n of [32, 64, 128, 256]) {
  particleCoordinatesLookupTable[n] = []
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      particleCoordinatesLookupTable[n].push(i / n, j / n)
    }
  }
}

const init = sqrtNumParticles => {
  const initialConditions = initialConditionsLookupTable[sqrtNumParticles]
  particleCoordinates = particleCoordinatesLookupTable[sqrtNumParticles]

  particleState = Array(3).fill().map(() => regl.framebuffer({
    color: regl.texture({
      radius: sqrtNumParticles,
      data: initialConditions,
      type: 'float'
    }),
    depthStencil: false
  }))

  accelerationBuffer = regl.framebuffer({
    color: regl.texture({
      radius: sqrtNumParticles,
      data: Array(sqrtNumParticles * sqrtNumParticles * 4).fill(0),
      type: 'float'
    }),
    depthStencil: false
  })

  flowData = generateFlowData()
  updateFlowField({
    flowData: flowData,
    framebuffer: flowField
  })
}

const gui = new dat.default.GUI()
gui.domElement.id = 'gui'
const parameters = {
  acceleration: 1,
  friction: 0.01,
  sqrtNumParticles: 128,
  showFlowField: false,
  reset: () => init(parameters.sqrtNumParticles)
}
gui.add(parameters, 'acceleration', 0.0, 1000.0).step(1)
gui.add(parameters, 'friction', 0.0, 1.0).step(0.01)
gui.add(parameters, 'sqrtNumParticles', { 32: 32, 64: 64, 128: 128, 256: 256 })
gui.add(parameters, 'showFlowField')
gui.add(parameters, 'reset')

let sqrtNumParticles = parameters.sqrtNumParticles
init(sqrtNumParticles)

regl.frame(({ tick }) => {
  const currentSqrtNumParticles = parseInt(parameters.sqrtNumParticles)
  if (sqrtNumParticles != currentSqrtNumParticles) {
    init(currentSqrtNumParticles)
    sqrtNumParticles = currentSqrtNumParticles
  }

  regl.clear({ color: [0, 0, 0, 1] })

  if (parameters.showFlowField) {
    drawFlowField({ flowField: flowField })
  }

  updateAcceleration({
    flowField: flowField,
    speed: parameters.acceleration,
    friction: parameters.friction,
    particlePosition: particleState[tick % 2],
    framebuffer: accelerationBuffer
  })

  updateParticles({
    speed: parameters.speed,
    acceleration: accelerationBuffer,
    particleState: particleState[tick % 2],
    framebuffer: particleState[(tick + 1) % 2]
  })

  drawParticles({
    particleCoordinates: particleCoordinates,
    particleState: particleState[(tick + 1) % 2],
    count: currentSqrtNumParticles * currentSqrtNumParticles
  })
  regl.clear({ color: [0, 0, 0, 1], framebuffer: accelerationBuffer })
})

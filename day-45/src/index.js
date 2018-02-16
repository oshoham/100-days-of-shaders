const canvas = document.getElementById('regl-canvas')
const regl = require('regl')({ canvas: canvas, extensions: ['OES_texture_float'] })
const mouse = require('mouse-change')()
const dat = require('dat.gui')

// reference: https://bl.ocks.org/pbeshai/dbed2fdac94b44d3b4573624a37fa9db

const drawParticlesFragmentShader = require('./draw-particles.frag')
const drawParticlesVertexShader = require('./draw-particles.vert')
const updateParticlesFragmentShader = require('./update-particles.frag')
const updateParticlesVertexShader = require('./update-particles.vert')

let particleState
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
}

const updateParticles = regl({
  frag: updateParticlesFragmentShader,
  vert: updateParticlesVertexShader,
  attributes: {
    a_texcoord: [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0],
    a_position: [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]
  },
  uniforms: {
    u_speed: regl.prop('speed'),
    u_current_particle_state: regl.prop('currentParticleState'),
    u_previous_particle_state: regl.prop('previousParticleState')
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

const gui = new dat.default.GUI()
gui.domElement.id = 'gui'
const parameters = {
  speed: 0.005,
  sqrtNumParticles: 128,
  reset: () => init(parameters.sqrtNumParticles)
}
gui.add(parameters, 'speed', 0.0001, 0.05).step(0.0001)
gui.add(parameters, 'sqrtNumParticles', { 32: 32, 64: 64, 128: 128, 256: 256 })
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

  updateParticles({
    speed: parameters.speed,
    previousParticleState: particleState[tick % 3],
    currentParticleState: particleState[(tick + 1) % 3],
    framebuffer: particleState[(tick + 2) % 3]
  })

  drawParticles({
    particleCoordinates: particleCoordinates,
    particleState: particleState[(tick + 2) % 3],
    count: currentSqrtNumParticles * currentSqrtNumParticles
  })
})

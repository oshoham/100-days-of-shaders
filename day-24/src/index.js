const canvas = document.getElementById('regl-canvas')
const regl = require('regl')({ canvas: canvas, extensions: ['OES_texture_float'] })
const resl = require('resl')
const mouse = require('mouse-change')()
const CCapture = require('ccapture.js')

const fragmentShader = require('./shader.frag')
const initVelocityShader = require('./init-velocity.frag')
const initColorShader = require('./init-color.frag')
const advectShader = require('./advect.frag')
const divergenceShader = require('./divergence.frag')
const jacobiPressureShader = require('./jacobi.frag')
const gradientShader = require('./gradient.frag')
const opticalFlowShader = require('./optical-flow.frag')
const copyShader = require('./copy.frag')
const vertexShader = require('./shader.vert')

const capturer = new CCapture( { format: 'webm', timeLimit: 60 } )

const RADIUS = 640
const DELTA_T = 1 / 60
const VELOCITY_DISSIPATION = 1.0
const GRID_SCALE = 1.0
const NUM_JACBOBI_ITERATIONS = 10

const previousFrame = regl.framebuffer({
  color: regl.texture({
    radius: RADIUS,
    data: (Array(RADIUS * RADIUS * 4)).fill(0)
  }),
  depthStencil: false
})

const opticalFlow = regl.framebuffer({
  color: regl.texture({
    radius: RADIUS,
    data: (Array(RADIUS * RADIUS * 4)).fill(0.0),
    type: 'float'
  }),
  depthStencil: false
})

const velocityState = Array(2).fill().map(() => regl.framebuffer({
  color: regl.texture({
    radius: RADIUS,
    data: (Array(RADIUS * RADIUS * 4)).fill(0.0),
    type: 'float'
  }),
  depthStencil: false
}))

const colorState = Array(2).fill().map(() => regl.framebuffer({
  color: regl.texture({
    radius: RADIUS,
    data: (Array(RADIUS * RADIUS * 4)).fill(0.0),
    type: 'float'
  }),
  depthStencil: false
}))

const pressureState = Array(2).fill().map(() => regl.framebuffer({
  color: regl.texture({
    radius: RADIUS,
    data: (Array(RADIUS * RADIUS * 4)).fill(0.0),
    type: 'float'
  }),
  depthStencil: false
}))

const divergenceBuffer = regl.framebuffer({
  color: regl.texture({
    radius: RADIUS,
    data: (Array(RADIUS * RADIUS * 4)).fill(0.0),
    type: 'float'
  }),
  depthStencil: false
})

const setupQuad = regl({
  vert: vertexShader,
  attributes: {
    a_texcoord: [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0],
    a_position: [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]
  },
  context: {
    boundingRect: () => canvas ? canvas.getBoundingClientRect() : document.body.getBoundingClientRect()
  },
  depth: { enable: false },
  count: 6,
  primitive: 'triangles'
})

const initBuffer = regl({
  frag: regl.prop('shader'),
  uniforms: {
    u_resolution: ({ drawingBufferWidth, drawingBufferHeight }) => [drawingBufferWidth, drawingBufferHeight],
  },
  framebuffer: regl.prop('buffer')
})

const advect = regl({
  frag: advectShader,
  uniforms: {
    u_resolution: ({ drawingBufferWidth, drawingBufferHeight }) => [drawingBufferWidth, drawingBufferHeight],
    u_delta_t: () => DELTA_T,
    u_dissipation: () => Math.pow(VELOCITY_DISSIPATION, 0.05),
    u_rdx: () => 1.0 / GRID_SCALE,
    u_velocity: regl.prop('velocity'),// ,
    u_source: regl.prop('source') //({ tick }) => velocityState[tick % 2]
  },
  framebuffer: regl.prop('buffer') //({ tick }) => velocityState[(tick + 1) % 2]
})

const divergence = regl({
  frag: divergenceShader,
  uniforms: {
    u_resolution: ({ drawingBufferWidth, drawingBufferHeight }) => [drawingBufferWidth, drawingBufferHeight],
    u_half_rdx: 0.5 / GRID_SCALE,
    u_velocity: ({ tick }) => velocityState[(tick + 1) % 2],
  },
  framebuffer: divergenceBuffer
})

const jacobiPressure = regl({
  frag: jacobiPressureShader,
  uniforms: {
    u_resolution: ({ drawingBufferWidth, drawingBufferHeight }) => [drawingBufferWidth, drawingBufferHeight],
    u_alpha: -(GRID_SCALE * GRID_SCALE),
    u_r_beta: 0.25,
    u_divergence: divergenceBuffer,
    u_pressure: regl.prop('pressure')
  },
  framebuffer: regl.prop('framebuffer')
})

const gradient = regl({
  frag: gradientShader,
  vert: vertexShader,
  attributes: {
    a_texcoord: [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0],
    a_position: [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]
  },
  uniforms: {
    u_resolution: ({ drawingBufferWidth, drawingBufferHeight }) => [drawingBufferWidth, drawingBufferHeight],
    u_half_rdx: 0.5 / GRID_SCALE,
    u_velocity: ({ tick }) => velocityState[(tick + 1) % 2],
    u_pressure: regl.prop('pressure')
  },
  depth: { enable: false },
  count: 6,
  primitive: 'triangles',
  framebuffer: ({ tick }) => velocityState[tick % 2]
})

const computeOpticalFlow = regl({
  frag: opticalFlowShader,
  uniforms: {
    u_resolution: ({ drawingBufferWidth, drawingBufferHeight }) => [drawingBufferWidth, drawingBufferHeight],
    u_previous_frame: previousFrame,
    u_current_frame: regl.prop('currentFrame')
  },
  framebuffer: opticalFlow
})

const renderVideoFrameToBuffer = regl({
  frag: copyShader,
  uniforms: {
    u_resolution: ({ drawingBufferWidth, drawingBufferHeight }) => [drawingBufferWidth, drawingBufferHeight],
    u_current_frame: regl.prop('currentFrame')
  },
  framebuffer: previousFrame
})

const draw = regl({
  frag: fragmentShader,
  uniforms: {
    u_time: regl.context('time'),
    u_resolution: ({ drawingBufferWidth, drawingBufferHeight }) => [drawingBufferWidth, drawingBufferHeight],
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
    },
    u_current_frame: regl.prop('currentFrame'),
    u_flow: opticalFlow
  }
})

window.navigator.mediaDevices.getUserMedia({
  audio: false,
  video: {
    aspectRatio: 1.0
  }
}).then(function(stream) {
  resl({
    manifest: {
      video: {
        type: 'video',
        src: window.URL.createObjectURL(stream),
        stream: true
      }
    },

    onDone: ({ video }) => {
      video.autoplay = true
      video.loop = true
      video.play()

      setupQuad(() => {
        regl.clear({ color: [0, 0, 0, 1], framebuffer: pressureState[0] })
        regl.clear({ color: [0, 0, 0, 1], framebuffer: pressureState[1] })

        // regl.clear({ color: [0, 0, 0, 1], framebuffer: velocityState[1] })
        // regl.clear({ color: [0, 0, 0, 1], framebuffer: colorState[1] })

        velocityState.forEach(velocityBuffer => initBuffer({ shader: initVelocityShader, buffer: velocityBuffer }))
        colorState.forEach(colorBuffer => initBuffer({ shader: initColorShader, buffer: colorBuffer }))
      })

      const texture = regl.texture(video)
      regl.frame(({ tick }) => {
        setupQuad(() => {
          // do other stuff every frame
          // const currentFrame = texture.subimage(video)

          // draw the shaders
          // computeOpticalFlow({ currentFrame: currentFrame })

          const currentTick = tick % 2
          const nextTick = (tick + 1) % 2

          advect({
            velocity: velocityState[currentTick],
            source: velocityState[currentTick],
            buffer: velocityState[nextTick]
          })

          // divergence()

          // let pressureIndex = 0
          // regl.clear({ color: [0, 0, 0, 1], framebuffer: pressureState[pressureIndex] })
          // for (let i = 0; i < NUM_JACBOBI_ITERATIONS; i++) {
          //   jacobiPressure({
          //     framebuffer: pressureState[(pressureIndex + 1) % 2],
          //     pressure: pressureState[pressureIndex % 2]
          //   })
          //   pressureIndex++
          // }

          // gradient({ pressure: pressureState[pressureIndex % 2] })

          // advect({
          //   velocity: velocityState[currentTick],
          //   source: colorState[currentTick],
          //   buffer: colorState[nextTick]
          // })

          draw({ currentFrame: velocityState[currentTick] })

          // renderVideoFrameToBuffer({ currentFrame: currentFrame })

          // record frame for video
          // capturer.capture(canvas)
        })
      })

      // capturer.start()
    }
  })
})

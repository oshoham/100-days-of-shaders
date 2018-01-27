const canvas = document.getElementById('regl-canvas')
const regl = require('regl')({ canvas: canvas, extensions: ['OES_texture_float'] })
const resl = require('resl')
const mouse = require('mouse-change')()
const CCapture = require('ccapture.js')

const fragmentShader = require('./shader.frag')
const initVelocityShader = require('./init-velocity.frag')
const initColorShader = require('./init-color.frag')
const advectShader = require('./advect.frag')
const applyFlowShader = require('./apply-flow.frag')
const divergenceShader = require('./divergence.frag')
const jacobiPressureShader = require('./jacobi.frag')
const gradientShader = require('./gradient.frag')
const opticalFlowShader = require('./optical-flow.frag')
const copyShader = require('./copy.frag')
const vertexShader = require('./shader.vert')

const capturer = new CCapture( { format: 'webm', timeLimit: 60, framerate: 60 } )

const RADIUS = 512
const TIMESTEP = 1 / 120.0
const VELOCITY_DISSIPATION = 1.0
const GRID_SCALE = 1.0
const NUM_JACBOBI_ITERATIONS = 20

const APPLY_FLOW = true
const ADVECT_VELOCITY = true
const APPLY_PRESSURE = true

const INITIAL_CONDITIONS = (Array(RADIUS * RADIUS * 4)).fill(0).map((v, i) => (i + 1) % 4 === 0 ? 1 : 0)

const previousFrame = regl.framebuffer({
  color: regl.texture({
    radius: RADIUS,
    data: INITIAL_CONDITIONS
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
    data: INITIAL_CONDITIONS,
    type: 'float',
    wrap: 'clamp'
  }),
  depthStencil: false
}))

const colorState = Array(2).fill().map(() => regl.framebuffer({
  color: regl.texture({
    radius: RADIUS,
    data: INITIAL_CONDITIONS,
    type: 'float',
    wrap: 'clamp'
  }),
  depthStencil: false
}))

const pressureState = Array(2).fill().map(() => regl.framebuffer({
  color: regl.texture({
    radius: RADIUS,
    data: INITIAL_CONDITIONS,
    type: 'float',
    wrap: 'clamp'
  }),
  depthStencil: false
}))

const divergenceBuffer = regl.framebuffer({
  color: regl.texture({
    radius: RADIUS,
    data: INITIAL_CONDITIONS,
    type: 'float',
    wrap: 'clamp'
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
    u_timestep: () => TIMESTEP,
    u_dissipation: () => Math.pow(VELOCITY_DISSIPATION, 0.05),
    u_reciprocal_grid_scale: () => 1.0 / GRID_SCALE,
    u_velocity: regl.prop('velocity'),// ,
    u_source: regl.prop('source') //({ tick }) => velocityState[tick % 2]
  },
  framebuffer: regl.prop('buffer') //({ tick }) => velocityState[(tick + 1) % 2]
})

const applyFlow = regl({
  frag: applyFlowShader,
  uniforms: {
    u_resolution: ({ drawingBufferWidth, drawingBufferHeight }) => [drawingBufferWidth, drawingBufferHeight],
    u_flow_scale: () => 0.1,
    u_velocity: regl.prop('velocity'),
    u_flow: regl.prop('flow')
  },
  framebuffer: regl.prop('buffer')
})

const divergence = regl({
  frag: divergenceShader,
  uniforms: {
    u_resolution: ({ drawingBufferWidth, drawingBufferHeight }) => [drawingBufferWidth, drawingBufferHeight],
    u_half_reciprocal_grid_scale: () => 0.5 / GRID_SCALE,
    u_velocity: regl.prop('velocity'),
  },
  framebuffer: regl.prop('buffer')
})

const jacobiPressure = regl({
  frag: jacobiPressureShader,
  uniforms: {
    u_resolution: ({ drawingBufferWidth, drawingBufferHeight }) => [drawingBufferWidth, drawingBufferHeight],
    u_alpha: () => -(GRID_SCALE * GRID_SCALE),
    u_inverse_beta: 0.25,
    u_divergence: regl.prop('divergence'),
    u_pressure: regl.prop('pressure')
  },
  framebuffer: regl.prop('buffer')
})

const subtractGradient = regl({
  frag: gradientShader,
  vert: vertexShader,
  attributes: {
    a_texcoord: [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0],
    a_position: [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]
  },
  uniforms: {
    u_resolution: ({ drawingBufferWidth, drawingBufferHeight }) => [drawingBufferWidth, drawingBufferHeight],
    u_reciprocal_grid_scale: () => 1.0 / GRID_SCALE,
    u_velocity: regl.prop('velocity'),
    u_pressure: regl.prop('pressure')
  },
  depth: { enable: false },
  count: 6,
  primitive: 'triangles',
  framebuffer: regl.prop('buffer')
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
        for (let pressureBuffer of pressureState) {
          regl.clear({ color: [0, 0, 0, 1], framebuffer: pressureBuffer })
        }
        for (let velocityBuffer of velocityState) {
          initBuffer({ shader: initVelocityShader, buffer: velocityBuffer })
        }
        for (let colorBuffer of colorState) {
          initBuffer({ shader: initColorShader, buffer: colorBuffer })
        }
      })

      let velocitySourceIndex = 0
      let velocityDestinationIndex = 1

      let pressureSourceIndex = 0
      let pressureDestinationIndex = 1

      const texture = regl.texture(video)
      regl.frame(({ tick }) => {
        setupQuad(() => {
          // do other stuff every frame
          const currentFrame = texture.subimage(video)

          // draw the shaders
          computeOpticalFlow({ currentFrame: currentFrame })

          if (ADVECT_VELOCITY) {
            advect({
              velocity: velocityState[velocitySourceIndex],
              source: velocityState[velocitySourceIndex],
              buffer: velocityState[velocityDestinationIndex]
            })
            // swap
            velocitySourceIndex = velocityDestinationIndex + (velocityDestinationIndex=velocitySourceIndex, 0)
          }


          if (APPLY_FLOW) {
            applyFlow({
              velocity: velocityState[velocitySourceIndex],
              flow: opticalFlow,
              buffer: velocityState[velocityDestinationIndex]
            })
            // swap
            velocitySourceIndex = velocityDestinationIndex + (velocityDestinationIndex=velocitySourceIndex, 0)
          }

          if (APPLY_PRESSURE) {
            divergence({
              velocity: velocityState[velocitySourceIndex],
              buffer: divergenceBuffer
            })

            for (let i = 0; i < NUM_JACBOBI_ITERATIONS; i++) {
              jacobiPressure({
                divergence: divergenceBuffer,
                pressure: pressureState[pressureSourceIndex],
                buffer: pressureState[pressureDestinationIndex]
              })
              pressureSourceIndex = pressureDestinationIndex + (pressureDestinationIndex=pressureSourceIndex, 0)
            }

            subtractGradient({
              pressure: pressureState[pressureSourceIndex],
              velocity: velocityState[velocitySourceIndex],
              buffer: velocityState[velocityDestinationIndex]
            })
            // swap
            velocitySourceIndex = velocityDestinationIndex + (velocityDestinationIndex=velocitySourceIndex, 0)
          }

          advect({
            velocity: velocityState[velocitySourceIndex],
            source: colorState[tick % 2],
            buffer: colorState[(tick + 1) % 2]
          })

          draw({ currentFrame: colorState[(tick + 1) % 2] })
          // draw({ currentFrame: opticalFlow })

          renderVideoFrameToBuffer({ currentFrame: currentFrame })

          // record frame for video
          // capturer.capture(canvas)
        })
      })

      // capturer.start()
    }
  })
})

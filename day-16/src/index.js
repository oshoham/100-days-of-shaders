const canvas = document.getElementById('regl-canvas')
const regl = require('regl')(canvas)
const mouse = require('mouse-change')()
const CCapture = require('ccapture.js')

const fragmentShader = require('./shader.frag')
const edgeDetectionShader = require('./edge-detection.frag')
const vertexShader = require('./shader.vert')

const capturer = new CCapture( { format: 'webm', timeLimit: 60 } )

const RADIUS = 640

const buffer = regl.framebuffer({
  color: regl.texture({
    radius: RADIUS,
    data: (Array(RADIUS * RADIUS * 4)).fill(0)
  }),
  depthStencil: false
})

const renderToBuffer = regl({
  frag: fragmentShader,
  vert: vertexShader,
  attributes: {
    a_texcoord: [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0],
    a_position: [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]
  },
  context: {
    boundingRect: () => canvas ? canvas.getBoundingClientRect() : document.body.getBoundingClientRect()
  },
  uniforms: {
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
  count: 6,
  framebuffer: buffer
})

const draw = regl({
  frag: edgeDetectionShader,
  vert: vertexShader,
  attributes: {
    a_texcoord: [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0],
    a_position: [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]
  },
  uniforms: {
    u_resolution: ({ drawingBufferWidth, drawingBufferHeight }) => [
      drawingBufferWidth,
      drawingBufferHeight
    ],
    u_frame: buffer
  },
  depth: { enable: false },
  count: 6,
  primitive: 'triangles'
})

regl.frame(context => {
  // do other stuff every frame

  // draw the shaders
  renderToBuffer()
  draw()

  // record frame for video
  // capturer.capture(canvas)
})

// capturer.start()

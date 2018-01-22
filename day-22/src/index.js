const canvas = document.getElementById('regl-canvas')
const regl = require('regl')(canvas)
const resl = require('resl')
const mouse = require('mouse-change')()
const CCapture = require('ccapture.js')

const fragmentShader = require('./shader.frag')
const copyShader = require('./copy.frag')
const vertexShader = require('./shader.vert')

const capturer = new CCapture( { format: 'webm', timeLimit: 60 } )

const RADIUS = 640

const previousFrame = regl.framebuffer({
  color: regl.texture({
    radius: RADIUS,
    data: (Array(RADIUS * RADIUS * 4)).fill(0)
  }),
  depthStencil: false
})

const getMouse = ({ boundingRect, drawingBufferWidth, drawingBufferHeight }) => {
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

const renderFrameToBuffer = regl({
  frag: copyShader,
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
    u_mouse: context => getMouse(context),
    u_current_frame: regl.prop('currentFrame')
  },
  depth: { enable: false },
  count: 6,
  framebuffer: previousFrame
})

const draw = regl({
  frag: fragmentShader,
  vert: vertexShader,
  attributes: {
    a_texcoord: [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0],
    a_position: [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]
  },
  uniforms: {
    u_time: regl.context('time'),
    u_resolution: ({ drawingBufferWidth, drawingBufferHeight }) => [
      drawingBufferWidth,
      drawingBufferHeight
    ],
    u_mouse: context => getMouse(context),
    u_previous_frame: previousFrame,
    u_current_frame: regl.prop('currentFrame')
  },
  depth: { enable: false },
  count: 6,
  primitive: 'triangles'
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

      const texture = regl.texture(video)
      regl.frame(context => {
        // do other stuff every frame
        const currentFrame = texture.subimage(video)

        // draw the shaders
        draw({ currentFrame: currentFrame })
        renderFrameToBuffer({ currentFrame: currentFrame })

        // record frame for video
        // capturer.capture(canvas)
      })

      // capturer.start()
    }
  })
})

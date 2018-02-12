const canvas = document.getElementById('regl-canvas')
const regl = require('regl')(canvas)
const resl = require('resl')
const mouse = require('mouse-change')()
const CCapture = require('ccapture.js')
const dat = require('dat.gui')

const fragmentShader = require('./shader.frag')
const flipShader = require('./flip.frag')
const getColorAtMousePosShader = require('./get-color-at-mouse-position.frag')
const chromaKeyShader = require('./chroma-key.frag')
const vertexShader = require('./shader.vert')

const capturer = new CCapture( { format: 'webm', timeLimit: 60, framerate: 30 } )

const gui = new dat.default.GUI()
gui.domElement.id = 'gui'
const parameters = {
  tolerance: 0.0,
  fade: 0.0,
  minkey: 0.0,
  maxkey: 1.0
}
gui.add(parameters, 'tolerance', 0.0, 1.0)
gui.add(parameters, 'fade', 0.0, 1.0)
gui.add(parameters, 'minkey', 0.0, 1.0)
gui.add(parameters, 'maxkey', 0.0, 1.0)

const width = Math.round(512 * window.devicePixelRatio * (regl._gl.canvas.width / regl._gl.canvas.height))
const height = 512
const initialConditions = (Array(width * height * 4)).fill(0).map((v, i) => (i + 1) % 4 === 0 ? 1 : 0)

const currentFrame = regl.framebuffer({
  color: regl.texture({
    width: width,
    height: height,
    data: initialConditions
  }),
  depthStencil: false
})

const feedbackState = Array(2).fill().map(() => regl.framebuffer({
  color: regl.texture({
    width: width,
    height: height,
    data: initialConditions
  }),
  depthStencil: false
}))

const chromaKeyReferenceColor = regl.framebuffer({
  color: regl.texture({
    radius: 1,
    data: [0, 0, 0, 0]
  })
})

const flipCamera = regl({
  frag: flipShader,
  vert: vertexShader,
  attributes: {
    a_texcoord: [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0],
    a_position: [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]
  },
  uniforms: {
    u_frame: regl.prop('frame'),
  },
  depth: { enable: false },
  count: 6,
  primitive: 'triangles',
  framebuffer: regl.prop('framebuffer')
})

const getColorAtMousePosition = regl({
  frag: getColorAtMousePosShader,
  vert: vertexShader,
  attributes: {
    a_texcoord: [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0],
    a_position: [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]
  },
  context: {
    boundingRect: () => canvas ? canvas.getBoundingClientRect() : document.body.getBoundingClientRect()
  },
  uniforms: {
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
    },
    u_frame: regl.prop('video')
  },
  depth: { enable: false },
  count: 6,
  primitive: 'triangles',
  framebuffer: chromaKeyReferenceColor
})

const chromaKey = regl({
  frag: chromaKeyShader,
  vert: vertexShader,
  attributes: {
    a_texcoord: [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0],
    a_position: [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]
  },
  uniforms: {
    u_time: regl.context('time'),
    u_tolerance: regl.prop('tolerance'),
    u_fade: regl.prop('fade'),
    u_minkey: regl.prop('minkey'),
    u_maxkey: regl.prop('maxkey'),
    u_chroma_key_reference_color: regl.prop('referenceColorBuffer'),
    u_foreground: regl.prop('foregroundBuffer'),
    u_background: regl.prop('backgroundBuffer')
  },
  depth: { enable: false },
  count: 6,
  primitive: 'triangles',
  framebuffer: regl.prop('framebuffer')
})

const draw = regl({
  frag: fragmentShader,
  vert: vertexShader,
  attributes: {
    a_texcoord: [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0],
    a_position: [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]
  },
  uniforms: {
    u_frame: regl.prop('currentFrame'),
  },
  depth: { enable: false },
  count: 6,
  primitive: 'triangles',
})

let texture

const onResize = video => {
  currentFrame.resize()
}

const setup = video => {
  video.autoplay = true
  video.loop = true
  video.play()

  texture = regl.texture(video)

  regl.frame(({ tick }) => {
    flipCamera({
      frame: texture.subimage(video),
      framebuffer: currentFrame
    })

    if (mouse.buttons === 1) {
      getColorAtMousePosition({ video: currentFrame })
    }

    chromaKey({
      tolerance: parameters.tolerance,
      fade: parameters.fade,
      minkey: parameters.minkey,
      maxkey: parameters.maxkey,
      referenceColorBuffer: chromaKeyReferenceColor,
      foregroundBuffer: currentFrame,
      backgroundBuffer: feedbackState[tick % 2],
      framebuffer: feedbackState[(tick + 1) % 2]
    })

    draw({ currentFrame: feedbackState[(tick + 1) % 2] })
  })
}

const getVideo = (aspectRatio, callback) => {
  window.navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      aspectRatio: aspectRatio
    }
  }).then(function(stream)  {
    try {
      const videoElement = document.createElement('video')
      videoElement.srcObject = stream
      videoElement.onloadedmetadata = () => callback(videoElement)
    } catch (error) {
      resl({
        manifest: {
          video: {
            type: 'video',
            src: window.URL.createObjectURL(stream),
            stream: true
          }
        },
        onDone: ({ video }) => callback(video)
      })
    }
  })
}

getVideo(1.0, setup)

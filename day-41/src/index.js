const canvas = document.getElementById('regl-canvas')
const regl = require('regl')(canvas)
const resl = require('resl')
const mouse = require('mouse-change')()
const CCapture = require('ccapture.js')

const fragmentShader = require('./shader.frag')
const flipShader = require('./flip.frag')
const getColorAtMousePosShader = require('./get-color-at-mouse-position.frag')
const chromaKeyShader = require('./chroma-key.frag')
const vertexShader = require('./shader.vert')

const capturer = new CCapture( { format: 'webm', timeLimit: 60, framerate: 30 } )

const RADIUS = 640
const INITIAL_CONDITIONS = (Array(RADIUS * RADIUS * 4)).fill(0).map((v, i) => (i + 1) % 4 === 0 ? 1 : 0)

const currentFrame = regl.framebuffer({
  color: regl.texture({
    radius: RADIUS,
    data: INITIAL_CONDITIONS
  }),
  depthStencil: false
})

const feedbackState = Array(2).fill().map(() => regl.framebuffer({
  color: regl.texture({
    radius: RADIUS,
    data: INITIAL_CONDITIONS
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
    u_resolution: ({ drawingBufferWidth, drawingBufferHeight }) => [
      drawingBufferWidth,
      drawingBufferHeight
    ],
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
    u_resolution: ({ drawingBufferWidth, drawingBufferHeight }) => [
      drawingBufferWidth,
      drawingBufferHeight
    ],
    u_tolerance: 1.0,
    u_fade: 0.0,
    u_minkey: 0.0,
    u_maxkey: 1.0,
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
    u_resolution: ({ drawingBufferWidth, drawingBufferHeight }) => [
      drawingBufferWidth,
      drawingBufferHeight
    ],
    u_frame: regl.prop('currentFrame'),
  },
  depth: { enable: false },
  count: 6,
  primitive: 'triangles',
})

const onVideoLoad = video => {
  video.autoplay = true
  video.loop = true
  video.play()

  const texture = regl.texture(video)

  regl.frame(({ tick }) => {
    flipCamera({
      frame: texture.subimage(video),
      framebuffer: currentFrame
    })

    if (mouse.buttons === 1) {
      getColorAtMousePosition({ video: currentFrame })
    }

    chromaKey({
      referenceColorBuffer: chromaKeyReferenceColor,
      foregroundBuffer: currentFrame,
      backgroundBuffer: feedbackState[tick % 2],
      framebuffer: feedbackState[(tick + 1) % 2]
    })

    draw({ currentFrame: feedbackState[(tick + 1) % 2] })
  })
}

window.navigator.mediaDevices.getUserMedia({
  audio: false,
  video: {
    aspectRatio: 1.0
  }
}).then(function(stream)  {
  try {
    const videoElement = document.createElement('video')
    videoElement.srcObject = stream
    videoElement.onloadedmetadata = () => onVideoLoad(videoElement)
  } catch (error) {
    resl({
      manifest: {
        video: {
          type: 'video',
          src: window.URL.createObjectURL(stream),
          stream: true
        }
      },

      onDone: ({ video }) => onVideoLoad(video)
    })
  }
})

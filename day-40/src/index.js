const canvas = document.getElementById('regl-canvas')
const regl = require('regl')(canvas)
const resl = require('resl')
const mouse = require('mouse-change')()
const CCapture = require('ccapture.js')

const fragmentShader = require('./shader.frag')
const getColorAtMouseClickShader = require('./get-color-at-mouse-click.frag')
const chromaKeyFeedbackShader = require('./chroma-key-feedback.frag')
const vertexShader = require('./shader.vert')

const capturer = new CCapture( { format: 'webm', timeLimit: 60, framerate: 30 } )

const RADIUS = 640
const INITIAL_CONDITIONS = (Array(RADIUS * RADIUS * 4)).fill(0)

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

const getColorAtMouseClick = regl({
  frag: getColorAtMouseClickShader,
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

const videoFeedBack = regl({
  frag: chromaKeyFeedbackShader,
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
    u_tolerance: 0.5,
    u_fade: 0.0,
    u_chroma_key_reference_color: regl.prop('referenceColorBuffer'),
    u_frame: regl.prop('video'),
    u_feedback: regl.prop('feedbackBuffer')
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
    // do other stuff every frame
    const currentFrame = texture.subimage(video)

    if (mouse.buttons === 1) {
      getColorAtMouseClick({ video: currentFrame })
    }

    // draw the shaders
    videoFeedBack({
      video: currentFrame,
      referenceColorBuffer: chromaKeyReferenceColor,
      feedbackBuffer: currentFrame,
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

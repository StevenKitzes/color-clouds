const DEBUG = true

const log = (msg) => {
  if (DEBUG) console.log(msg)
}
const error = (msg) => {
  console.log(`ERROR: ${msg}`)
}

// start and end both inclusive
const randInt = (start, end) => {
  const span = end - start + 1
  return Math.floor(Math.random() * span) + start
}
const coinToss = () => {
  return randInt(0, 1) ? true : false
}

function Box(red, green, blue, spanId) {
  this.red = red
  this.green = green
  this.blue = blue
  this.spanId = spanId
}

// set up DOM with boxes
const initBoxes = (boxSize, displayElement, boxData, boxDataStage) => {
  const displayWidth = displayElement.clientWidth
  const displayHeight = displayElement.clientHeight

  const height = Math.ceil(displayHeight / boxSize)
  const width = Math.ceil(displayWidth / boxSize)

  for (let row = 0; row < height; row++) {
    boxData.push([])
    boxDataStage.push([])
    for (let col = 0; col < width; col++) {
      const span = document.createElement('span')
      const red = randInt(0, 255)
      const green = randInt(0, 255)
      const blue = randInt(0, 255)
      const spanId = `box-${displayElement.id}-${row}-${col}`
      boxData[row].push(new Box(red, green, blue, spanId))
      boxDataStage[row].push(new Box(red, green, blue, spanId))

      span.id = spanId
      span.style.backgroundColor = `rgb(${red}, ${green}, ${blue})`
      span.style.height = `${boxSize}px`
      span.style.left = `${col * boxSize}px`
      span.style.position = 'absolute'
      span.style.top = `${row * boxSize}px`
      span.style.width = `${boxSize}px`
      displayElement.appendChild(span)
    }
  }
}

const enforceColorBoundsOnBox = (box) => {
  if (box.red < 0) box.red = 0
  if (box.green < 0) box.green = 0
  if (box.blue < 0) box.blue = 0
  if (box.red > 255) box.red = 255
  if (box.green > 255) box.green = 255
  if (box.blue > 255) box.blue = 255
}

const colorDrift = (factor) => {
  return randInt(-factor, factor)
}

// returns ref to its interval to be canceled if a new loop is started
const startLoop = (boxData, boxDataStage, colorDriftFactor, frameDelay) => {
  return setInterval(() => {
    // general strategy: READ from boxData to WRITE to boxDatastage
    // fuss around and customize values in boxDataStage, maintaining frame-wise original,
    // pristine state in boxData; when done, write colors from boxDateStage to DOM, as well
    // as back to boxData

    // for each box:
    // if i have bloom:
    //   noisy average me with self and other bloom neighbors ONLY for those neighbors with higher bloom count than mine
    //   reduce my remaining bloom count
    // if i don't have bloom:
    //   noisy average me with all neighbors
    //   weight the average toward boxes with bloom
    //   if i have multiple bloom neighbors, select one randomly
    //     chance of catching some amount of bloom and becoming a bloom box

    // step: fuss with stage data
    boxData.forEach((row, r) => {
      row.forEach((currentBox, c) => {
        boxDataStage[r][c].red = currentBox.red + colorDrift(colorDriftFactor)
        boxDataStage[r][c].green = currentBox.green + colorDrift(colorDriftFactor)
        boxDataStage[r][c].blue = currentBox.blue + colorDrift(colorDriftFactor)
      })
    })

    // step: write fussed stage to DOM and boxData
    boxDataStage.forEach((row, r) => {
      row.forEach((currentBox, c) => {
        document.getElementById(currentBox.spanId).style.backgroundColor =
          `rgb(${currentBox.red}, ${currentBox.green}, ${currentBox.blue})`
        boxData[r][c].red = currentBox.red
        boxData[r][c].green = currentBox.green
        boxData[r][c].blue = currentBox.blue
        })
    })
  }, frameDelay)
}

// returns ref to its interval for cancelation in case of a new loop start
const colorClouds = (args = {}) => {
  const boxSize = args.boxSize || 20
  const colorDriftFactor = args.colorDriftFactor || 5
  const elementId = args.elementId || 'color-clouds'
  const frameDelay = args.frameDelay || 100

  const displayElement = document.getElementById(elementId)
  if (!displayElement) {
    return error(`unable to find DOM element with the provided id: ${elementId}`)
  }

  if (window.getComputedStyle(displayElement).position !== 'relative') {
    displayElement.style.backgroundColor = 'black'
    displayElement.style.color = 'white'
    displayElement.innerHTML = 'Sorry, color clouds cannot render in this element!'
    return error(`this feature only available for use with DOM elements with the 'relative' position style`)
  }

  // clean target element's content
  displayElement.innerHTML = ""

  const boxData = []
  const boxDataStage = []

  initBoxes(boxSize, displayElement, boxData, boxDataStage)

  // return ref to the loop interval from setInterval
  return startLoop(boxData, boxDataStage, colorDriftFactor, frameDelay)
}

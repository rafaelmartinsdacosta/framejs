// Configurações da stream de video
let constraints = {};
let constraintsBase = {
  video: {
    facingMode: 'user',
  },
  audio: false,
};

let videoOrientation;
let track = null;
let cameraOpen;
let svgMask;
let defs;
let style;
let groupMain;
let groupMask;
let pathBackground;
let pathFocus;
let stream;
let aspectRatio = 1280 / 720;
let videoWidth = 0;
let videoHeight = 0;
// Opera 8.0+
const isOpera =
  (!!window.opr && !!opr.addons) ||
  !!window.opera ||
  navigator.userAgent.indexOf(' OPR/') >= 0;

// Firefox 1.0+
const isFirefox = typeof InstallTrigger !== 'undefined';

// Safari 3.0+ "[object HTMLElementConstructor]"
const isSafari =
  /constructor/i.test(window.HTMLElement) ||
  (function (p) {
    return p.toString() === '[object SafariRemoteNotification]';
  })(
    !window['safari'] ||
      (typeof safari !== 'undefined' && safari.pushNotification)
  );

// Internet Explorer 6-11
const isIE = /*@cc_on!@*/ false || !!document.documentMode;

// Edge 20+
const isEdge = !isIE && !!window.StyleMedia;

// Chrome 1 - 79
const isChrome =
  !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);

// Edge (based on chromium) detection
const isEdgeChromium = isChrome && navigator.userAgent.indexOf('Edg') != -1;

// Blink engine detection
const isBlink = (isChrome || isOpera) && !!window.CSS;

// video da abertura da câmera
const cameraVideo = document.querySelector('#camera--video');
// imagem capturada
const cameraOutput = document.querySelector('#camera--output');
// canvas utilizado na captura
const cameraCanvas = document.querySelector('#camera--canvas');
// botão de captura
const buttonCapture = document.querySelector('#camera--trigger');
// loading
const boxLoading = document.querySelector('#box--loading');
// box da câmera
const boxCamera = document.querySelector('#box-camera');

const isMobile =
  navigator.userAgent.match(/Android/i) ||
  navigator.userAgent.match(/webOS/i) ||
  navigator.userAgent.match(/iPhone/i) ||
  navigator.userAgent.match(/iPad/i) ||
  navigator.userAgent.match(/iPod/i) ||
  navigator.userAgent.match(/BlackBerry/i) ||
  navigator.userAgent.match(/Windows Phone/i)
    ? true
    : false;

const Orientation = {
  PORTRAIT: 1,
  LANDSCAPE: 2,
};

const addClickEvent = () => {
  if (buttonCapture) {
    buttonCapture.onclick = takePicture;
  }
};

const gotStream = (mediaStream) => {
  if (mediaStream) {
    // make stream available to console
    stream = window.stream = mediaStream;
    cameraVideo.srcObject = mediaStream;
    setTrack(mediaStream);
    // Refresh button list in case labels have become available
  }
  return navigator.mediaDevices.enumerateDevices();
};

const gotDevices = (deviceInfos) => {
  for (let i = 0; i !== deviceInfos.length; ++i) {
    const deviceInfo = deviceInfos[i];

    if (deviceInfo.kind === 'videoinput') {
      videoSourceInfoId = deviceInfo.deviceId ? deviceInfo.deviceId : undefined;
      break;
    }
  }
};

const setTrack = (mediaStream) => {
  if (mediaStream) {
    track = mediaStream.getVideoTracks()[0];
    if (track.getSettings()) {
      console.log(
        'resolucao de abertura:',
        `${track.getSettings().width}x${track.getSettings().height}`
      );
    }
    setConstraint(track.getConstraints());
  }
};

const setConstraint = (newConstraints) => {
  if (newConstraints) {
    let _constraints = {};
    // copia os dados básicos (video.user e audio)
    Object.assign(_constraints, constraints);
    // copia a resolucao nova
    Object.assign(_constraints, newConstraints);
    // define na variavel
    constraints = _constraints;
    setAspectRatio(constraints);
  }
};

const setAspectRatio = (constraints) => {
  let width = 1280;
  let height = 720;

  // largura
  if (
    constraints &&
    constraints.video &&
    constraints.video.width &&
    constraints.video.width.exact
  ) {
    width = constraints.video.width.exact;
  }

  // altura
  if (
    constraints &&
    constraints.video &&
    constraints.video.height &&
    constraints.video.height.exact
  ) {
    height = constraints.video.height.exact;
  }

  if (width && height) {
    // landscape
    if (width > height) {
      aspectRatio = width / height;
    }
    // portrait
    else {
      aspectRatio = height / width;
    }
  }
};

const handleError = (error) => {
  if (error) {
    console.log(
      'navigator.MediaDevices.getUserMedia error: ',
      error.message,
      error.name
    );
  } else {
    console.log('Ooopss algo deu errado na abertura da câmera');
  }
};

const setMobileStyle = () => {
  if (isMobile) {
    cameraVideo.style['object-fit'] = 'cover';
  } else {
    cameraVideo.style['object-fit'] = '';
  }
};

const startCamera = () => {
  if (window.stream) {
    window.stream.getTracks().forEach((track) => {
      track.stop();
    });
  }

  if (
    !constraints ||
    !constraints.video ||
    !constraints.video.width ||
    !constraints.video.height ||
    !constraints.video.width.min ||
    !constraints.video.width.ideal ||
    !constraints.video.width.max ||
    !constraints.video.height.min ||
    !constraints.video.height.ideal ||
    !constraints.video.height.max
  ) {
    // configuração base
    Object.assign(constraints, constraintsBase);
    // exceto Safari
    if (!isSafari) {
      Object.assign(constraints, defaultConstraints);
    }
    setConstraint(constraints);
  }

  navigator.mediaDevices
    .getUserMedia(getConstraints())
    .then(setMobileStyle())
    .then(gotStream)
    .then(gotDevices)
    .then(loadMask)
    .then(calcBtnCapturePos)
    .catch((error) => {
      handleError(error);
    });
};

navigator.mediaDevices.enumerateDevices().catch(handleError);

const newGuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Captura da foto
 */
const takePicture = () => {
  if (cameraOpen) {
    // canvas
    cameraCanvas.width = cameraVideo.videoWidth;
    cameraCanvas.height = cameraVideo.videoHeight;
    cameraCanvas.getContext('2d').drawImage(cameraVideo, 0, 0);

    // image
    cameraOutput.src = cameraCanvas.toDataURL('image/webp');
    cameraOutput.style.display = 'block';

    // stop tracking
    track.stop();

    // hide mask
    setVisibilityAfterTake();

    // set camera status
    cameraOpen = false;
  } else {
    // hides captured image
    setVisibilityOpenCamera();

    // start camera again
    startCamera();
  }
};

const setVisibilityOpenCamera = () => {
  cameraOutput.style = 'display: none;';

  // show mask
  svgMask.style.display = 'unset';

  // show camera video
  cameraVideo.style.display = 'unset';

  // hides box loading
  boxLoading.style.display = 'none';

  // original text buttom
  buttonCapture.textContent = 'Tirar foto';
};

const setVisibilityAfterTake = () => {
  svgMask.style.display = 'none';

  // show loading
  boxLoading.style.display = 'unset';

  // change text button camera
  buttonCapture.textContent = 'Tirar outra';

  // hide video
  cameraVideo.style.display = 'none';

  resizeImageOut();
};

const resizeImageOut = async () => {
  if (isMobile) {
    cameraOutput.style.width = '100%';
    cameraOutput.style.height = '100%';
    cameraOutput.style['object-fit'] = 'cover';
    cameraOutput.style.top = '';
    cameraOutput.style.left = '';
  } else {
    cameraOutput.style['object-fit'] = '';
    let currentAspectRatio = 0;
    currentAspectRatio = boxCamera.offsetWidth / boxCamera.offsetHeight;
    // faixa preta emcima e embaixo
    if (aspectRatio > currentAspectRatio) {
      videoHeight = boxCamera.offsetWidth / aspectRatio;
      videoWidth = boxCamera.offsetWidth;
    }
    // faixa preta nas laterais
    else {
      videoHeight = boxCamera.offsetHeight;
      videoWidth = boxCamera.offsetHeight * aspectRatio;
    }

    // set a captured image
    cameraOutput.style.width = videoWidth;
    cameraOutput.style.height = videoHeight;

    // ajusta a posicao (left x top)
    if (boxCamera.offsetWidth > videoWidth) {
      cameraOutput.style.left = (boxCamera.offsetWidth - videoWidth) / 2;
      cameraOutput.style.top = '';
    } else if (boxCamera.offsetHeight > videoHeight) {
      cameraOutput.style.left = '';
      cameraOutput.style.top = (boxCamera.offsetHeight - videoHeight) / 2;
    }
  }
};

const calcBtnCapturePos = async () => {
  // diferença entre o video e a area visivel (na web fica com a faixa preta caso ultrapasse a area do video)
  let diff = boxCamera.offsetHeight - videoHeight;
  let bottom = diff > 0 ? diff / 2 : 0 + 20;
  buttonCapture.style.bottom = `${bottom}px`;
  buttonCapture.style.display = 'inline-block';
};

const orientationChange = () => {
  setOrientation();
};

const addEventResize = async () => {
  window.addEventListener('resize', (e) => {
    if (cameraOpen) {
      loadMask();
    }
    // has image ?
    else if (cameraOutput.src !== '') {
      resizeImageOut();
    }
    calcBtnCapturePos();
    setMobileStyle();
  });
};

const addEventPlay = () => {
  cameraVideo.addEventListener('play', () => {
    cameraOpen = true;
    // add event after play video....

    // faceapi.matchDimensions(canvas, displaySize);

    // setInterval(async() => {
    //     const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();
    //     let resizedDetections;

    //     if (detections) {
    //         if (isOpenCamera) {
    //             document.getElementById('dark').style.display = 'none';
    //             document.getElementById('result').innerHTML = '';
    //             document.getElementById('result').style.display = 'none';
    //             isOpenCamera = false;
    //         }

    //         resizedDetections = faceapi.resizeResults(detections, displaySize);

    //         if (resizedDetections) {
    //             if (flow > 0) {
    //                 if (totalSeconds === 0) {
    //                     initTimer();
    //                 }

    //                 getBlinks(resizedDetections);

    //                 validateBioWeb(
    //                     resizedDetections.alignedRect._box._width,
    //                     resizedDetections.alignedRect._box.left,
    //                     resizedDetections.alignedRect._box.bottom
    //                 );

    //                 //falta deixar o número de ciclos corretos para mobile e para webcam levando em consideração o tempo do ciclo
    //                 if (flow === 1 && countSuccess >= 6) {
    //                     takePictureNear();
    //                     countSuccess === 0;
    //                 } else if (flow === 2 && countSuccess > 5) {
    //                     //melhor precisão em capturar os ciclos do sorriso
    //                     if (detections.expressions.happy * 100 > 95) {
    //                         setTimeout(takePictureFar(), 200);
    //                         countSuccess === 0;
    //                         flow = 0;
    //                     }
    //                 }
    //             }

    //             //canvas.getContext('2d').scale(-1, 1);
    //             //canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    //             //faceapi.draw.drawDetections(canvas, resizedDetections);
    //             //faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    //             //faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
    //         }
    //     }
    // }, 350);
  });
};

const loadMask = async () => {
  // parameters -----------------------------------
  let mBoxWidth = cameraVideo.offsetWidth;
  let mBoxHeight = cameraVideo.offsetHeight;
  let mWidth = 0;
  let mHeight = 0;
  let borderColor = '#fff';
  let borderWidth = 5;
  let backgroundOpacity = '0.7';
  // parameters -----------------------------------

  let currentAspectRatio = 0;

  if (isMobile) {
    videoWidth = cameraVideo.offsetWidth;
    videoHeight = cameraVideo.offsetHeight;
    if (videoOrientation == Orientation.LANDSCAPE) {
      mHeight = videoHeight * (1 / 2);
      mWidth = videoWidth * (1 / 5);
    } else {
      mHeight = videoHeight * (1 / 2);
      mWidth = videoWidth * (1 / 2);
    }
  } else {
    currentAspectRatio = cameraVideo.offsetWidth / cameraVideo.offsetHeight;

    // faixa preta emcima e embaixo
    if (aspectRatio > currentAspectRatio) {
      videoHeight = cameraVideo.offsetWidth / aspectRatio;
      videoWidth = cameraVideo.offsetWidth;
    }
    // faixa preta nas laterais
    else {
      videoHeight = cameraVideo.offsetHeight;
      videoWidth = cameraVideo.offsetHeight * aspectRatio;
    }
    // define a proporção da máscara em tela
    mHeight = videoHeight * (1 / 2);
    mWidth = videoWidth * (1 / 5);
  }

  let exists = document.getElementById('svgMask') !== null;
  let mBoxXCenter = mBoxWidth / 2;
  let mBoxYCenter = mBoxHeight / 2;

  let halfMWidth = mWidth / 2;
  let halfHeight = mHeight / 2;
  let half14Height = mHeight / 4;
  let fractionX = 0.15;
  let fractionWidthX = halfMWidth * fractionX;

  // ---------------
  //      6   7
  //   5         8
  //
  //
  //   4         1
  //      3   2
  // ---------------

  // point 1
  let point1X = mBoxXCenter + halfMWidth;
  let point1Y = mBoxYCenter + half14Height;

  // point 2
  let point2X = mBoxXCenter + fractionWidthX;
  let point2Y = mBoxYCenter + halfHeight;

  // point 3
  let point3H = mBoxXCenter - fractionWidthX * 2;

  // point 4
  let point4X = mBoxXCenter - halfMWidth;
  let point4Y = mBoxYCenter + half14Height;

  // point 5
  let point5V = mBoxYCenter - half14Height;

  // point 6
  let point6X = mBoxXCenter - fractionWidthX;
  let point6Y = mBoxYCenter - halfHeight;

  // point 7
  let point7h = fractionWidthX * 2;

  // point 8
  let point8X = mBoxXCenter + halfMWidth;
  let point8Y = mBoxYCenter - half14Height;

  let arcXY = halfMWidth - fractionWidthX;

  let mov0 = 'M0,0';
  let v0 = 'V' + mBoxHeight;
  let h0 = 'H' + mBoxWidth;
  let v1 = 'V0';
  let z0 = 'Z';
  let mov1 = `M${point1X},${point1Y}`;
  let arc1 = `A${arcXY},${arcXY},0,0,1,${point2X},${point2Y}`;
  let h1 = `H${point3H}`;
  let arc2 = `A${arcXY},${arcXY},0,0,1,${point4X},${point4Y}`;
  let v2 = `V${point5V}`;
  let arc3 = `A${arcXY},${arcXY},0,0,1,${point6X},${point6Y}`;
  let h2 = `h${point7h}`;
  let arc4 = `A${arcXY},${arcXY},0,0,1,${point8X},${point8Y}`;
  let z = 'Z';
  let d = `${mov0}${v0}${h0}${v1}${z0}${mov1}${arc1}${h1}${arc2}${v2}${arc3}${h2}${arc4}${z}`;
  let xmlns = 'http://www.w3.org/2000/svg';

  // svg
  if (!svgMask) {
    svgMask = document.createElementNS(xmlns, 'svg');
  }

  // svg attributes
  svgMask.setAttributeNS(
    null,
    'viewBox',
    '0 0 ' + mBoxWidth + ' ' + mBoxHeight
  );
  svgMask.setAttributeNS(null, 'width', mBoxWidth);
  svgMask.setAttributeNS(null, 'height', mBoxHeight);
  svgMask.style.display = 'block';
  svgMask.setAttributeNS(null, 'id', `svgMask`);

  // definitions
  if (!defs) {
    defs = document.createElementNS(xmlns, 'defs');
  }

  // style
  if (!style) {
    style = document.createElementNS(xmlns, 'style');
  }
  style.textContent = `.cls-background{opacity:${backgroundOpacity};}.cls-focus{fill:none;stroke:${borderColor};stroke-miterlimit:10;stroke-width:${borderWidth}px;}`;

  if (!groupMain) {
    groupMain = document.createElementNS(xmlns, 'g');
  }

  // main group
  groupMain.setAttributeNS(null, 'id', `main`);
  groupMain.setAttributeNS(null, 'data-name', `main`);

  // maks group
  if (!groupMask) {
    groupMask = document.createElementNS(xmlns, 'g');
  }

  groupMask.setAttributeNS(null, 'id', `mask`);

  // background
  if (!pathBackground) {
    pathBackground = document.createElementNS(xmlns, 'path');
  }

  pathBackground.setAttributeNS(null, 'id', `background`);
  pathBackground.setAttributeNS(null, 'class', `cls-background`);
  pathBackground.setAttributeNS(null, 'd', d);

  if (!pathFocus) {
    pathFocus = document.createElementNS(xmlns, 'rect');
  }

  // focus
  pathFocus.setAttributeNS(null, 'id', `focus`);
  pathFocus.setAttributeNS(null, 'class', `cls-focus`);
  pathFocus.setAttributeNS(null, 'x', point4X);
  pathFocus.setAttributeNS(null, 'y', point6Y);
  pathFocus.setAttributeNS(null, 'width', mWidth);
  pathFocus.setAttributeNS(null, 'height', mHeight);
  pathFocus.setAttributeNS(null, 'rx', arcXY);

  // structure
  if (!exists) {
    groupMask.appendChild(pathBackground);
    groupMask.appendChild(pathFocus);
    groupMain.appendChild(groupMask);
    defs.appendChild(style);
    svgMask.appendChild(defs);
    svgMask.appendChild(groupMain);
    boxCamera.appendChild(svgMask);
  }
};

const init = () => {
  addClickEvent();
  setOrientation();
  addEventPlay();
  addEventResize();
  startCamera();
};

const setOrientation = () => {
  let orientation =
    (screen.orientation || {}).type ||
    screen.mozOrientation ||
    screen.msOrientation;

  // se tem o parametro orientation (chrome, explorer ou mozilla)
  if (orientation) {
    if (
      orientation == 'landscape-primary' ||
      orientation == 'landscape-secondary'
    ) {
      videoOrientation = Orientation.LANDSCAPE;
    } else {
      videoOrientation = Orientation.PORTRAIT;
    }
  } else {
    // caso não exista, possivelmente Safari
    if (boxCamera.offsetWidth > boxCamera.offsetHeight) {
      videoOrientation = Orientation.LANDSCAPE;
    } else {
      videoOrientation = Orientation.PORTRAIT;
    }
  }
};

const getMedia = (constraints) => {
  if (stream) {
    stream.getTracks().forEach((track) => {
      track.stop();
    });
  }

  clearErrorMessage();
  videoblock.style.display = 'none';
  navigator.mediaDevices
    .getUserMedia(getConstraints())
    .then(gotStream)
    .catch((e) => {
      errorMessage('getUserMedia', e.message, e.name);
    });
};

const getConstraints = () => {
  return constraints;
};

const defaultConstraints = {
  video: {
    width: {
      min: 640,
      ideal: 1280,
      max: 1920,
    },
    height: {
      min: 480,
      ideal: 720,
      max: 1080,
    },
  },
};

const qvgaConstraints = {
  video: {
    width: {
      exact: 320,
    },
    height: {
      exact: 240,
    },
  },
};

const vgaConstraints = {
  video: {
    width: {
      exact: 640,
    },
    height: {
      exact: 480,
    },
  },
};

const hdConstraints = {
  video: {
    width: {
      exact: 1280,
    },
    height: {
      exact: 720,
    },
  },
};

const fullHdConstraints = {
  video: {
    width: {
      exact: 1920,
    },
    height: {
      exact: 1080,
    },
  },
};

const fourKConstraints = {
  video: {
    width: {
      exact: 4096,
    },
    height: {
      exact: 2160,
    },
  },
};

const eightKConstraints = {
  video: {
    width: {
      exact: 7680,
    },
    height: {
      exact: 4320,
    },
  },
};

window.addEventListener('orientationchange', orientationChange);
navigator.mediaDevices.ondevicechange = orientationChange;
window.addEventListener('load', init, false);

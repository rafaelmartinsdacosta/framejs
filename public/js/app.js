// Configurações da stream de video
let constraints = {
  video: {
    facingMode: 'user',
  },
  audio: false,
};

let videoOrientation;
let videoSourceInfoId;
let mobile;
let track = null;
let cameraOpen;
let maskConfiguration;
let creatingCanvas = false;
let svgMask, defs, style, groupMain, groupMask, pathBackground, pathFocus;
let stream;
let aspectRatio = 1280 / 720;
let videoWidth = 0;
let videoHeight = 0;

const cameraVideo = document.querySelector('#camera--video');
const cameraOutput = document.querySelector('#camera--output');
const cameraCanvas = document.querySelector('#camera--canvas');
const buttonCapture = document.querySelector('#camera--trigger');
const boxLoading = document.querySelector('#box--loading');
const boxCamera = document.querySelector('#box-camera');

const Orientation = {
  PORTRAIT: 1,
  LANDSCAPE: 2,
};

const addClickEvent = () => {
  if (buttonCapture) {
    buttonCapture.onclick = takePicture;
    // buttonCapture.onclick = init;
  } else {
    // console.log('Botão de captura não encontrado');
  }
};

const gotStream = (mediaStream) => {
  // make stream available to console
  stream = window.stream = mediaStream;
  cameraVideo.srcObject = mediaStream;
  setTrack(mediaStream);
  // Refresh button list in case labels have become available
  return navigator.mediaDevices.enumerateDevices();
};

const setTrack = (mediaStream) => {
  track = mediaStream.getVideoTracks()[0];
  setConstraint(track.getConstraints());
};

const setConstraint = (newConstraints) => {
  let _constraints = {};
  // copia os dados básicos (video.user e audio)
  Object.assign(_constraints, constraints);
  // copia a resolucao nova
  Object.assign(_constraints, newConstraints);
  // define na variavel
  constraints = _constraints;
  setAspectRatio(constraints);
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

const gotDevices = (deviceInfos) => {
  for (let i = 0; i !== deviceInfos.length; ++i) {
    const deviceInfo = deviceInfos[i];

    if (deviceInfo.kind === 'videoinput') {
      videoSourceInfoId = deviceInfo.deviceId ? deviceInfo.deviceId : undefined;
      break;
    }
  }
};

const handleError = (error) => {
  console.error(
    'navigator.MediaDevices.getUserMedia error: ',
    error.message,
    error.name
  );
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
    !constraints.video.width.exact ||
    !constraints.video.height.exact
  ) {
    Object.assign(constraints, hdConstraints);
    setConstraint(constraints);
  }

  navigator.mediaDevices
    .getUserMedia(getConstraints())
    .then(setMobileStyle())
    .then(gotStream)
    .then(gotDevices)
    .then(loadMask)
    .then(calcBtnCapturePos)
    .catch(handleError)
    .catch(() => {
      // abaixa a resolução de abertura da camera
      setConstraint(vgaConstraints);
      startCamera();
    });
};

navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(handleError);

const setMobileStyle = () => {
  if (isMobile()) {
    cameraVideo.style['object-fit'] = 'cover';
  } else {
    cameraVideo.style['object-fit'] = '';
  }
};

const newGuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Inicializa a camera
 */
// const configureDevice = () => {
// navigator.mediaDevices.enumerateDevices().then(gotDevices).then(loadCamera);

/**
    navigator.mediaDevices
        .getUserMedia(getConstraintVideo())
        .then(function(stream) {
            mediaStream = stream.getTracks()[0];
            cameraVideo.srcObject = stream;
            afterLoadCamera();
        })
        .catch(function(error) {
            console.error("Oops. Something is broken.", error);
        });
 */
// navigator.mediaDevices
//     .getUserMedia(constraints)
//     .then(function(stream) {
//         track = stream.getTracks()[0];
//         cameraVideo.srcObject = stream;
//         configureMask();
//     })
//     .catch(function(error) {
//         console.error("Oops. Something is broken.", error);
//     });
// }

/**
 * Abre a camera
 */
// const loadCamera = () => {
//     debugger

//     if (videoSourceInfoId) {
//         constraints = getConstraintVideo(videoSourceInfoId);
//     }

//     configureVideoDisplay(video, constraints);

//     if (mobile) {
//         navigator.getMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
//     } else {
//         navigator.getWebcam = (navigator.getUserMedia || navigator.webKitGetUserMedia || navigator.moxGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
//     }

//     if (navigator.mediaDevices.getUserMedia) {
//         navigator.mediaDevices.getUserMedia(constraints)
//             .then(function(stream) {
//                 //Definir o elemento vídeo a carregar o capturado pela webcam
//                 if (cameraVideo.mozSrcObject !== undefined) {
//                     cameraVideo.mozSrcObject = stream;
//                 } else if (cameraVideo.srcObject !== undefined) {
//                     cameraVideo.srcObject = stream;
//                 } else {
//                     cameraVideo.src = stream;
//                 }

//                 mediaStream = stream.getTracks()[0];
//             })
//             .catch(function(error) {
//                 console.log(error);
//                 if (navigator.getWebcam) {
//                     navigator.getWebcam(constraints,
//                         function(stream) {
//                             //Display the video stream in the video object
//                             cameraVideo.srcObject = stream;
//                             mediaStream = stream.getTracks()[0];
//                         },
//                         function() {
//                             logError("Web cam is not accessible.");
//                         });
//                 }
//             });
//     } else {
//         navigator.getWebcam({ audio: false, video: true },
//             function(stream) {
//                 //Display the video stream in the video object
//                 cameraVideo.srcObject = stream;
//                 mediaStream = stream.getTracks()[0];
//             },
//             function() {
//                 logError("Web cam is not accessible.");
//             });
//     }

//     addEventPlay(cameraVideo);
//     // resetVariables();
//     initCanvas('rgb(104, 106, 110)');

//     // document.getElementById('result').innerHTML = 'Abrindo câmera...';
//     // document.getElementById('result').style.display = 'block';
//     // document.getElementById('init').style.display = 'none';
// }

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
  let currentAspectRatio = 0;

  // proporção da tela
  if (videoOrientation == Orientation.LANDSCAPE) {
    currentAspectRatio = boxCamera.offsetWidth / boxCamera.offsetHeight;
  } else {
    currentAspectRatio = boxCamera.offsetHeight / boxCamera.offsetWidth;
  }

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
};

const calcBtnCapturePos = async () => {
  let bottom = (boxCamera.offsetHeight - videoHeight) / 2 + 20;
  buttonCapture.style.bottom = `${bottom}px`;
  buttonCapture.style.display = 'inline-block';
};

// const getConstraintVideo = (videoSourceInfoId) => {
//   let constraints;
//   if (mobile) {
//     //console.log("MOBILE");
//     if (detectIphoneHigLevel(platform.ua)) {
//       if (videoSourceInfoId) {
//         constraints = {
//           video: {
//             deviceId: videoSourceInfoId,
//             width: 1920,
//             height: 1080,
//             facingMode: 'user',
//           },
//           audio: false,
//           toString: function () {
//             return 'video';
//           },
//         };
//       } else {
//         constraints = {
//           video: {
//             width: 1920,
//             height: 1080,
//             facingMode: 'user',
//           },
//           audio: false,
//           toString: function () {
//             return 'video';
//           },
//         };
//       }
//     } else {
//       if (videoSourceInfoId) {
//         constraints = {
//           video: {
//             deviceId: videoSourceInfoId,
//             width: {
//               min: 480,
//               ideal: 1280,
//               max: getHeightResolution(),
//             },
//             height: {
//               min: 480,
//               ideal: 720,
//               max: getWidthResolution(),
//             },
//             facingMode: 'user',
//           },
//           audio: false,
//           toString: function () {
//             return 'video';
//           },
//         };
//       } else {
//         constraints = {
//           video: {
//             width: {
//               min: 480,
//               ideal: 1280,
//               max: getHeightResolution(),
//             },
//             height: {
//               min: 480,
//               ideal: 720,
//               max: getWidthResolution(),
//             },
//             facingMode: 'user',
//           },
//           audio: false,
//           toString: function () {
//             return 'video';
//           },
//         };
//       }
//     }
//   } else {
//     //console.log("WEB");

//     constraints = {
//       video: {
//         deviceId: videoSourceInfoId,
//         width: {
//           ideal: 1280,
//         },
//         height: {
//           ideal: 720,
//         },
//         facingMode: 'user',
//       },
//       audio: false,
//       toString: function () {
//         return 'video';
//       },
//     };
//   }

//   return constraints;
// };

// const configureVideoDisplay = (video, constraintVideo) => {
//   cameraVideo.style.display = 'block';
//   //As opções abaixo são necessárias para o funcionamento correto no iOS
//   cameraVideo.setAttribute('autoplay', '');
//   cameraVideo.setAttribute('muted', '');
//   cameraVideo.setAttribute('playsinline', '');

//   if (mobile) {
//     window.scrollTo(0, 0);
//     // document.body.style.overflow = "hidden";
//     // document.getElementById("box-liveness").style.width = screen.width + 'px';
//     // document.getElementById("box-liveness").style.height = screen.height + 'px';
//     cameraVideo.width = screen.width;
//     cameraVideo.height = screen.height;
//   } else {
//     // document.getElementById("box-liveness").style.width = constraintVideo.video.width.ideal + 'px';
//     // document.getElementById("box-liveness").style.height = constraintVideo.video.height.ideal + 'px';
//     cameraVideo.width = constraintVideo.video.width.ideal;
//     vicameraVideoeo.height = constraintVideo.video.height.ideal;

//     // document.getElementById('message').style.top = `${constraintVideo.video.height.ideal / 2 - ((maskConfiguration.heightNear) / 2 + 40)}px`;
//     // document.getElementById('result').style.bottom = `${constraintVideo.video.height.ideal / 2 - (maskConfiguration.heightNear / 2 + 40)}px`;
//   }

//   if (mobile) {
//     mirrorScreen();
//   }
// };

/**
 * Verifica se é um dispositivo móvel
 */
const isMobile = () => {
  if (
    navigator.userAgent.match(/Android/i) ||
    navigator.userAgent.match(/webOS/i) ||
    navigator.userAgent.match(/iPhone/i) ||
    navigator.userAgent.match(/iPad/i) ||
    navigator.userAgent.match(/iPod/i) ||
    navigator.userAgent.match(/BlackBerry/i) ||
    navigator.userAgent.match(/Windows Phone/i)
  ) {
    return true;
  } else {
    return false;
  }
};

/**
 * Detecta a mudanção na orientação
 */
const orientationChange = () => {
  if (
    (screen.orientation !== null
      ? screen.orientation.angle
      : Math.abs(window.orientation)) !== 0
  ) {
    // Landscape
    videoOrientation = Orientation.LANDSCAPE;
    //stopCountdown();
    //icTake.style.opacity = '0.0';
    //deviceRotated.style.display = 'block';
  } else {
    // Portrait
    videoOrientation = Orientation.PORTRAIT;
    //icTake.style.opacity = '1.0';
    //deviceRotated.style.display = 'none';
    //showBorders();
  }
  // loadMask();
  console.log(
    'videoMode' +
      (videoOrientation == Orientation.LANDSCAPE ? 'LANDSCAPE' : 'PORTRAIT')
  );
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
  });
};

const addEventPlay = () => {
  cameraVideo.addEventListener('play', () => {
    // const canvas = faceapi.createCanvasFromMedia(video);
    // document.getElementById('box-liveness').append(canvas);

    // const displaySize = {
    //     width: isMobile ? screen.width : cameraVideo.width,
    //     height: isMobile ? screen.height : cameraVideo.height
    // };

    cameraOpen = true;

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

  if (isMobile()) {
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
    // proporção da tela
    if (videoOrientation == Orientation.LANDSCAPE) {
      currentAspectRatio = cameraVideo.offsetWidth / cameraVideo.offsetHeight;
    } else {
      currentAspectRatio = cameraVideo.offsetHeight / cameraVideo.offsetWidth;
    }

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
    if (videoOrientation == Orientation.LANDSCAPE) {
      mHeight = videoHeight * (1 / 2);
      mWidth = videoWidth * (1 / 5);
    } else {
      mHeight = videoHeight * (1 / 5);
      mWidth = videoWidth * (1 / 2);
    }
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
  if (
    (window.screen.orientation &&
      window.screen.orientation.type == 'landscape-primary') ||
    window.screen.orientation.type == 'landscape-secondary'
  ) {
    videoOrientation = Orientation.LANDSCAPE;
  } else {
    videoOrientation = Orientation.PORTRAIT;
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

window.onload = function () {
  // document.getElementById('result').innerHTML = 'Carregando modelos...';
  // document.getElementById('result').style.display = 'block';
  // if ((mobile = isMobile())) {
  //   document.getElementById('box-camera').style.width = screen.width + 'px';
  //   document.getElementById('box-camera').style.height = screen.height + 'px';
  //   // document.getElementById('message').style.top = `${screen.height / 2 - ((flow === 1 ? maskConfiguration.heightNear : maskConfiguration.heightFar) / 2 + 40)}px`;
  //   // document.getElementById('result').style.bottom = `${screen.height / 2 - (maskConfiguration.heightNear / 2)}px`;
  // } else {
  //   // document.body.classList.add("body-web");
  // }
  // document.body.style.overflow = 'hidden';
  init();
};
//window.addEventListener("load", init, false);

// Configurações da stream de video
let constraints = { video: { facingMode: "user" }, audio: false };
let videoMode;
let videoSourceInfoId;
let mobile;
let track = null;
let isOpenCamera;
let maskConfiguration;
let creatingCanvas = false;
let svgMask, defs, style, groupMain, groupMask, pathBackground, pathFocus;

const cameraVideo = document.querySelector( "#camera--video" );
const cameraOutput = document.querySelector( "#camera--output" );
const cameraCanvas = document.querySelector( "#camera--canvas" );
const buttonCapture = document.querySelector( "#camera--trigger" );
const boxLoading = document.querySelector("#box--loading")

const Orientation = {
    PORTRAIT: 1,
    LANDSCAPE: 2
}

const addClickEvent = () => {
    if ( buttonCapture ) {
        buttonCapture.onclick = takePicture;
        // buttonCapture.onclick = init;
    } else {
        console.log( 'Botão de captura não encontrado' );
    }
}

const gotStream = ( stream ) => {
    // make stream available to console
    window.stream = stream;
    cameraVideo.srcObject = stream;
    track = stream.getTracks()[0];
    // Refresh button list in case labels have become available
    return navigator.mediaDevices.enumerateDevices();
}

const gotDevices = ( deviceInfos ) => {
    for ( let i = 0; i !== deviceInfos.length; ++i ) {
        const deviceInfo = deviceInfos[i];

        if ( deviceInfo.kind === 'videoinput' ) {
            videoSourceInfoId = deviceInfo.deviceId ? deviceInfo.deviceId : undefined;
            break;
        }
    }
}

const handleError = ( error ) => {
    console.log( 'navigator.MediaDevices.getUserMedia error: ', error.message, error.name );
}

const startCamera = () => {
    if ( window.stream ) {
        window.stream.getTracks().forEach( track => {
            track.stop();
        } );
    }
    navigator.mediaDevices.getUserMedia( constraints ).then( gotStream ).then( gotDevices ).catch( handleError );
}

navigator.mediaDevices.enumerateDevices().then( gotDevices ).catch( handleError );

const newGuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace( /[xy]/g, function ( c ) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : ( r & 0x3 | 0x8 );
        return v.toString( 16 );
    } );
}

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
    if (isOpenCamera) {
        cameraCanvas.width = cameraVideo.videoWidth;
        cameraCanvas.height = cameraVideo.videoHeight;
        cameraCanvas.getContext( "2d" ).drawImage( cameraVideo, 0, 0 );
        cameraOutput.src = cameraCanvas.toDataURL( "image/webp" );
        cameraOutput.style = 'display: unset;';
        svgMask.style.display = 'none';
        boxLoading.style.display = 'unset';
        buttonCapture.textContent = 'Tirar outra';
        track.stop();
        isOpenCamera = false;
    } else {
        cameraOutput.style = 'display: none;';
        svgMask.style.display = 'unset';
        boxLoading.style.display = 'none';
        buttonCapture.textContent = 'Tirar foto';
        startCamera();
    }
    
};

/**
 * Configura a máscara de captura
 */
const configureMask = () => {
    if ( cameraVideo ) {
        videoMode = cameraVideo.videoHeight > cameraVideo.videoWidth ? Orientation.PORTRAIT : Orientation.LANDSCAPE;
        if ( videoMode == Orientation.PORTRAIT ) {
            maskPortrait.style.display = 'inherit';
            maskLandscape.style.display = 'none';
        } else {
            maskPortrait.style.display = 'none';
            maskLandscape.style.display = 'inherit';
        }
    }
}

const getConstraintVideo = ( videoSourceInfoId ) => {
    let constraints;
    if ( mobile ) {
        //console.log("MOBILE");
        if ( detectIphoneHigLevel( platform.ua ) ) {
            if ( videoSourceInfoId ) {
                constraints = {
                    video: {
                        deviceId: videoSourceInfoId,
                        width: 1920,
                        height: 1080,
                        facingMode: 'user'
                    },
                    audio: false,
                    toString: function () {
                        return "video";
                    }
                };
            } else {
                constraints = {
                    video: {
                        width: 1920,
                        height: 1080,
                        facingMode: 'user'
                    },
                    audio: false,
                    toString: function () {
                        return "video";
                    }
                };
            }

        } else {
            if ( videoSourceInfoId ) {
                constraints = {
                    video: {
                        deviceId: videoSourceInfoId,
                        width: {
                            min: 480,
                            ideal: 1280,
                            max: getHeightResolution()
                        },
                        height: {
                            min: 480,
                            ideal: 720,
                            max: getWidthResolution()
                        },
                        facingMode: 'user',
                    },
                    audio: false,
                    toString: function () {
                        return "video";
                    }
                };
            } else {
                constraints = {
                    video: {
                        width: {
                            min: 480,
                            ideal: 1280,
                            max: getHeightResolution()
                        },
                        height: {
                            min: 480,
                            ideal: 720,
                            max: getWidthResolution()
                        },
                        facingMode: 'user',
                    },
                    audio: false,
                    toString: function () {
                        return "video";
                    }
                };
            }

        }

    } else {

        //console.log("WEB");

        constraints = {
            video: {
                deviceId: videoSourceInfoId,
                width: {
                    ideal: 1280
                },
                height: {
                    ideal: 720
                },
                facingMode: 'user'
            },
            audio: false,
            toString: function () {
                return "video";
            }
        };
    }

    return constraints;
}

const configureVideoDisplay = ( video, constraintVideo ) => {
    cameraVideo.style.display = 'block';
    //As opções abaixo são necessárias para o funcionamento correto no iOS
    cameraVideo.setAttribute( 'autoplay', '' );
    cameraVideo.setAttribute( 'muted', '' );
    cameraVideo.setAttribute( 'playsinline', '' );

    if ( mobile ) {
        window.scrollTo( 0, 0 );
        // document.body.style.overflow = "hidden";
        // document.getElementById("box-liveness").style.width = screen.width + 'px';
        // document.getElementById("box-liveness").style.height = screen.height + 'px';
        cameraVideo.width = screen.width;
        cameraVideo.height = screen.height;
    } else {
        // document.getElementById("box-liveness").style.width = constraintVideo.video.width.ideal + 'px';
        // document.getElementById("box-liveness").style.height = constraintVideo.video.height.ideal + 'px';
        cameraVideo.width = constraintVideo.video.width.ideal;
        vicameraVideoeo.height = constraintVideo.video.height.ideal;

        // document.getElementById('message').style.top = `${constraintVideo.video.height.ideal / 2 - ((maskConfiguration.heightNear) / 2 + 40)}px`;
        // document.getElementById('result').style.bottom = `${constraintVideo.video.height.ideal / 2 - (maskConfiguration.heightNear / 2 + 40)}px`;
    }

    if ( mobile ) {
        mirrorScreen();
    }
}

/**
 * Verifica se é um dispositivo móvel
 */
const isMobile = () => {
    if ( navigator.userAgent.match( /Android/i ) ||
        navigator.userAgent.match( /webOS/i ) ||
        navigator.userAgent.match( /iPhone/i ) ||
        navigator.userAgent.match( /iPad/i ) ||
        navigator.userAgent.match( /iPod/i ) ||
        navigator.userAgent.match( /BlackBerry/i ) ||
        navigator.userAgent.match( /Windows Phone/i )
    ) {
        return true;
    } else {
        return false;
    }
}

/**
 * Detecta a mudanção na orientação
 */
const orientationChange = () => {
    if ( ( screen.orientation !== null ? screen.orientation.angle : Math.abs( window.orientation ) ) !== 0 ) {

        // Landscape
        isLandscape = true;
        //stopCountdown();
        //icTake.style.opacity = '0.0';
        //deviceRotated.style.display = 'block';
    } else {
        // Portrait
        isLandscape = false;
        //icTake.style.opacity = '1.0';
        //deviceRotated.style.display = 'none';
        //showBorders();
    }
}

const addEventResize = () => {
    window.addEventListener( 'resize', ( e ) => {
        console.log( 'resized: ' + cameraVideo.offsetWidth + 'x' + cameraVideo.offsetHeight );
        loadMask();
        console.log( 'mask reloaded!' );
    } );
};

const addEventPlay = () => {
    cameraVideo.addEventListener( 'play', () => {

        // const canvas = faceapi.createCanvasFromMedia(video);
        // document.getElementById('box-liveness').append(canvas);

        // const displaySize = {
        //     width: isMobile ? screen.width : cameraVideo.width,
        //     height: isMobile ? screen.height : cameraVideo.height
        // };

        isOpenCamera = true;

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
    } );
}


const loadMask = () => {

    console.log( 'offsetWidth', cameraVideo.offsetWidth );
    console.log( 'offsetHeight', cameraVideo.offsetHeight );

    // parameters -----------------------------------
    let mBoxWidth = cameraVideo.offsetWidth;
    let mBoxHeight = cameraVideo.offsetHeight;
    let aspectIdeal = cameraVideo.width / cameraVideo.height;
    let aspectCurrent = cameraVideo.offsetWidth / cameraVideo.offsetHeight;
    let mWidth = 260;
    let mHeight = 380;
    let borderColor = '#fff';
    let borderWidth = 5;
    let backgroundOpacity = '0.7';
    // parameters -----------------------------------

    // ajusta a máscara
    if ( aspectIdeal > aspectCurrent ) {
        console.log( 'aspectIdeal', aspectIdeal );
        console.log( 'aspectCurrent', aspectCurrent );

        let percDiff = (aspectCurrent / aspectIdeal);
        percDiff = percDiff * 1.1;
        
        console.log( '**percDiff', percDiff );

        mWidth = mWidth * percDiff;
        mHeight = mHeight * percDiff;
        console.log( 'mWidth', mWidth );
        console.log( 'mHeight', mHeight );
    }

    let exists = document.getElementById( 'svgMask' ) !== null;
    let mBoxXCenter = mBoxWidth / 2;
    let mBoxYCenter = mBoxHeight / 2;

    let halfMWidth = ( mWidth / 2 );
    let halfHeight = ( mHeight / 2 );
    let half14Height = ( mHeight / 4 );
    let fractionX = 0.15;
    let fractionWidthX = ( halfMWidth * fractionX );

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
    let point3H = mBoxXCenter - ( fractionWidthX * 2 );

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
    if ( !svgMask ) {
        svgMask = document.createElementNS( xmlns, "svg" );
    }

    // svg attributes
    svgMask.setAttributeNS( null, "viewBox", "0 0 " + mBoxWidth + " " + mBoxHeight );
    svgMask.setAttributeNS( null, "width", mBoxWidth );
    svgMask.setAttributeNS( null, "height", mBoxHeight );
    svgMask.style.display = "block";
    svgMask.setAttributeNS( null, 'id', `svgMask` );

    // definitions
    if ( !defs ) {
        defs = document.createElementNS( xmlns, 'defs' );
    }

    // style
    if ( !style ) {
        style = document.createElementNS( xmlns, 'style' );
    }
    style.textContent = `.cls-background{opacity:${backgroundOpacity};}.cls-focus{fill:none;stroke:${borderColor};stroke-miterlimit:10;stroke-width:${borderWidth}px;}`;

    if ( !groupMain ) {
        groupMain = document.createElementNS( xmlns, 'g' );
    }

    // main group
    groupMain.setAttributeNS( null, 'id', `main` );
    groupMain.setAttributeNS( null, 'data-name', `main` );

    // maks group
    if ( !groupMask ) {
        groupMask = document.createElementNS( xmlns, 'g' );
    }

    groupMask.setAttributeNS( null, 'id', `mask` );

    // background
    if ( !pathBackground ) {
        pathBackground = document.createElementNS( xmlns, 'path' );
    }

    pathBackground.setAttributeNS( null, 'id', `background` );
    pathBackground.setAttributeNS( null, 'class', `cls-background` );
    pathBackground.setAttributeNS( null, 'd', d );

    if ( !pathFocus ) {
        pathFocus = document.createElementNS( xmlns, 'rect' );
    }

    // focus
    pathFocus.setAttributeNS( null, 'id', `focus` );
    pathFocus.setAttributeNS( null, 'class', `cls-focus` );
    pathFocus.setAttributeNS( null, 'x', point4X );
    pathFocus.setAttributeNS( null, 'y', point6Y );
    pathFocus.setAttributeNS( null, 'width', mWidth );
    pathFocus.setAttributeNS( null, 'height', mHeight );
    pathFocus.setAttributeNS( null, 'rx', arcXY );

    // structure
    if ( !exists ) {
        groupMask.appendChild( pathBackground );
        groupMask.appendChild( pathFocus );
        groupMain.appendChild( groupMask );
        defs.appendChild( style );
        svgMask.appendChild( defs );
        svgMask.appendChild( groupMain );
        document.getElementById( 'box-camera' ).appendChild( svgMask );
    }
}

const init = () => {
    addClickEvent();
    startCamera();
    addEventPlay();
    addEventResize();
    loadMask();
}

window.addEventListener( "orientationchange", orientationChange );
window.onload = function () {
    // document.getElementById('result').innerHTML = 'Carregando modelos...';
    // document.getElementById('result').style.display = 'block';

    mobile = isMobile();

    if ( mobile ) {
        document.getElementById( "box-camera" ).style.width = screen.width + 'px';
        document.getElementById( "box-camera" ).style.height = screen.height + 'px';
        // document.getElementById('message').style.top = `${screen.height / 2 - ((flow === 1 ? maskConfiguration.heightNear : maskConfiguration.heightFar) / 2 + 40)}px`;
        // document.getElementById('result').style.bottom = `${screen.height / 2 - (maskConfiguration.heightNear / 2)}px`;
    } else {
        // document.body.classList.add("body-web");
    }

    document.body.style.overflow = "hidden";
    init();
};
//window.addEventListener("load", init, false);
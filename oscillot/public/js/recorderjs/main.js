/* Copyright 2013 Chris Wilson

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

window.AudioContext = window.AudioContext || window.webkitAudioContext;

var audioContext = new AudioContext();
var audioInput = null,
    realAudioInput = null,
    inputPoint = null,
    audioRecorder = null;
var rafID = null;
var analyserContext = null;
var analyserNode = analyserNode || null;
var canvasWidth, canvasHeight;
var recIndex = 0;

/* TODO:

- offer mono option
- "Monitor input" switch
*/

function saveAudio() {
    audioRecorder.exportWAV( doneEncoding );
    // could get mono instead by saying
    // audioRecorder.exportMonoWAV( doneEncoding );
}

function gotBuffers( buffers ) {
    setTimeout(function () {
        //console.log(JSON.stringify(buffers));
        var canvas = document.querySelector('.wavedisplay[data-clip-id=' + window.clipId + ']')
        canvas = canvas || document.createElement('canvas')
        
        canvas.width = window.innerWidth
        canvas.height = 200
        drawBuffer(canvas, buffers[0])
    
        // the ONLY time gotBuffers is called is right after a new recording is completed - 
        // so here's where we should set up the download.
        
        //Recorder.forceDownload( buffers[0], "myRecording" + ((recIndex<10)?"0":"") + recIndex + ".wav", "#save")
        audioRecorder.exportWAV(doneEncoding)
    }, 50)
}

function doneEncoding( blob ) {
    //var link = Recorder.forceDownload( blob, "myRecording" + ((recIndex<10)?"0":"") + recIndex + ".wav", "#save")
    //link.id = "save"
    //link.style.opacity = 1
    //var elem = document.getElementById('save')
    //var parent = elem.parentElement
    //var img = elem.children[0]
    //parent.removeChild(elem)
    //link.appendChild(img)
    //parent.appendChild(link)
    //recIndex++
}

function toggleRecording( elem ) {
    
    //if (!elem || JSON.stringify(elem) === '{}') throw new Error('Requires an html element.')
    //console.log(elem.className)
    if (elem.classList.contains("recording")) {
        // stop recording
        audioRecorder.stop()
        elem.classList.remove("recording")
        audioRecorder.getBuffer(gotBuffers)
    } else {
        // start recording
        if (!audioRecorder) return
        elem.classList.add("recording")
        audioRecorder.clear()
        audioRecorder.record()
    }
}

function convertToMono( input ) {
    var splitter = audioContext.createChannelSplitter(2);
    var merger = audioContext.createChannelMerger(2);

    input.connect( splitter );
    splitter.connect( merger, 0, 0 );
    splitter.connect( merger, 0, 1 );
    return merger;
}

function cancelAnalyserUpdates() {
    window.cancelAnimationFrame( rafID );
    rafID = null;
}

function updateAnalysers(time) {
    if (!analyserContext) {
        var canvas = document.getElementById("analyser");
        canvasWidth = canvas.width;
        canvasHeight = canvas.height;
        analyserContext = canvas.getContext('2d');
    }

    var SPACING = 3;
    var BAR_WIDTH = 1;
    var numBars = Math.round(canvasWidth / SPACING);
    var freqByteData = new Uint8Array(analyserNode.frequencyBinCount);

    // TODO: Test out windowing functions / pitch shifting
    analyserNode.getByteFrequencyData(freqByteData);
    
    analyserContext.clearRect(0, 0, canvasWidth, canvasHeight);
    analyserContext.fillStyle = '#F6D565';
    analyserContext.lineCap = 'round';
    var multiplier = analyserNode.frequencyBinCount / numBars;

    // Draw rectangle for each frequency bin.
    for (var i = 0; i < numBars; ++i) {
        var magnitude = 0;
        var offset = Math.floor( i * multiplier );
        // gotta sum/average the block, or we miss narrow-bandwidth spikes
        for (var j = 0; j< multiplier; j++)
            magnitude += freqByteData[offset + j];
        magnitude = magnitude / multiplier;
        var magnitude2 = freqByteData[i * multiplier];
        analyserContext.fillStyle = "hsl( " + Math.round((i*360)/numBars) + ", 100%, 50%)";
        analyserContext.fillRect(i * SPACING, canvasHeight, BAR_WIDTH, -magnitude);
    }
    
    rafID = window.requestAnimationFrame( updateAnalysers );
    // For performance testing: setTimeout(updateAnalysers, 1000);
}

function toggleMono() {
    if (audioInput != realAudioInput) {
        audioInput.disconnect();
        realAudioInput.disconnect();
        audioInput = realAudioInput;
    } else {
        realAudioInput.disconnect();
        audioInput = convertToMono( realAudioInput );
    }

    audioInput.connect(inputPoint);
}

function gotStream(stream) {
    inputPoint = audioContext.createGain();

    // Create an AudioNode from the stream.
    realAudioInput = audioContext.createMediaStreamSource(stream);
    audioInput = realAudioInput;
    audioInput.connect(inputPoint);

    // audioInput = convertToMono( input );

    analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 2048;
    inputPoint.connect( analyserNode );

    audioRecorder = new Recorder( inputPoint /*, { bufferLen: 4096 }*/);

    zeroGain = audioContext.createGain();
    zeroGain.gain.value = 0.0;
    inputPoint.connect( zeroGain );
    zeroGain.connect( audioContext.destination );
    updateAnalysers();
}

function gotStream(stream) {
    realAudioInput = audioContext.createMediaStreamSource(stream);

    analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 2048;
    realAudioInput.connect( analyserNode );

    //var oscillator = audioContext.createOscillator();
    //oscillator.connect(realAudioInput);
    
    audioRecorder = new Recorder( realAudioInput );
    updateAnalysers();
}

function initAudio() {
        if (!navigator.getUserMedia)
            navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        if (!navigator.cancelAnimationFrame)
            navigator.cancelAnimationFrame = navigator.webkitCancelAnimationFrame || navigator.mozCancelAnimationFrame;
        if (!navigator.requestAnimationFrame)
            navigator.requestAnimationFrame = navigator.webkitRequestAnimationFrame || navigator.mozRequestAnimationFrame;

    navigator.getUserMedia(
        {
            "audio": {
                "mandatory": {
                    "googEchoCancellation": "false",
                    "googEchoCancellation2": "false",
                    "googAutoGainControl": "false",
                    "googNoiseSuppression": "false",
                    "googNoiseSuppression2": "false",
                    "googHighpassFilter": "false",
                    "googTypingNoiseDetection": "false"
                },
                "optional": []
            },
        }, gotStream, function(e) {
            alert('Error getting audio');
        });
}

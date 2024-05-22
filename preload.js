const { contextBridge, ipcRenderer } = require('electron')
const test_addon = require('../test/build/Release/test_addon.node')
const AudioVisualizer = require('../voiceChat-electron-tailscale/js/AudioLevelVisualizer')


function concatenateByteArrays(array1, array2) {
    const result = new Uint8Array(array1.length + array2.length);
    result.set(array1, 0);
    result.set(array2, array1.length);
    return result;
}
function getHEXofArrsyBuffer(arrayBuffer) {
    const uint8Array = new Uint8Array(arrayBuffer);
    let hexString = '';
    for (let i = 0; i < uint8Array.length; i++) {
        let hex = uint8Array[i].toString(16);
        hex = hex.length === 1 ? '0' + hex : hex; // Add leading zero if necessary
        hexString += hex;
    }
    return hexString
}

const ctx_main = new AudioContext();
const destinationNode = ctx_main.createMediaStreamDestination()
const stream = destinationNode.stream

let randomNoiseNode
ctx_main.audioWorklet.addModule('random-noise-processor.js')
    .then(() => {
        randomNoiseNode = new AudioWorkletNode(ctx_main, "random-noise-processor",)
        //randomNoiseNode.connect(destinationNode)
    })

let handleAddonData
ctx_main.audioWorklet.addModule('handle-addon-data.js')
    .then(() => {
        handleAddonData = new AudioWorkletNode(ctx_main, 'handle-addon-data')
        handleAddonData.port.onmessage = (event) => {
            if (event.data.type === 'bufferLength') {
                document.getElementById('bufferLenth').innerHTML = 'buffer length in audioworklet: ' + event.data.data
            } else {
                document.getElementById('interval').innerHTML = 'audio data to processor interval: ' + event.data + 'ms'
            }
        }
        handleAddonData.connect(destinationNode)
    })

let wavProcessor
ctx_main.audioWorklet.addModule('wav-processor.js')
    .then(() => {
        wavProcessor = new AudioWorkletNode(ctx_main, 'wav-processor')
        //wavProcessor.connect(destinationNode)
    })
let audiobuffer
fetch('../test/src/loopback-capture.wav')
    .then((response) => {
        return response.arrayBuffer()
    })
    .then((arrayBuffer) => {
        const a = arrayBuffer.slice(0)
        ctx_main.decodeAudioData(arrayBuffer)
            .then((audioBuffer) => {
                //console.log("fetched wav file \nduration: " + audioBuffer.duration + "\nlength: " + audioBuffer.length + "\nsamplerate: " + audioBuffer.sampleRate)
                return audioBuffer.getChannelData(0)
            })
            .then((audioBuffer) => {
                //wavProcessor.port.postMessage(audioBuffer)
                audiobuffer = audioBuffer
            })
    })




/*
test_addon.initializeCapture()
const audioFormat = test_addon.getAudioFormat()
console.log(audioFormat)
let handleAddonData_postSwitch = true
setInterval(async () => {

    /*
    let bufferByteArray = new Uint8Array(0);
    let CallCount = 0
    let data = test_addon.getBuffer()
    while (data !== null) {
        if (data !== null) {
            CallCount++
            //console.log('callcout:' + CallCount + ', available frames:' + data.nNumFramesAvailable + ', captured frames:' + data.nNumFramesCaptured)
            const byteArray = data.originMemoryData
            bufferByteArray = concatenateByteArrays(bufferByteArray, byteArray)
        }
        data = test_addon.getBuffer()
    }

    const audioBufferCollection = test_addon.getHalfSecWAV()
    //console.log(audioBufferCollection)
    if (handleAddonData_postSwitch) {
        //handleAddonData.port.postMessage(audioBufferCollection[0])
        const wavArrayBuffer = test_addon.getWAVfromfile().wavData.buffer
        const wavAudioBuffer = await ctx_main.decodeAudioData(wavArrayBuffer)
        const wavChannelData = wavAudioBuffer.getChannelData(0)
        //handleAddonData.port.postMessage(wavChannelData)
        const constructedAudiobuffer =test_addon.getWAVfromfile()[0]
        handleAddonData.port.postMessage(constructedAudiobuffer)
        //handleAddonData_postSwitch = false
    }
    if (audiobuffer) {
        //wavProcessor.port.postMessage(audiobuffer)
    }
}, 500)*/

let chromeProcessId = null
const processesList = test_addon.getAudioProcessInfo()
processesList.forEach(item => {
    const pName = item.processName
    if (pName === 'chrome.exe') {
        chromeProcessId = item.processId
        console.log("chrome process id: " + chromeProcessId)
    }
})

function contructBuffer(pcmData) {
    let channelData = [];
    const nChannels = 2;
    const wBitsPerSample = 32;
    const nSamplesPerSec = 48000;
    const bytesPerSample = wBitsPerSample / 8;
    const length = pcmData.length / bytesPerSample / nChannels;

    for (let channel = 0; channel < nChannels; channel++) {
        channelData[channel] = new Float32Array(length);
    }

    for (let i = 0; i < length; i++) {
        for (let channel = 0; channel < nChannels; channel++) {
            let sample = 0;
            for (let byte = 0; byte < bytesPerSample; byte++) {
                const value = pcmData[i * nChannels * bytesPerSample + channel * bytesPerSample + byte];
                sample |= value << (byte * 8);
            }

            // 将 sample 值归一化到 -1 到 1 的范围
            const normalizedSample = (sample - (1 << (wBitsPerSample - 1))) / (1 << (wBitsPerSample - 1));
            channelData[channel][i] = normalizedSample;
        }
    }

    return {
        constructAudioBufferData: {
            nSampleRate: nSamplesPerSec,
            length: length,
            nChannels: nChannels,
            wBitsPerSample: wBitsPerSample,
            "0": channelData[0],
            "1": channelData[1]
        }
    };
}

window.addEventListener('DOMContentLoaded', () => {
    const localAudio = document.getElementById('mic')
    localAudio.srcObject = stream
    const canvas = document.getElementById('canvas')
    const visualizer = new AudioVisualizer(stream, canvas, 128);
    visualizer.start()

    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }

    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency])
    }
    /*
    setInterval(async () => {
        const wavArrayBuffer = test_addon.getWAVfromfile().wavData.buffer
        //console.log(getHEXofArrsyBuffer(wavArrayBuffer))
        const wavAudioBuffer = await ctx_main.decodeAudioData(wavArrayBuffer)
        const wavChannelData = wavAudioBuffer.getChannelData(0)
        console.log("channel 0 data decode in js: ", wavChannelData)
        handleAddonData.port.postMessage(wavChannelData)
        
        const constructedAudiobuffer = contructBuffer(test_addon.getWAVfromfile().pcmData)
        console.log("channel 0 data decode in cpp by ConstructAudioBufferData:", constructedAudiobuffer)
        
        const arrayBufferwithHeader = test_addon.getWAVfromfile().wavBuffer.buffer
        console.log(getHEXofArrsyBuffer(arrayBufferwithHeader))
        const decodedwavBuffer = await ctx_main.decodeAudioData(arrayBufferwithHeader)
        const c0 = decodedwavBuffer.getChannelData(0)
        console.log("channel 0 of decoded wavBuffer: ", c0)

        const header = new Uint8Array([82, 73, 70, 70, 72, 226, 29, 0, 87, 65, 86, 69, 102, 109, 116, 32, 40, 0, 0, 0, 254, 255, 2, 0, 128, 187, 0, 0, 0, 220, 5, 0, 8, 0, 32, 0, 22, 0, 32, 0, 3, 0, 0, 0, 3, 0, 0, 0, 0, 0, 16, 0, 128, 0, 0, 170, 0, 56, 155, 113, 102, 97, 99, 116, 4, 0, 0, 0, 0, 0, 0, 0, 100, 97, 116, 97, 0, 226, 29, 0])
        const combinedData = concatenateByteArrays(header, test_addon.getWAVfromfile().pcmData)
        const arrayBufferwithHeader = combinedData.buffer
        const audioBufferwithHeader = await ctx_main.decodeAudioData(arrayBufferwithHeader)
        const c0 = audioBufferwithHeader.getChannelData(0)
        handleAddonData.port.postMessage(c0)
    }, 5000);*/
    /*
    test_addon.initializeCapture()
    console.log(test_addon.getAudioFormat())
    setInterval(() => {
        const result = test_addon.getBuffer()
        console.log(result)
    }, 20);*/
    console.log(test_addon.initializeCapture())

    let cLoopbackInitialized = false
    if (chromeProcessId === null) {
        console.log("chrome is not running")
    } else {

        const res = test_addon.initializeCLoopbackCapture(chromeProcessId)
        console.log(res)
        const timer = setInterval(async () => {
            const res = test_addon.getActivateStatus()
            if (res.interfaceActivateResult === 0) {
                //console.log("GetBufferSize: ", test_addon.getProcessCaptureFormat().GetBufferSize)
                const result = test_addon.whileCaptureProcessAudio()
                //console.log(result)
                if (result !== null) {
                    ctx_main.decodeAudioData(result.wavData.buffer)
                        .then((audioBuffer) => {
                            const wavChannelData = audioBuffer.getChannelData(0)
                            handleAddonData.port.postMessage(wavChannelData)
                        })

                }
            }
        }, 10);

    }
})
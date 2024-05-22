
function concatenateByteArrays(array1, array2) {
    const result = new Float32Array(array1.length + array2.length);
    result.set(array1, 0);
    result.set(array2, array1.length);
    return result;
}


class HandleAddonData extends AudioWorkletProcessor {
    constructor() {
        super();
        this.audioBuffer = new Float32Array(0); // 用于缓存外部音频数据
        this.lastReceivedTime = 0;
        this.originData = new Float32Array(0);
        this.offset = 0;
        this.port.onmessage = (event) => {// 拼接外部数据
            //console.log('received data, '+(Date.now()-this.lastReceivedTime))
            this.port.postMessage(Date.now()-this.lastReceivedTime)
            this.lastReceivedTime = Date.now()
            this.audioBuffer = concatenateByteArrays(this.audioBuffer, event.data)
            this.originData = event.data
        };
        
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0]
        output.forEach((channel) => {
            if (!this.audioBuffer.length) {
                channel.fill(0); // 如果dataBuffer为空,输出静默
            } else {
                const blockData = this.audioBuffer.subarray(0, 128)
                channel.set(blockData)
                this.audioBuffer = this.audioBuffer.subarray(128)
            }
        });
        this.port.postMessage({type: 'bufferLength', data: this.audioBuffer.length})
        return true;
    }
}

registerProcessor('handle-addon-data', HandleAddonData);
function concatenateByteArrays(array1, array2) {
    const result = new Float32Array(array1.length + array2.length);
    result.set(array1, 0);
    result.set(array2, array1.length);
    return result;
}

class WavProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.audioBuffer = new Float32Array(0)
        this.offset = 0;
        this.originData = new Float32Array(0)
        this.port.onmessage = (event) => {
            this.audioBuffer = concatenateByteArrays(this.audioBuffer, event.data);
            this.originData = event.data;
            //this.offset = 0;
            //console.log(this.audioBuffer.length, this.originData.length)
        };

    }
    process(inputs, outputs, parameters) {
        const output = outputs[0];
        
        /*
        const channelCount = output.length;
        if (this.audioBuffer.length > 0) {
            for (let channel = 0; channel < channelCount; ++channel) {
                const channelData = output[channel];
                const remaining = this.audioBuffer.length - this.offset;
                const samplesToWrite = Math.min(remaining, channelData.length);

                channelData.set(this.audioBuffer.subarray(this.offset, this.offset + samplesToWrite));
                this.offset += samplesToWrite;
                if (this.offset % 500 === 0) {
                    console.log(this.offset)
                }
                if (this.offset >= this.audioBuffer.length) {
                    this.audioBuffer = new Float32Array(0);
                    this.offset = 0;
                }
            }
        } else {
            // 如果没有音频数据,输出静默
            for (let channel = 0; channel < channelCount; ++channel) {
                output[channel].fill(0);
            }
        }
        */
        output.forEach((channel) => {
            if (!this.audioBuffer.length) {
                channel.fill(0); // 如果dataBuffer为空,输出静默
            } else {
                const blockData = this.audioBuffer.subarray(0, 128)
                channel.set(blockData)
                this.audioBuffer = this.audioBuffer.subarray(128)

            }

        });
        return true;
    }
}

registerProcessor("wav-processor", WavProcessor);

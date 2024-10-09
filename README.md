## 捕获进程音频插件

---

这是一个c++编写，node—gyp编译的JavaScript插件，可以实现录制指定进程输出的音频数据并在js中重建可播放的音频数据

---
这个插件通过WASAPI获取指定进程输出的音频
示例使用一个electron的渲染进程来在不阻塞进程的情况下将录制的音频转换成媒体流，并用一个自制的频谱图显示波形
**目前只支持在页面中还原成单声道**
插件的原理是在c++中通过WASAPI获取指定进程的Audio Capture Client，录制原始pcm音频数据再构造对应的wav头信息
拼接头信息和音频数据后得到了可以被正常解码的类似wav文件的数据，在传给js后可通过AudioContext的decodeAudioData解码成可被直接播放的浮点数数据
数据之后通过audioworklet节点播放和显示频谱图

> 直接传递可播放的pcm数据的实现在考虑中，可能会带来一些性能提升


### 安装要求

要使用自行编译的插件,需要以下工具:

- node-gyp
- Visual Studio构建工具
- Windows SDK
- Windows Implementation Library (WIL)

> 由于binding.gyp配置文件中的头文件目录使用了绝对路径,自行编译需要更改至正确路径。

此仓库编译的node文件位于./build/Release/test_addon.node
~~此仓库中使用打包完成的node模块~~

模块打包仓库位于
https://github.com/Need-an-AwP/win-process-audio-capture

### Electron打包

使用electron-builder打包。dist目录中为打包完成的便携版exe文件,可以直接运行查看效果。
> 由于Electron自动获取的是Chrome的进程,所以Chrome未运行及未播放音频时会检索不到。


### 异步方法调用

capture_async现可实现响应式的方法，期望间隔时间后得到模块返回的wav数据
>由于我没有找到更改m_AudioClient的缓冲区大小的有效方法，所以使用了这个外部缓冲区+异步调用的方式实现这个功能

从audioworket节点中的.port.onmessage方法获取处理节点中的缓冲长度
```
if (event.data.type === 'bufferLength') {
    document.getElementById('bufferLenth').innerHTML = 'buffer length in audioworklet: ' + event.data.data
}
```
当bufferLength为0时意味着该处理节点中的缓冲已被消耗完毕，如果等待补充缓冲的时间过长就会产生音频中断
当中断时间非常短时人耳可能感知不到

在前端页面中添加了一个canvas绘制bufferlength折线图

**以下是关键代码片段，请务必查看[完整的使用案例](./preload.js)**
```
const result = test_addon.getActivateStatus()
console.log(result)
if (result.interfaceActivateResult === 0) {
    const captureControl = test_addon.capture_async(500, (err, result) => {
        if (err) {
            console.error("Capture error:", err);
            return;
        }
        //console.log(result)
        if (result !== null) {
            ctx_main.decodeAudioData(result.wavData.buffer)
                .then((audioBuffer) => {
                    const wavChannelData = audioBuffer.getChannelData(0)
                    handleAddonData.port.postMessage(wavChannelData)
                })
        }
    })

    document.getElementById('stopCapture').addEventListener('click', () => {
        captureControl.stop()
    })
}
```

### 运行测试

在electron部分用了一个简单的纯js页面来测试
使用 `npm i` 安装依赖
使用 `npm start` 运行

如果chrome正在播放音频，electron 会自动获取其进程名并捕获其音频

> 前台显示波形canvas会造成一般cpu占用

### 流畅度测试

连接其他音频输出设备并在electron窗口中选择即可听到单独的捕获音频
**新音频输出设备连接时需要重新启动electron应用，因为音频设备枚举只在应用启动时进行一次**

https://github.com/user-attachments/assets/b642a5bd-b0f9-4e9b-8cc8-c433533f089f

> 这里录制时使用的桌面音频为默认输出，桌面音频2为蓝牙耳机输出

## 参考资料

在众多参考资料中,对本项目最有帮助的是:

- [Record an audio stream with WASAPI](https://stackoverflow.com/questions/64318206/record-an-audio-stream-with-wasapi)
- [Application Loopback Audio Sample](https://learn.microsoft.com/en-us/samples/microsoft/windows-classic-samples/applicationloopbackaudio-sample/)
- [Wave File Format](http://soundfile.sapp.org/doc/WaveFormat/)

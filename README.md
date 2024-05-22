## 捕获进程音频插件

---

这是一个c++编写，node—gyp编译的JavaScript插件，可以实现录制指定进程输出的音频数据并在js中重建可播放的音频数据
<br>
要使用自行编译的插件，需要node-gyp, vs构建工具，windows sdk，wil
由于我的binding.gyp配置文件中的头文件目录使用了绝对路径，自行编译需要更改至正确路径
我编译的版本位于./build\Release\test_addon.node

---

这个插件通过WASAPI获取指定进程输出的音频
示例使用一个electron的渲染进程来在不阻塞进程的情况下将录制的音频转换成媒体流，并用一个自制的频谱图显示波形

插件的原理是在c++中通过WASAPI获取指定进程的Audio Capture Client，录制原始pcm音频数据再构造对应的wav头信息
拼接头信息和音频数据后得到了可以被正常解码的类似wav文件的数据，在传给js后可通过AudioContext的decodeAudioData解码成可被直接播放的浮点数数据
数据之后通过audioworklet节点播放和显示频谱图

> 手动解码成可播放数据的实现在考虑中，可能会带来一些性能提升

---

在参考的众多资料中对我最有帮助的是<br>
<https://stackoverflow.com/questions/64318206/record-an-audio-stream-with-wasapi>
<br>
<https://learn.microsoft.com/en-us/samples/microsoft/windows-classic-samples/applicationloopbackaudio-sample/>

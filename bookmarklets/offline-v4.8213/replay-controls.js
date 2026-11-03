// Native replay keyboard, pointer controls and speed selection are authoritative.
window.LocalReplayControls={active:()=>!!window.LocalNative?.replayActive(),isPaused:()=>!!window.LocalNative?.replayPaused()};

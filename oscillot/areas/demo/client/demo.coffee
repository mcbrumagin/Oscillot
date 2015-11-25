
isRecording = false
Template.recordButton.events
  "click button": (event) ->
    if not isPlaying
      if isRecording then Audio.stop()
      else Audio.record()
      isRecording = not isRecording
    else console.warn "Audio is playing, cannot record."
    
isPlaying = false
Template.playButton.events
  "click button": (event) ->
    if not isRecording
      if isPlaying then console.log 'Stopping playback.'
      else Audio.play()
      isPlaying = not isPlaying
    else console.warn "Audio is recording, cannot play."
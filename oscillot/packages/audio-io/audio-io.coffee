Audio = new (->
  _ = {}
  
  _.recorder = null
  
  _.Collection = class Collection
    constructor: (@options) ->
      console.log JSON.stringify options: @options
  
  # Smaller buffer = better latency/less time to process effects
  bufferSize = 2048
  
  _.capture = =>
    beginListening = (e) =>
      context = new AudioContext
      
      # Retrieve the current sample rate to be used for WAV packaging
      sampleRate = context.sampleRate
      
      # Creates a gain node
      volume = context.createGain()
      
      # Creates an audio node from the microphone incoming stream
      audioInput = context.createMediaStreamSource e
      
      # Connect the stream to the gain node
      audioInput.connect volume
    
      recordingLength = 0
      _.recorder = context.createScriptProcessor bufferSize, 2, 2
    
      console.log JSON.stringify _.recorder.onaudioprocess
      
      _.leftchannel = []
      _.rightchannel = []
      
      _.recorder.onaudioprocess = (e) ->
        #console.log 'recording', JSON.stringify e
        left = e.inputBuffer.getChannelData 0
        right = e.inputBuffer.getChannelData 1
        
        # Clone the samples
        _.leftchannel.push.apply _.leftchannel, left
        _.rightchannel.push.apply _.rightchannel, right
        
        recordingLength += bufferSize
      
      volume.connect _.recorder
      _.recorder.connect context.destination
    
    promise = navigator.mediaDevices.getUserMedia audio:true
    promise.then beginListening
  
  
  isRecording = false
  _.record = =>
    console.log 'Recording...'
    isRecording = true
    do _.capture
  
  _.stop = =>
    console.log 'Stopping...'
    if isRecording
      do _.recorder.disconnect
      isRecording = false
  
  _.playByteArray = (byteArray) ->
    
    context = new AudioContext
    buf = null
    
    play = ->
      # Create a source node from the buffer
      source = context.createBufferSource()
      source.buffer = buf
      # Connect to the final output node (the speakers)
      source.connect context.destination
      # Play immediately
      source.start 0
    
    console.log byteArray.length
    arrayBuffer = new ArrayBuffer(byteArray.length)
    bufferView = new Float32Array(arrayBuffer, 0, bufferSize)
    i = 0
    while i < byteArray.length
      bufferView[i] = byteArray[i]
      i++
    console.log JSON.stringify array:Array.prototype.slice.call bufferView
    
    if ArrayBuffer.isView bufferView then console.info 'Yep!'
    else console.info 'Nep!'
    
    (context.decodeAudioData arrayBuffer).then (buffer) ->
      buf = buffer
      play()
    
  _.play = =>
    console.log 'Playing...'
    _.playByteArray _.leftchannel
  
  return _
)
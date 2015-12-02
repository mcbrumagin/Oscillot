(function(window){

  var WORKER_PATH = '/js/recorderjs/recorderWorker.js';

  var Recorder = function(source, cfg){
    var config = cfg || {};
    var bufferLen = config.bufferLen || 4096;
    var numChannels = config.numChannels || 2;
    this.context = source.context;
    this.node = (this.context.createScriptProcessor ||
                 this.context.createJavaScriptNode).call(this.context,
                 bufferLen, numChannels, numChannels);
    var worker = new Worker(config.workerPath || WORKER_PATH);
    worker.postMessage({
      command: 'init',
      config: {
        sampleRate: this.context.sampleRate,
        numChannels: numChannels
      }
    });
    var recording = false,
      currCallback;

    this.node.onaudioprocess = function(e){
      if (!recording) return;
      var buffer = [];
      for (var channel = 0; channel < numChannels; channel++){
          buffer.push(e.inputBuffer.getChannelData(channel));
      }
      worker.postMessage({
        command: 'record',
        buffer: buffer
      });
    }

    this.configure = function(cfg){
      for (var prop in cfg){
        if (cfg.hasOwnProperty(prop)){
          config[prop] = cfg[prop];
        }
      }
    }

    this.record = function(){
      recording = true;
    }

    this.stop = function(){
      recording = false;
    }

    this.clear = function(){
      worker.postMessage({ command: 'clear' });
    }

    this.getBuffer = function(cb) {
      currCallback = cb || config.callback;
      
      cbcopy = currCallback
      currCallback = function (buffers) {
        //console.log('insertClip', Workspace._id, fileInfo.file.slice(0,100))
        arrs = []
        for (var i = 0; i < buffers.length; i++) {
          arrs.push([])
          for (prop in buffers[i]) arrs[i].push(buffers[i][prop])
        }
        
        console.time('insertClip')
        Meteor.call('insertClip', Workspace._id, arrs, function (err, res) {
          
          var done = function () {
            console.timeEnd('insertClip')
            cbcopy(buffers)
          }
          
          if (err) {
            console.error(err)
            done()
          }
          else {
            console.log(res)
            window.clipId = res
            Meteor.subscribe('workspace', Workspace.name, done)
          }
        })
      }
      
      worker.postMessage({ command: 'getBuffer' })
    }

    this.exportWAV = function(cb, type){
      currCallback = cb || config.callback;
      type = type || config.type || 'audio/wav';
      if (!currCallback) throw new Error('Callback not set');
      worker.postMessage({
        command: 'exportWAV',
        type: type
      });
    }

    worker.onmessage = function(e) {
      var blob = e.data;
      currCallback(blob);
    }

    source.connect(this.node);
    this.node.connect(this.context.destination);    //this should not be necessary
  };

  var BinaryFileReader = {
    read: function(file, callback){
      var reader = new FileReader;
  
      var fileInfo = {
        name: file.name,
        type: file.type,
        size: file.size,
        file: null
      }
  
      reader.onload = function(){
        fileInfo.file = new Float32Array(reader.result);
        callback(null, fileInfo);
      }
      reader.onerror = function(){
        callback(reader.error);
      }
  
      reader.readAsArrayBuffer(file);
    }
  }
  
  var readBlob = function (blob, callback) {
    var reader = new FileReader()
    reader.addEventListener("loadend", function() { callback(reader.result) })
    reader.readAsArrayBuffer(blob)
  }
  
  Recorder.forceDownload = function(blob, filename) {
    
    //var url = (window.URL || window.webkitURL).createObjectURL(blob);
    
    BinaryFileReader.read(blob, function(err, fileInfo) {
      if (err) console.error(err)
      else console.log('insertClip', Workspace._id, fileInfo.file.slice(0,100))
      Meteor.call('insertClip', Workspace._id, fileInfo, function (err, res) {
        if (err) console.error(err)
        else {
          console.log(res)
          Meteor.subscribe('workspace', Workspace.name)
        }
      })
    })
    
    //var link = window.document.createElement('a');
    //link.href = url;
    //link.download = filename || 'output.wav';
    //var click = document.createEvent("Event");
    //click.initEvent("click", true, true);
    //return link;
  }

  window.Recorder = Recorder;

})(window);
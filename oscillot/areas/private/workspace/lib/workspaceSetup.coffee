@Clips = new Meteor.Collection 'clips'
@Workspaces = new Meteor.Collection 'workspaces'

if Meteor.isServer
  
  Meteor.methods
    updateWorkspace: (query, update) ->
      Workspaces.update query, update
      
    insertClip: (workspaceId, buffers) ->
      console.log JSON.stringify {workspaceId}
      id = Clips.insert
        workspace: workspaceId
        buffers: buffers
      
      Workspaces.update {_id:workspaceId}, {$push:clips:id}
      
      console.log "Clip created: #{id}"
      return id
  
  Meteor.publish 'workspace', (name) ->
    if not name? then console.warn "Workspace publish requires a name."
    
    workspace = (Workspaces.find name:name).fetch()
    workspace = workspace?[0] or null
    
    if workspace? then id = workspace._id
    else id = Workspaces.insert
      name: name
      title: 'Untitled'
      description: ''
      dateCreated: new Date
      dateModified: null
      clips: []
    
    #console.log id:id
    #console.log 'Redirecting...'
    #Router.go 'workspace', id:id
      
    workspaceCursor = Workspaces.find _id:id
    workspace = workspace or workspaceCursor.fetch()[0]
    clipsCursor = Clips.find _id:$in:workspace.clips
    [workspaceCursor, clipsCursor]
  
  ###
  Meteor.startup ->
    workspaces = Workspaces.find().fetch()
    (Workspaces.remove workspace._id) for workspace in workspaces
    
    Workspaces.insert
      name: 'test'
      title: 'Example Workspace'
      description: 'Describe (optionally) the purpose of this workspace'
      dateCreated: new Date
      dateModified: null
      clips: []
      
    # TODO: Remove when we can playback and delete tracks
    clips = Clips.find().fetch()
    (Clips.remove clip._id) for clip in clips
  ###

if Meteor.isClient
  
  Template.workspaceLayout.events
    "click #record": (e) -> toggleRecording e.currentTarget
    
  Template.workspace.events
    "dblclick .clip": (e) -> playAudio (Clips.findOne @_id).buffers[0]
  
  #Template.workspace.onCreated ->
  
# TODO: Helper
routes = (routes) ->
  for name, config of routes
    config.controller = 'WorkspaceController'
    Router.route name, config

# TODO: Helper
@debounce = (ms, fn) ->
  timeout = null
  (args...) ->
    Meteor.clearTimeout timeout
    timeout = Meteor.setTimeout (-> fn args...), ms

@playAudio = (buffer) ->
  scriptNode = audioContext.createScriptProcessor 4096, 1, 1
  index = 0
  scriptNode.onaudioprocess = (event) ->
    if index > buffer.length
      scriptNode.disconnect audioContext.destination
    
    output = event.outputBuffer.getChannelData 0
    for i in [0..output.length]
      output[i] = buffer[index]
      index += 1
  scriptNode.connect audioContext.destination
  
@playLongest = ->
  buffers = Clips.find().fetch().map (obj) -> obj.buffers[0]
  buffers = buffers.sort (a,b) -> a.length < b.length
  playAudio buffers[0]

timeout = null
redrawWaveforms = debounce 10, ->
  elems = document.getElementsByClassName 'wavedisplay'
  for elem in elems
    clipId = elem.attributes["data-clip-id"].value
    clip = Clips.findOne _id:clipId
    elem.width = window.innerWidth
    elem.height = 200
    drawBuffer elem, clip.buffers[0]
  console.timeEnd 'waitOn workspace subscription'

routes
  workspace:
      path: '/workspace/:name?'
      template: 'workspace'
      # TODO: Make reactive
      waitOn: ->
        console.time 'waitOn workspace subscription'
        [Meteor.subscribe 'workspace', @params.name, redrawWaveforms]
      data: ->
        window.Workspace = Workspaces.findOne()
        workspace: Workspace
        clips: Clips.find().fetch()
      onAfterAction: -> do initAudio
      
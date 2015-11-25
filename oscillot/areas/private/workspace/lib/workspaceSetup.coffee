@Workspaces = new Meteor.Collection 'workspaces'
@Clips = new Meteor.Collection 'clips'

if Meteor.isServer
  
  Meteor.publish (id) ->
    if not id
      id = Workspaces.insert
        title: 'Untitled'
        description: ''
        dateCreated: new Date
        dateModified: null
        clips: []
      console.log 'Redirecting'
      Router.go 'workspace', id:id
    Workspaces.find(_id:id).fetch()
  
  Meteor.startup ->
    workspaces = Workspaces.find().fetch()
    if workspaces.length is 0
      id1 = Clips.insert {data: [0.001,0.002,0.003,0.004], offset: 0}
      id2 = Clips.insert {data: [0.006,0.008,0.01,0.0013], offset: 4}
      
      console.log {id1, id2}
      
      Workspaces.insert
        title: 'Example Workspace'
        description: 'Describe (optionally) the purpose of this workspace'
        dateCreated: new Date
        dateModified: null
        clips: [id1, id2]
      

# TODO: Helper
routes = (routes) ->
  for name, config of routes
    config.controller = 'WorkspaceController'
    Router.route name, config

routes
  workspace:
      path: '/workspace/:id?'
      template: 'demoTest'
      waitOn: -> [Meteor.subscribe 'workspace', @params.id]
      data: -> Workspaces.findOne()
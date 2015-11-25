routes = (routes) ->
  for name, config of routes
    config.controller = 'DemoController'
    Router.route name, config

routes
  demo: template: 'demoTest'
  webaudio:
    template: 'webaudiodemo'
    onAfterAction: -> do initAudio

routes = (routes) ->
  for name, template of routes
    Router.route name,
      template: template
      controller: 'AdminController'

routes admin: 'admin'
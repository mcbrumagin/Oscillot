@DefaultController = RouteController.extend
  loadingTemplate: 'loading'
  layoutTemplate: 'layout'
  
Router.configure controller: 'DefaultController'

# Demo route
@DemoController = DefaultController.extend
  layoutTemplate: 'demoLayout'


# Community routes
@CommunityController = DefaultController.extend
  layoutTemplate: 'communityLayout'


# Admin routes
@AdminController = DefaultController.extend
  layoutTemplate: 'adminLayout'


# Private routes
@PrivateController = DefaultController.extend
  layoutTemplate: 'privateLayout'
  
@WorkspaceController = PrivateController.extend
  layoutTemplate: 'workspaceLayout'
  
@ProjectController = PrivateController.extend
  layoutTemplate: 'projectLayout'
  
@ProfileController = PrivateController.extend
  layoutTemplate: 'profileLayout'

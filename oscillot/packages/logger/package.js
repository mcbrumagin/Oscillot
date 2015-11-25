Package.describe({
    summary: 'Logger collection and methods',
    version: '1.0.0',
    name: 'logger'
})

Package.onUse(function(api) {
    api.versionsFrom('1.0.4.1')
    
    api.use('templating', 'client')
    api.use(['coffeescript'], ['client', 'server'])

    api.addFiles('client/logger.html', 'client')
    api.addFiles('client/logger.css', 'client')
    api.addFiles('logger.coffee')

    api.export('Logger', ['client', 'server'])
})
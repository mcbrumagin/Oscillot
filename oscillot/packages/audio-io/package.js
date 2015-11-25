Package.describe({
    summary: 'Audio collections, recording, and playack',
    version: '0.0.0',
    name: 'audio-io'
})

Package.onUse(function(api) {
    api.use(['coffeescript'], ['client', 'server'])
    api.addFiles('audio-io.coffee', ['client'])
    api.export('Audio', ['client'])
})

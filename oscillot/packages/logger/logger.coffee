Logs = new Meteor.Collection 'logs'

Logger = class
  _ = @

  copy = {}
  # Stores a copy of bound console methods
  custom = {}
  # Stores a custom logger

  logDb = (type, args) ->
    if args != undefined
      log =
        type: type
        content: args
        date: new Date
      if Meteor.isServer
        Logs.insert log
      else
        Meteor.call 'createLog', log, (err, res) ->
          if err then Logger.error 'Failed to save log.', err

  createLogger = (type) ->
    (args) -> logDb type, args
  createDbLoggers = (types) ->
    types = types.split ' '
    loggers = {}
    for type in types
      loggers[type] = createLogger type
    loggers

  db = createDbLoggers 'log info warn error'

  log = (type) ->
    args = Array::slice.call(arguments, 1)
    args = if args.length > 1 then args else args[0]
    # Call the regular old console
    copy[type] args
    # TODO: Spoof console line numbers
    # Log to db
    db[type] args

  eachWord = (words, fn) ->
    words.split(' ').forEach fn

  methodNames = 'log info warn error'
  eachMethod = (args...) -> eachWord methodNames, args...
  eachMethod (method) ->
    copy[method] = console[method].bind(console)
  eachMethod (method) ->
    custom[method] = (args...) -> log method, args...

  _.isEnabled = false
  setMethods = (useCustom) ->
    if useCustom? then _.isEnabled = true
    else _.isEnabled = false
    
    methods = if useCustom then custom else copy
    for logger of copy
      if copy.hasOwnProperty(logger)
        @[logger] = methods[logger]
        console[logger] = methods[logger]

  # Switch between copy or custom for console and this
  _.enable = -> setMethods true
  _.disable = setMethods

  _.wrap = (fn) ->
    ->
      Logger.enable()
      result = fn.apply(this, arguments)
      Logger.disable()
      result

  _.clear = ->
    if window and window.console and window.console.clear
      window.console.clear()
    Meteor.call 'deleteAllLogs'
    
  _.console = copy


if Meteor.isClient
  Meteor.startup -> Meteor.subscribe 'logs'
  Template.logs.helpers log: -> Logs.find({}, sort: date: -1).fetch()
  Template.logItem.helpers
    date: -> @date.toLocaleString()
    content: -> JSON.stringify @content, null, 2

if Meteor.isServer
  deleteAll = ->
    Logs.remove log._id for log in Logs.find().fetch()
  Meteor.startup -> deleteAll()
  Meteor.publish 'logs', -> Logs.find()
  Meteor.methods
    createLog: (log) -> Logs.insert log
    deleteAllLogs: -> deleteAll()
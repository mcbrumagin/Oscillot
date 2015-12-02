// TODO: Helper
var timer = function (timerName, fn) {
    return function () {
        console.time(timerName)
        fn.apply(this, arguments)
        console.timeEnd(timerName)
    }
}

function drawBuffer( canvas, data ) {
    
    var step = Math.ceil( data.length / canvas.width )
    // TODO: Find average per step for a smoother curve (worse performance)?
    
    var amp = canvas.height / 2
    var context = canvas.getContext('2d')
    context.fillStyle = "silver"
    context.clearRect(0,0, canvas.width, canvas.height)
    for(var i = 0; i < canvas.width; i++) {
        var min = 1.0
        var max = -1.0
        for (var j=0; j<step; j++) {
            var datum = data[(i*step)+j]
            if (datum < min) min = datum
            if (datum > max) max = datum
        }
        context.fillRect(i,(1+min)*amp,1, Math.max(1,(max-min)*amp) )
    }
}

drawBuffer = timer('drawBuffer', drawBuffer)
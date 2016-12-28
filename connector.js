var builder = require('botbuilder');
var restify = require('restify');
var dialog = require('./dialog');

module.exports = {
    start: function () {
        var server = restify.createServer();
        server.listen(process.env.port || process.env.PORT || 3979, function () {
            console.log('listening on 3979');
        });
        var connector = new builder.ChatConnector({
            appId: process.env.MICROSOFT_APP_ID,
            appPassword: process.env.MICROSOFT_APP_PASSWORD
        });
        
        var bot = new builder.UniversalBot(connector);
        
        server.use(restify.queryParser());

        server.post('/api/messages', connector.listen());

        bot.dialog('/', dialog);

    }
}


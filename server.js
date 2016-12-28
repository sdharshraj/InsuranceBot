var builder = require('botbuilder');
var dotenv = require('dotenv');
dotenv.load();

var ConnectorBot = require('./connector');

var connectorBot = ConnectorBot.start();

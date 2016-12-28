
var builder = require('botbuilder');
var https = require('https');
var querystring = require('querystring');
var prompts = require('./prompt.js');

var model = process.env.LUIS_MODEL;
var recognizer = new builder.LuisRecognizer(model)
var dialog = new builder.IntentDialog({ recognizers: [recognizer] });
var insuranceData = require('./InsuranceData.json');
var pid = "";

module.exports = dialog
    .matches('Greet', [greet, authenticate, validateCustomer, policies])
    .onDefault([NotUnderstood]);

function greet(session, args, next) {
    session.send(prompts.userWelcomeMessage);
    builder.Prompts.choice(session, 'I can help you with the the following things: Please choose one', serviceType);
}

function service(session, results, next) {
}

function NotUnderstood(session, args) {
    session.send("Sorry i could not understand.");
}

function authenticate(session, args, next) {
    builder.Prompts.text(session, "I will do it for you, May i know your customerId.");
}

function validateCustomer(session, results, next) {
    var validCustomerId = results.response.match('\\b[Cc]?[0-9]{6,6}\\b');
    if (validCustomerId != null) {
        insuranceData.Customers.map(function (iData) {
            if (iData.CustomerID === validCustomerId[0]) {
                session.userData.CID = iData.CustomerID;
                session.send("Hello " + iData.FirstName + " " + iData.LastName);
                next();
            }
        })
    }
    else {
        session.send("Sorry this id is not registered with us.");
        authenticate(session);
    }
}

function policies(session, args, next) {
    var customerId = session.userData.CID;
    var mssg = "";
    session.send("Thanks for authentication , You have the following policies with us:");
    insuranceData.Customers.map(function (iData) {
        if (iData.CustomerID === customerId) {
            for (var i = 0; i < iData.Insurance.length; i++) {
                mssg += "\nInsurance Type " + iData.Insurance[i].Type + " - " + iData.Insurance[i].PolicyNumber;
            }
             session.send(mssg);
        }
    })

    builder.Prompts.choice(session,"I can help with the following:", serviceRequest);
}

function createCard(session, items) {
    var card = new builder.HeroCard(session);
    card.title(items.Type);
    card.subtitle(items.Name);
    card.images([builder.CardImage.create(session, items.ImagePath)]);
    card.tap(new builder.CardAction.openUrl(session, items.URL));
    card.buttons([new builder.CardAction.openUrl(session, items.URL, '  Buy it Online  ')
        , new builder.CardAction.imBack(session, items.ProductId, '  Buy it offline  ')
        , new builder.CardAction.openUrl(session, items.URL, '  See more details  ')]
    );

    return card;
}

var serviceType = [
    'Information on Products and Services',
    'Servicing of existing policy'
]

var serviceRequest = [
    'Premium related changes and enquiries',
    'Profile changes',
    'Fund Switch and Premium Redirection'
]

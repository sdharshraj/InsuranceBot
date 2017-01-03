
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
    .matches('Greet', [greet, helpOption, authenticate, validateCustomer, validateOtp, policies, service, premiumOperation])
    .matches('No', no)
    .matches('Yes', yes)
    .matches('PremiumDueAmount', [premiumDueAmount, authenticate, validateCustomer,validateOtp, premiumDueAmount])
    .onDefault([NotUnderstood])

function greet(session, args, next) {
    session.send(prompts.userWelcomeMessage);
    next();
}

function helpOption(session, args, next) {
    builder.Prompts.choice(session, 'I can help you with the the following things: Please choose one', serviceType);
}

function authenticate(session, args, next) {
    builder.Prompts.text(session, "I will do it for you, May i know your customerId.");
}

function validateCustomer(session, results, next) {
    if (results && results.response) {
        var validCustomerId = results.response.match('\\b[Cc]?[0-9]{6,6}\\b');
        if (validCustomerId != null) {
            insuranceData.Customers.map(function (iData) {
                if (iData.CustomerID === validCustomerId[0]) {
                    session.userData.CID = iData.CustomerID;
                    session.send("Hello " + iData.FirstName + " " + iData.LastName);
                    builder.Prompts.text(session, "Before I can share the details with you can I ask for the OTP sent to your registered mobile number ******" + iData.MobileNumber % 10000 + " & registered email id: " + iData.EmailID + " for verification purpose. Please enter the OTP.");
                }
            })
        }
        else {
            builder.Prompts.text(session, "Invalid customer Id please enter correct customerId.");
        }
    }
    else
    builder.Prompts.text(session, "please enter correct customerId.");
}

function validateOtp(session, results, next) {
    //verify OTP
    next();
}
function policies(session, args, next) {
    var customerId = session.userData.CID;
    var mssg = "";
    session.send("Thanks for authentication , You have the following policies with us:");
    var cards;
    cards = insuranceData.Customers.map(function (iData) {
        if (iData.CustomerID === customerId)
            return createCard(session, iData.Insurance)
    })
    var message = new builder.Message(session).attachments(cards[0]).attachmentLayout('carousel');
    session.send(message);
    builder.Prompts.choice(session, "I can help with the following:", serviceRequest);
}

function service(session, results, next) {
    if (results.response.index == 0) {
        builder.Prompts.choice(session, "I can help with the following:", premiumOperations);
    }
    else {
        session.send(results.response.entity + "something check the operations");
    }
}

function premiumOperation(session, results, next) {
    var customerId = session.userData.CID;
    if (results.response.index == 0) {
        session.send("Operation for " + results.response.entity)
    } else if (results.response.index == 1) {
        session.send("Operation for " + results.response.entity)
    } else if (results.response.index == 2) {
        session.send("Operation for " + results.response.entity)
    } else if (results.response.index == 3) {
        session.send("Operation for " + results.response.entity)
    } else if (results.response.index == 4) {
        var cards = insuranceData.Customers.map(function (iData) {
            if (iData.CustomerID === customerId)
                return createPremiumOperationCard(session, iData.Insurance)
        })
        var message = new builder.Message(session).attachments(cards[0]).attachmentLayout('carousel');
        session.send(message);
        var mssg = "Thank you. Please note your reference ID: 453232 \nWe have sent a confirmation mail to your registered email ID. \n You can connect with us @ toll free number 1800 123 4567 at any time for your requests.";
        session.send(mssg);

        session.userData.step = "premiumOperation";
        askAnything(session);
    } else {
        session.endDialogWithResult(results);
    }
}

function createCard(session, insData) {
    var cards = [];
    for (var i = 0; i < insData.length; i++) {
        var card = new builder.HeroCard(session);
        card.title(insData[i].Type);
        card.subtitle("Policy Number : " + insData[i].PolicyNumber);

        cards.push(card);
    }
    return cards;
}

function createPremiumOperationCard(session, premiumData) {
    var cards = [];
    for (var i = 0; i < premiumData.length; i++) {
        var card = new builder.HeroCard(session);
        card.title(premiumData[i].Type + " - " + premiumData[i].PolicyNumber);
        card.subtitle("Premium Amount : (" + premiumData[i].PremiumPayingFrequency + ") : Rs. " + premiumData[i].PremiumDueAmount + "/-");
        cards.push(card);
    }
    return cards;
}

function askAnything(session) {
    session.send("Would you like any other support?");
}

function NotUnderstood(session, args) {
    session.endDialog("Sorry i could not understand.");
}

function no(session) {
    if (session.userData.step === "premiumOperation")
        session.endDialog("Thanks for reaching out to us. Have a Good Day! ");
    else
        NotUnderstood(session);
}

function yes(session, args) {
    if (session.userData.step === "premiumOperation") {
        session.endDialog("We will be happy to help you.");
    }
    else
        NotUnderstood(session);
}

function premiumDueAmount(session, args, next) {
    var customerId = session.userData.CID;
    if (customerId) {
        var cards = insuranceData.Customers.map(function (iData) {
            if (iData.CustomerID === customerId)
                return createPremiumOperationCard(session, iData.Insurance)
        })
        var message = new builder.Message(session).attachments(cards[0]).attachmentLayout('carousel');
        session.send(message);
        var mssg = "Thank you. Please note your reference ID: 453232 \nWe have sent a confirmation mail to your registered email ID. \n You can connect with us @ toll free number 1800 123 4567 at any time for your requests.";
        session.send(mssg);

        session.userData.step = "premiumOperation";
        askAnything(session);
    }
    else {
        next();
    }

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

var premiumOperations = [
    'Change in Premium Frequency',
    'Premium Calendar',
    'Details of Last Paid Premium',
    'Number of Premiums to be paid',
    'Due dates and Amount related'
]
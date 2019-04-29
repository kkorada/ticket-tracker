var cheerio = require("cheerio");
var request = require("request");

const express = require('express');
const app = express();
app.get('/start', (req, res) => {
  clearInterval(pingIntervalRef);
  alertsSent = 0;
  ticketsOpen = false;
  if (req.query.date) {        
    trackingDate = req.query.date;
  }
  startTracking();
  res.send('Started!');
});
app.get('/stop', (req, res) => {
  stopTracking();
  res.send('Stopped!');
});
app.get('/', (req, res) => {
  res.send({
    pageURL,
    ticketsOpen,
    trackingDate,
    pingInterval,
    noOfAlertsRequired,
    alertsSent
  });
});
app.listen(process.env.PORT || 3000, () => console.log(`App running!`));

// variables
var pageURL = "https://in.bookmyshow.com/buytickets/avengers-endgame-hyderabad/movie-hyd-ET00100674-MT/20190501";
var mobileNumber = "9493368638";
var ticketsOpen = false;
var trackingDate = "04";
var pingInterval = 600000;
var noOfAlertsRequired = 2;
var alertsSent = 0;
var pingIntervalRef;

startTracking();
function startTracking() {
  console.log("Starting tracker");
  pingIntervalRef = setInterval(trackTickets, pingInterval);
}

function trackTickets() {
  console.log(alertsSent < noOfAlertsRequired, alertsSent);
  var options = {
    method: "GET",
    url: pageURL,
    headers: {
      "cache-control": "no-cache"
    }
  };
  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    scrapeForDate(body);
  });
}

function scrapeForDate(body) {
  const $ = cheerio.load(body);

  const datesLength = $("#showDates")[0].childNodes.length;
  console.log("No of Available Dates: " + Math.floor(datesLength / 2));

  $("#showDates")[0].childNodes.forEach(function (dateNode) {
    if (dateNode.tagName !== undefined && dateNode.tagName !== null && dateNode.tagName === "li") {
      try {
        if (dateNode.childNodes[1].childNodes[3].childNodes[0].data === trackingDate) {
          sendAlert();
        }
      } catch (error) {
        console.log("Looks like page structure changed!");
        console.log(error);
      }
    }
  });
}

function sendAlert() {
  if (alertsSent < noOfAlertsRequired) {
    ticketsOpen = true;
    var message = "Alert: " + (alertsSent + 1) + ", 4DX Tickets now open for date " + trackingDate + " .";
    sendAlertViaConsole(message);
    sendAlertViaSMS(message, mobileNumber);
    alertsSent++;
  } else {
    stopTracking();
  }
}

function sendAlertViaConsole(message) {
  console.log(message);
}

function sendAlertViaSMS(message, mobileNumber) {
  message = encodeURI(message);
  var options = {
    method: "GET",
    url: "https://api.textlocal.in/send/",
    qs: {
      apikey: "",
      message: message,
      sender: "TXTLCL",
      numbers: mobileNumber
    },
    headers: {
      "cache-control": "no-cache",
      "Content-Type": "application/json"
    }
  };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    console.log(body);
  });
}

function stopTracking() {
  if (pingIntervalRef._idleTimeout !=-1 && ticketsOpen && alertsSent === noOfAlertsRequired) {
    console.log("Stopping tracker.");
    clearInterval(pingIntervalRef);
    console.log("Tracker Stopped.");
  }  
}
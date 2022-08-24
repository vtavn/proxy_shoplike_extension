console.log("loading...");
var status1 = "";
var status2 = "";
var connectTimeout = 0;
var nextchange = 0;
var lastRequest = 0;
var reconnect = false;
var api_key = "";
var _location = "";
var proxyDie;
var method = "new";
var proxyTimeout = 0;

function handleMessage(request, sender, sendResponse) {
  var popupMessage = request.popupMessage;

  if (popupMessage == "getOld") {
    var now = Math.round(new Date().getTime() / 1000);
    sendResponse({
      response: status1 + "|" + status2,
      timeout: lastRequest - now + connectTimeout,
      next_change: lastRequest - now + nextchange,
    });

  } else if (popupMessage == "setNew") {
    clearTimeout(proxyDie);
    var disconnect = request.disconnect;
    var data = request.popupData;
    var dataArr = data.split("|");
    status1 = dataArr[0];
    status2 = dataArr[1];
    connectTimeout = request.popupTimeout;
    nextchange = request.popupNextchange;
    reconnect = request.reconnect;
    api_key = request.api_key;
    _location = request._location;
    method = request.method;
    proxyTimeout = (connectTimeout) * 1000;
    if (method == "old") {
			connectTimeout = 600;
      proxyTimeout = (connectTimeout) * 1000;
    }
    var proxyType2 = "fixed_servers";
    if (disconnect) {
      proxyType2 = "system";
    }
    if (request.proxy != "") {
      var proxyArr = request.proxy.split(":");
      var config = {
        mode: proxyType2,
        rules: {
          singleProxy: {
            scheme: "http",
            host: proxyArr[0],
            port: parseInt(proxyArr[1]),
          },
        },
      };
      chrome.proxy.settings.set(
        { value: config, scope: "regular" },
        function () {}
      );
      if (reconnect) {
				console.log('reconnect 1 : ' + proxyTimeout)
        proxyDie = setTimeout(function () {
          changeIP();
        }, proxyTimeout);
      }
    }
    lastRequest = Math.round(new Date().getTime() / 1000);
    sendResponse({ response: "settingok" });
  }
}

function changeIP() {
  var theUrl =
    "https://proxy.shoplike.vn/Api/getNewProxy?access_token=" +
    api_key +
    "&location=" +
    _location;
  if (method == "old") {
    theUrl =
      "https://proxy.shoplike.vn/Api/getCurrentProxy?access_token=" + api_key;
  }
  req.open("GET", theUrl);
  req.send(null);
}

//chorme httprequest
chrome.runtime.onMessage.addListener(handleMessage);
var req = new XMLHttpRequest();
req.onreadystatechange = function () {
	console.log(req.readyState)
  if (req.readyState === 4) {
    var response = req.responseText;
    var json = JSON.parse(response);
    if (json.status === 'success') {
      proxy = json.data.proxy;
			next_change = parseInt(json.data.nextChange); //time change proxy
      timeout = parseInt(json.data.proxyTimeout)/2; // 1800 seconds = 30 minutes proxyTimeout
      requestOK = true;

      status1 = "<b style='color:green'>" + proxy + "</b>";
      status2 = "Time: " + timeout + "s";
      connectTimeout = timeout;
      nextchange = next_change;
      proxyTimeout = (connectTimeout) * 1000;
      if (method == "old") {
				connectTimeout = 600;
        proxyTimeout = (connectTimeout) * 1000;
      }			
      lastRequest = Math.round(new Date().getTime() / 1000);
      var proxyArr = proxy.split(":");

      var config = {
        mode: "fixed_servers",
        rules: {
          singleProxy: {
            scheme: "http",
            host: proxyArr[0],
            port: parseInt(proxyArr[1]),
          },
        },
      };

      chrome.proxy.settings.set(
        { value: config, scope: "regular" },
        function () {}
      );
      if (reconnect) {
        proxyDie = setTimeout(function () {
          changeIP();
					console.log('reconnect 2 : ' + proxyTimeout)
					status1 = proxy;
					status2 = "Time: " + timeout + "s";		
        }, proxyTimeout);
      }
    } else {
      error = json.mess;
      nextchange = 15;
      status1 = "<b style='color:red'>Connect error!</b>";
      status2 = error;
    }
		console.log(json);
  }

};
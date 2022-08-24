let timeout = 0;
let next_change = 0;
let countDownConnection;
let proxy = "";
let error = "";
let requestOK = false;
let locationSelect = 0;
let proxyDie;
let setWaitting = false;
let disconnect = false;

countDownConnection = setInterval(function () {
  next_change = next_change - 1;
  if (next_change > 0) {
    document.querySelector("#connectButton").innerHTML =
      "CONNECT(" + next_change + ")";
    document.querySelector("#connectButton").disabled = true;
  } else {
    next_change = 0;
    document.querySelector("#connectButton").disabled = false;
    document.querySelector("#connectButton").innerHTML = "CONNECT";
  }
  timeout = timeout - 1;
  // console.log(timeout);
  if (document.querySelector("#status2").innerHTML.includes("Time: ")) {
    if (timeout > 0) {
      let timeoutString = timeout.toString();
      document.querySelector("#status2").innerHTML =
        "Time: " + timeoutString + "s";
    } else {
      document.querySelector("#status1").innerHTML =
        "<b style='color:red'>Proxy die!</a>";
      document.querySelector("#status2").innerHTML = "Time: 0s";
      reloadGUI();
    }
  }
}, 1000);

function saveOptions(e) {
  disconnect = false;
  clearTimeout(proxyDie);
  document.querySelector("#connectButton").disabled = true;
  localStorage.setItem("api_key", document.querySelector("#api_key").value);
  localStorage.setItem(
    "method",
    document.querySelector('input[name="method"]:checked').value
  );
  localStorage.setItem(
    "reconnect",
    document.querySelector("#reconnect").checked
  );

  e.preventDefault();
  requestOK = false;
  timeout = 0;
  next_change = 0;
  proxy = "";
  error = "";
  apiRequest(document.querySelector("#api_key").value, locationSelect);
}

function restoreOptions() {
  document.querySelector("#api_key").value = localStorage.getItem("api_key");

  let methodValue = localStorage.getItem("method");

  if (methodValue === null) {
    methodValue = "new";
  }

  if (methodValue == "old") {
    document.querySelector("#old").checked = true;
  } else {
    document.querySelector("#new").checked = true;
  }

  let reconnectData = localStorage.getItem("reconnect");
  if (reconnectData === null) {
    reconnectData = true;
  }else if(reconnectData == "false") {
    document.querySelector("#reconnect").checked = false;
  }else{
    document.querySelector("#reconnect").checked = true;
  }

  // document.querySelectorAll("#locationSelect option")[1].value;
  let locationChose = localStorage.getItem("locationSelect");
  let optionValue = document.querySelectorAll("#locationSelect option");
  for (let i = 0; i < optionValue.length; i++) {
    if(optionValue[i].value === locationChose){
      document.querySelectorAll("#locationSelect option")[i].selected = true;
      console.log(optionValue[i])
    }
  }

  let sending = chrome.runtime.sendMessage(
    {
      popupMessage: "getOld",
    },
    handleResponse
  );
}

function handleResponse(message) {
  let outRS = message.response;
  if (outRS == "settingok") {
  } else {
    let rsArr = outRS.split("|");
    document.querySelector("#status1").innerHTML = rsArr[0];
    document.querySelector("#status2").innerHTML = rsArr[1];
    next_change = message.next_change;
    timeout = message.timeout;
    console.log("handle timeout : " + timeout);
    reloadGUI();
  }
}

function handleError(error) {
  console.log(`Error: ${error}`);
}
function apiRequest(api_key, _location) {
  let theUrl =
    "https://proxy.shoplike.vn/Api/getNewProxy?access_token=" +
    api_key +
    "&location=" +
    _location;

  if (document.querySelector('input[name="method"]:checked').value == "old") {
    theUrl =
      "https://proxy.shoplike.vn/Api/getCurrentProxy?access_token=" + api_key;
  }
  req.open("GET", theUrl); // false for synchronous request
  req.send(null);
}

document
  .querySelector("#locationSelect")
  .addEventListener("change", function () {
    locationSelect = document.querySelector("#locationSelect").value;
    localStorage.setItem("locationSelect", locationSelect);
  });

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("#connectButton").addEventListener("click", saveOptions);
document.querySelector("#disconnect").addEventListener("click", function () {
  disconnect = true;
  proxy = "127.0.0.1:1080";
  next_change = next_change;
  timeout = 0;

  document.querySelector("#status1").innerHTML =
    "<b style='color:red'>Disconnected!</a>";
  document.querySelector("#status2").innerHTML = "Ready to connect!";
  next_change = 0;
  document.querySelector("#connectButton").disabled = false;
  document.querySelector("#connectButton").innerHTML = "CONNECT";
  let sending = chrome.runtime.sendMessage(
    {
      popupMessage: "setNew",
      popupData:
        document.querySelector("#status1").innerHTML +
        "|" +
        document.querySelector("#status2").innerHTML,
      popupTimeout: timeout,
      popupNextchange: next_change,
      proxy: proxy,
      reconnect: false,
      disconnect: true,
      api_key: document.querySelector("#api_key").value,
      _location: locationSelect,
      method: document.querySelector('input[name="method"]:checked').value,
    },
    handleResponse
  );
  console.log(locationSelect);
  saveOptions
  clearTimeout(proxyDie);
});

let req = new XMLHttpRequest();
req.onreadystatechange = function () {
  console.log("popup", req);
  if (req.readyState === 4) {
    let response = req.responseText;
    let json = JSON.parse(response);
    if (json.status === "success") {
      proxy = json.data.proxy;
      next_change = parseInt(json.data.nextChange); //time change proxy
      timeout = parseInt(json.data.proxyTimeout)/2; // 1800 seconds = 30 minutes proxyTimeout
      requestOK = true;
      document.querySelector("#status1").innerHTML =
        "<b style='color:green'>" + proxy + "</a>";
      document.querySelector("#status2").innerHTML = "Time: " + timeout + "s";
      reloadGUI();
    } else {
      error = json.mess.toString();
      next_change = json.nextChange;
      document.querySelector("#status1").innerHTML =
        "<b style='color:red'>Connect Error!</a>";
      document.querySelector("#status2").innerHTML = error;
    }
    let sending = chrome.runtime.sendMessage(
      {
        popupMessage: "setNew",
        popupData:
          document.querySelector("#status1").innerHTML +
          "|" +
          document.querySelector("#status2").innerHTML,
        popupTimeout: timeout,
        popupNextchange: next_change,
        proxy: proxy,
        reconnect: document.querySelector("#reconnect").checked,
        api_key: document.querySelector("#api_key").value,
        _location: locationSelect,
        method: document.querySelector('input[name="method"]:checked').value,
      },
      handleResponse
    );
  }
};

function reloadGUI() {
  if (
    timeout > 0 &&
    !setWaitting &&
    !disconnect
  ) {
    setWaitting = true;
    proxyDie = setTimeout(function () {
      setWaitting = false;
      restoreOptions();
    }, timeout * 1000);
  }
}

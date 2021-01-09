'use strict';

var ID = function () {
    return '_' + Math.random().toString(36).substr(2, 9);
};

function callApi(word, targetLang, clientX, clientY) {
    var xhr = new XMLHttpRequest();
    var url = "https://translation.googleapis.com/language/translate/v2?";
    url += "q=" + word;
    url += "&target=" + targetLang;
    url += "&key=" + "AIzaSyDvZoXuMZdOHH6oedKn0KFco_MC3L7aK2A";
    xhr.open("GET", url, false);
    xhr.send();

    var result = xhr.responseText;
    var responseObj = JSON.parse(result);

    if (responseObj.error) {
        console.log(result);
        alert("There seems to be a problem while translating.");
    } else {
        if (responseObj.data) {
            var translations = responseObj.data.translations;
            if (translations instanceof Array) {
                for (var i = 0; i < translations.length; i++) {
                    var output = translations[i].translatedText;
                    //console.log(result);
                    var t_id = ID();
                    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            text: word,
                            translatedText: output,
                            id: t_id,
                            x: clientX,
                            y: clientY
                        });
                    });
                    saveTranslation(word.trim(), output.trim(), t_id);
                }
            }
        }
    }
}

function saveTranslation(original, translated, id) {
    chrome.storage.local.get({translationHistory: []}, function (result) {
        var translationHistory = result.translationHistory;
        var exists = false;
        var existingId = id;
        //Check if word exists
        for (var i = 0; i < translationHistory.length; i++) {
            if (original.toLowerCase() === translationHistory[i].originalText.toLowerCase()) {
                exists = true;
                existingId = translationHistory[i].id;
                break;
            }
        }

        if (!exists) {
            translationHistory.push({originalText: original, translatedText: translated, id: id});
            if (translationHistory.length > 10) {
                translationHistory.shift();
            }
            chrome.storage.local.set({translationHistory: translationHistory}, function () {
            });
        }
        saveTranslationUrl(existingId);
    });
    increaseTranslationCounter();
}

function saveTranslationUrl(transId) {
    var url = "";
    chrome.tabs.query({'active': true, 'currentWindow': true}, function (tabs) {
        url = tabs[0].url;
    });

    chrome.storage.local.get({translationHistoryUrl: []}, function (result) {
        var translationHistoryUrl = result.translationHistoryUrl;
        var urls = [];
        var existing = false;
        var existing_index = 0;
        for (var i = 0; i < translationHistoryUrl.length; i++) {
            if (transId === translationHistoryUrl[i].id) {
                urls = translationHistoryUrl[i].urls;
                existing = true;
                existing_index = i;
                break;
            }
        }
        urls.push({url: url, date: getCurrentDate()});
        if (urls.length > 5) {
            urls.shift();
        }
        if (existing) {
            translationHistoryUrl[existing_index].urls = urls;
        } else {
            translationHistoryUrl.push({id: transId, urls: urls});
        }
        if (translationHistoryUrl.length > 10) {
            translationHistoryUrl.shift();
        }
        chrome.storage.local.set({translationHistoryUrl: translationHistoryUrl}, function () {
        });
    });
}

function increaseTranslationCounter() {
    chrome.storage.sync.get(['translationCounter'], function (result) {
        var count = result.translationCounter;
        if (!count) {
            count = 0;
        }
        count += 1;
        chrome.storage.sync.set({translationCounter: count}, function () {
        });
    });
}

function getCurrentDate() {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1; //January is 0!

    var yyyy = today.getFullYear();
    if (dd < 10) {
        dd = '0' + dd;
    }
    if (mm < 10) {
        mm = '0' + mm;
    }
    var today = dd + '/' + mm + '/' + yyyy;
    
    return today;
}

function init() {
//    chrome.storage.local.clear(function () {
//        var error = chrome.runtime.lastError;
//        if (error) {
//            console.error(error);
//        }
//    });
//    chrome.storage.sync.clear(function () {
//        var error = chrome.runtime.lastError;
//        if (error) {
//            console.error(error);
//        }
//    });
    chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
        if (msg.action === "updateIcon") {
            if (msg.value) {
                chrome.browserAction.setIcon({path: "/images/icon_enabled.png"});
            } else {
                chrome.browserAction.setIcon({path: "/images/icon_19.png"});
            }
        } else if (msg.action === "openHistory") {
            chrome.tabs.create({url: chrome.runtime.getURL("/history/translation_history.html")});
        } else if (msg.action === "openFlashCards") {
            chrome.tabs.create({url: chrome.runtime.getURL("/flashcards/flashcards.html")});
        } else if (msg.action === "selectedText") {
            chrome.storage.sync.get(['enabled'], function (result) {
                var isEnabled = result.enabled;
                if (isEnabled) {
                    if (msg.value) {
                        chrome.storage.sync.get(['language'], function (result) {
                            var lang = result.language;
                            callApi(msg.value, lang, msg.clientX, msg.clientY);
                        });
                    }
                }
            });
        }
    });
}

window.addEventListener('load', init);


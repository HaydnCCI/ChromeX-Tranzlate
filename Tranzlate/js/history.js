'use strict';

var historyList;

$("#flashcards").click(function () {
    chrome.runtime.sendMessage({
        action: 'openFlashCards'
    });
});

$("#selectAll").click(function (e) {
    var chk_arr = document.getElementsByName("wordsSelection[]");
    var chklength = chk_arr.length;

    for (var k = 0; k < chklength; k++)
    {
        chk_arr[k].checked = e.target.checked;
    }
});

$("#saveAll").click(function (e) {
    var result = confirm("Are you sure you want to save?");
    if (result) {
        var chk_arr = document.getElementsByName("wordsSelection[]");
        var chklength = chk_arr.length;
        var result = [];
        for (var k = 0; k < chklength; k++)
        {
            if (chk_arr[k].checked) {
                result.push(chk_arr[k].value);
            }

        }
        if (result.length > 0) {
            saveFlashCardsArr(result);
        }
    }
});

$("#delAll").click(function (e) {
    var result = confirm("Are you sure you want to delete?");
    if (result) {
        var chk_arr = document.getElementsByName("wordsSelection[]");
        var chklength = chk_arr.length;
        var result = [];
        for (var k = 0; k < chklength; k++)
        {
            if (chk_arr[k].checked) {
                result.push(chk_arr[k].value);
            }

        }
        if (result.length > 0) {
            removeHistoryArr(result);
        }
    }
});

function print_history_list() {
    chrome.storage.local.get({translationHistory: []}, function (result) {
        var translationHistory = result.translationHistory;
        if (!translationHistory) {
            return;
        }
        //console.log(translationHistory);
        historyList = translationHistory;
        chrome.storage.local.get({translationHistoryUrl: []}, function (result) {
            var translationHistoryUrl = result.translationHistoryUrl;
            if (!translationHistoryUrl) {
                return;
            }
            var length = translationHistory.length;
            //for (var i = (length - 1); i >= 0; i--) {
            for (var i = 0; i < length; i++) {
                var urls = [];
                for (var j = 0; j < translationHistoryUrl.length; j++) {
                    if (translationHistory[i].id === translationHistoryUrl[j].id) {
                        urls = translationHistoryUrl[i].urls;
                        break;
                    }
                }
                addRow(translationHistory[i].originalText, translationHistory[i].translatedText, translationHistory[i].id, i, urls);
            }
        });

        checkFlashCardsIsSaved();
    });
}

function addRow(word, translation, id, no, urls) {
    var table = document.getElementById("history_table");
    var row = table.tBodies[0].insertRow();

    var cell0 = row.insertCell(0);
    var cell1 = row.insertCell(1);
    var cell2 = row.insertCell(2);
    var cell3 = row.insertCell(3);
    var cell4 = row.insertCell(4);
    var cell5 = row.insertCell(5);

    cell0.innerHTML = no + 1;

    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = "wordsSelection[]";
    checkbox.value = id;
    cell1.style.textAlign = "center";
    cell1.appendChild(checkbox);

    cell2.innerHTML = word;
    cell3.innerHTML = translation;

    var br = document.createElement("BR");
    cell2.appendChild(br);
    var morelink = document.createElement('a');
    morelink.setAttribute('href', '#');
    morelink.setAttribute('data-content', 'toggle-text');
    morelink.className = "showhide_" + id;
    morelink.innerHTML = 'More >>>';
    morelink.onclick = function () {
        var tid = ".urlLinks_" + id;
        var txt = $(tid).is(':visible') ? 'More >>>' : '<<< Less';
        $(".showhide_" + id).text(txt);
        $(this).next(tid).slideToggle(200);
        return false;
    };
    cell2.appendChild(morelink);

    var urlLinks = document.createElement('div');
    urlLinks.className = "urlLinks_" + id;
    urlLinks.classList.add('hidden');

    var datesDiv = document.createElement("div");
    var datesString = "";
    var ul = document.createElement('ol');
    ul.setAttribute('type', 'a');
    for (var i = 0; i < urls.length; i++) {
        datesString += urls[i].date + "<BR/>";
        var li = document.createElement('li');
        ul.appendChild(li);
        var innerUrl = document.createElement('a');
        innerUrl.setAttribute('target', '_blank');
        innerUrl.setAttribute('href', urls[i].url);
        innerUrl.innerHTML = urls[i].url.substring(0, 50) + "...";
        innerUrl.setAttribute("title", urls[i].url);
        li.appendChild(innerUrl);
    }
    urlLinks.appendChild(ul);
    datesDiv.innerHTML = datesString;
    cell2.appendChild(urlLinks);
    cell4.appendChild(datesDiv);

    var btnDDiv = document.createElement("div");
    btnDDiv.className = "saveDiv";
    btnDDiv.innerHTML = '<i class="fas fa-times-circle"></i>';
    btnDDiv.setAttribute("title", "Remove translation from history");
    btnDDiv.id = id + "_del";

    btnDDiv.addEventListener("click", function () {
        var result = confirm("Are you sure you want to delete?");
        if (result) {
            removeHistory(id);
        }
        //removeFlashCards(e.target.parentNode.id);
    }, false);

    cell5.appendChild(btnDDiv);

    var btnDiv = document.createElement("div");
    btnDiv.className = "saveDiv";
    btnDiv.innerHTML = '<i class="far fa-save"></i>';
    btnDiv.setAttribute("title", "Save translation as flash card");
    btnDiv.id = id;
    btnDiv.addEventListener("click", function () {
        var result = confirm("Are you sure you want to save?");
        if (result) {
            saveFlashCards(word, translation, id);
        }

    });
    cell5.appendChild(btnDiv);
}

function saveFlashCards(original, translated, id) {
    chrome.storage.local.get({flashCards: []}, function (result) {
        var flashCards = result.flashCards;
        if (flashCards.length >= 10) {
            alert("Flashcards limit exceeded. Unable to save flashcard.");
        } else {
            flashCards.push({originalText: original, translatedText: translated, id: id});
            if (flashCards.length > 10) {
                flashCards.shift();
            }
            chrome.storage.local.set({flashCards: flashCards}, function () {
                clearTable();
                init();
            });
        }
    });
}

function saveFlashCardsArr(ids) {
    chrome.storage.local.get({translationHistory: []}, function (result) {
        var translationHistory = result.translationHistory;
        if (!translationHistory) {
            return;
        }

        chrome.storage.local.get({flashCards: []}, function (result) {
            var changed = false;
            var flashCards = result.flashCards;
            if (!flashCards) {
                return;
            }
            var available_spots = 10 - flashCards.length;
            if (available_spots == 0 || ids.length > available_spots) {
                alert("Flashcards limit exceeded. Unable to save flashcard.");
                return;
            }
            var i = translationHistory.length;
            while (i--) {
                if (include(ids, translationHistory[i].id)) {
                    var duplicate = false;
                    for (var j = 0; j < flashCards.length; j++) {
                        if (flashCards[j].originalText.toLowerCase() === translationHistory[i].originalText.toLowerCase()) {
                            duplicate = true;
                            break;
                        }
                    }

                    if (!duplicate) {
                        flashCards.push({originalText: translationHistory[i].originalText, translatedText: translationHistory[i].translatedText, id: translationHistory[i].id});
                        if (flashCards.length > 10) {
                            flashCards.shift();
                        }
                        changed = true;
                    }
                }
            }

            if (changed) {
                chrome.storage.local.set({flashCards: flashCards}, function () {
                    clearTable();
                    init();
                    alert("Successfuly saved all as flashcards");
                });
            } else {
                alert("No new flash cards were saved.");
            }
        });

    });
}

function removeFlashCards(tid) {
    chrome.storage.local.get({flashCards: []}, function (result) {
        var flashCards = result.flashCards;
        for (var i = 0; i < flashCards.length; i++) {
            if (tid === flashCards[i].id) {
                flashCards.splice(i, 1);
                break;
            }
        }
        chrome.storage.local.set({flashCards: flashCards}, function () {
            clearTable();
            init();
        });
    });
}

function removeHistory(tid) {
    chrome.storage.local.get({translationHistory: []}, function (result) {
        var translationHistory = result.translationHistory;
        if (!translationHistory) {
            return;
        }

        for (var i = 0; i < translationHistory.length; i++) {
            if (tid === translationHistory[i].id) {
                translationHistory.splice(i, 1);
                break;
            }
        }

        chrome.storage.local.get({translationHistoryUrl: []}, function (result) {
            var translationHistoryUrl = result.translationHistoryUrl;
            if (!translationHistoryUrl) {
                return;
            }
            for (var j = 0; j < translationHistoryUrl.length; j++) {
                if (tid === translationHistoryUrl[j].id) {
                    translationHistoryUrl.splice(j, 1);
                    break;
                }
            }
            chrome.storage.local.set({translationHistory: translationHistory}, function () {
                chrome.storage.local.set({translationHistoryUrl: translationHistoryUrl}, function () {
                    clearTable();
                    init();
                });
            });

        });
    });
}

function removeHistoryArr(ids) {
    chrome.storage.local.get({translationHistory: []}, function (result) {
        var translationHistory = result.translationHistory;
        if (!translationHistory) {
            return;
        }
        var i = translationHistory.length;
        while (i--) {
            if (include(ids, translationHistory[i].id)) {
                translationHistory.splice(i, 1);
            }
        }

        chrome.storage.local.get({translationHistoryUrl: []}, function (result) {
            var translationHistoryUrl = result.translationHistoryUrl;
            if (!translationHistoryUrl) {
                return;
            }
            var j = translationHistoryUrl.length;
            while (j--) {
                if (include(ids, translationHistoryUrl[j].id)) {
                    translationHistoryUrl.splice(j, 1);
                }
            }
            chrome.storage.local.set({translationHistory: translationHistory}, function () {
                chrome.storage.local.set({translationHistoryUrl: translationHistoryUrl}, function () {
                    clearTable();
                    init();
                    alert("Successfuly removed words");
                });
            });

        });
    });
}

function checkFlashCardsIsSaved() {
    chrome.storage.local.get({flashCards: []}, function (result) {
        var flashCards = result.flashCards;
        for (var i = 0; i < flashCards.length; i++) {
            var fc_id = flashCards[i].id;
            var ele = document.getElementById(fc_id);
            if (ele !== null) {
                var parent = ele.parentNode;
                parent.removeChild(ele);
//                var btnDDiv = document.createElement("div");
//                btnDDiv.className = "saveDiv disableSave";
//                btnDDiv.innerHTML = "&nbsp;";
//                parent.prepend(btnDDiv);
            }
        }
    });
}

function clearTable() {
    var table = document.getElementById("history_table");
    table.tBodies[0].innerHTML = '';

    var selectAll = document.getElementById("selectAll");
    selectAll.checked = false;
}

function init() {
    print_history_list();
}

window.addEventListener('load', init);

function include(arr, obj) {
    var result = false;
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] == obj)
            result = true;
    }

    return result;
}

function exportHistory(ids) {
    chrome.storage.local.get({translationHistory: []}, function (result) {
        var translationHistory = result.translationHistory;
        if (!translationHistory) {
            return;
        }
        var result = [];
        var i = translationHistory.length;

        while (i--) {
            if (include(ids, translationHistory[i].id)) {
                result.push({originalText: translationHistory[i].originalText, translatedText: translationHistory[i].translatedText});
            }
        }
        fnExcelReport(result);
    });
}

function fnExcelReport(result)
{
    var table = document.getElementById("export_table");
    for (var j = 0; j < result.length; j++)
    {
        var row = table.tBodies[0].insertRow();

        var cell0 = row.insertCell(0);
        var cell1 = row.insertCell(1);

        cell0.innerHTML = result[j].originalText;
        cell1.innerHTML = result[j].translatedText;
    }

    var wb = XLSX.utils.table_to_book(document.getElementById('export_table'), {sheet: "Translation"});
    var wbout = XLSX.write(wb, {bookType: 'xlsx', bookSST: true, type: 'binary'});
    saveAs(new Blob([s2ab(wbout)], {type: "application/octet-stream"}), 'We Tranzlate Export.xlsx');
}

function s2ab(s) {
    var buf = new ArrayBuffer(s.length);
    var view = new Uint8Array(buf);
    for (var i = 0; i < s.length; i++)
        view[i] = s.charCodeAt(i) & 0xFF;
    return buf;
}


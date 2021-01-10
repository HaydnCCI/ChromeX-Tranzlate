'use strict';
window.addEventListener("mouseup", function (event) {
	if (event.shiftKey) {
        var selection = window.getSelection().getRangeAt(0).toString()
        var selectionText = window.getSelection().anchorNode.textContent
        // alert(selection)
		chrome.runtime.sendMessage({
            // url: window.location.href,
            action: 'selectedText',
            value: selection,
            // whole_sent: selectionText,
            clientX: event.clientX,
            clientY: event.clientY
        });
        window.getSelection().removeAllRanges();
    }
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    chrome.storage.local.get({flashCards: []}, function (result) {
        var flashCards = result.flashCards;
        createBubble(message.text, message.translatedText, message.id, flashCards.length);
    });

});

var ID = function () {
    return '_' + Math.random().toString(36).substr(2, 9);
};

function createBubble(word, text, translation_id, current_flashcard_count) {
    addStyles();

    var ele_id = "translation_bubble_dialog" + ID();
    var btn_id = "close_bubble" + ID();
    var btn_del_id = "del_bubble" + ID();

    var bubbleDOM = null;
    bubbleDOM = document.createElement('dialog');
    bubbleDOM.setAttribute('class', 'translation_bubble');
    bubbleDOM.setAttribute('id', ele_id);

    //Title
    var title_div = document.createElement("div");
    title_div.setAttribute('id', 'title_div_dialog');
    var imgURL = chrome.extension.getURL("images/logo_small.png");
    var oImg = document.createElement("img");
    oImg.setAttribute('src', imgURL);
    title_div.appendChild(oImg);
    bubbleDOM.appendChild(title_div);

    //HR
    var hr = document.createElement("hr");
    bubbleDOM.appendChild(hr);

    //From Title
    var from_div = document.createElement("div");
    from_div.setAttribute('id', 'from_div_dialog');
    from_div.setAttribute('class', 'title_dialog');
    from_div.innerHTML = "Translated From:";
    //bubbleDOM.appendChild(from_div);

    //From
    var para_from = document.createElement("p");
    var node_from = document.createTextNode(word);
    para_from.appendChild(node_from);
    bubbleDOM.appendChild(para_from);

    //Translated Title
    var to_div = document.createElement("div");
    to_div.setAttribute('id', 'to_div_dialog');
    to_div.setAttribute('class', 'title_dialog');
    to_div.innerHTML = "Translated To:";
    //bubbleDOM.appendChild(to_div);

    //Translated text
    var para = document.createElement("p");
    var node = document.createTextNode(text);
    para.appendChild(node);
    bubbleDOM.appendChild(para);

    //Save Button
    var btn_div = document.createElement("div");
    btn_div.setAttribute('id', 'btn_div_dialog');

    var btn_save = document.createElement("button");
    btn_save.innerHTML = "Save";
    btn_save.id = translation_id;
    btn_save.className = "btn-dialog  btn-success-dialog";
    if (current_flashcard_count >= 10) {
        btn_save.disabled = true;
        btn_save.className = "btn-dialog btn-disabled-dialog";
        btn_save.setAttribute('style', 'border-color:#ccc;cursor:not-allowed');
    }
    btn_div.appendChild(btn_save);

//    //Delete Button
//    var delBtn = document.createElement("button");
//    delBtn.setAttribute('id', btn_del_id);
//    delBtn.setAttribute('class', 'btn-dialog btn-close-dialog');
//    var tdel = document.createTextNode("Delete");
//    delBtn.appendChild(tdel);
//    btn_div.appendChild(delBtn);

    //Close Button
    var btn = document.createElement("button");
    btn.setAttribute('id', btn_id);
    btn.setAttribute('class', 'btn-dialog btn-close-dialog closebtntranslate');
    var t = document.createTextNode("Close");
    btn.appendChild(t);
    btn_div.appendChild(btn);
    bubbleDOM.appendChild(btn_div);

    //Warning
    if (current_flashcard_count >= 10) {
        var warning_p = document.createElement("p");
        warning_p.setAttribute('style', 'color:#C00000;margin-top:10px;');
        var warning_text_1 = document.createTextNode("Flashcards limit exceeded.");
        var br_w = document.createElement('br');
        var warning_text_2 = document.createTextNode("Unable to save translation.");
        warning_p.appendChild(warning_text_1);
        warning_p.appendChild(br_w);
        warning_p.appendChild(warning_text_2);
        bubbleDOM.appendChild(warning_p);
    }

    //hr
    //bubbleDOM.appendChild(hr);
    var br = document.createElement('br');
    //bubbleDOM.appendChild(br);

    //Ads
    var addiv = document.createElement("div");
    addiv.setAttribute('id', 'adiframe');
    var ifrm = document.createElement("iframe");
    ifrm.setAttribute("src", "https://rcm-na.amazon-adsystem.com/e/cm?o=1&p=288&l=ur1&category=hotnewreleases&banner=1HNM1EVYY12R5JNA9YR2&f=ifr&linkID=ddd8b118b9fe62edfb0c481b974fbaef&t=fan111-20&tracking_id=fan111-20");
    ifrm.style.width = "320px";
    ifrm.style.height = "50px";
    ifrm.style.overflow = "hidden";
    ifrm.frameBorder = 0;
    addiv.appendChild(ifrm);
    //bubbleDOM.appendChild(addiv);

    //Show Modal
    document.body.appendChild(bubbleDOM);
    bubbleDOM.showModal();

    document.querySelector('#' + btn_id).onclick = function () {
        var dialog = document.querySelector('#' + ele_id);
        dialog.close();
        document.body.removeChild(dialog);
    };

    document.querySelector('#' + translation_id).onclick = function () {
		saveFlashCards(word, text, translation_id);
        var dialog = document.querySelector('#' + ele_id);
        dialog.close();
        document.body.removeChild(dialog);
    };

    document.activeElement.blur();
}

function addStyles() {
    var link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('type', 'text/css');
    link.setAttribute('href', 'https://fonts.googleapis.com/css?family=Roboto:400,500,700,900');
    document.head.appendChild(link);
}

function saveFlashCards(original, translated, id) {
    chrome.storage.local.get({flashCards: []}, function (result) {
        var flashCards = result.flashCards;
        for (var i = 0; i < flashCards.length; i++) {
            if (original.toLowerCase() === flashCards[i].originalText.toLowerCase()) {
                return;
            }
        }
        flashCards.push({originalText: original, translatedText: translated, id: id});
        if (flashCards.length > 10) {
            flashCards.shift();
        }
        chrome.storage.local.set({flashCards: flashCards}, function () {

        });
    });
}

String.prototype.isEmpty = function () {// Returns if a string has only whitespace
    return (this.length === 0 || !this.trim());
};

$("#history").click(function () {
    chrome.runtime.sendMessage({
        action: 'openHistory'
    });
});

function Card(front, back) {
    /*A card is just a container that holds a front and back value! 
     - You can get either back or front by displaying it*/
    this.frontVal = front;
    this.backVal = back;

    this.display = function (side) {
        if (side === 0) {
            return this.frontVal;
        } else {
            return this.backVal;
        }
    };
}

var cardsHandle = {
    cards: [],
    cardInd: 0,
    cardButton: document.getElementById("cardButton"),
    cardText: document.getElementById("cardText"),
    cardAnswer: document.getElementById("cardAnswer"),
    cardTPosition: document.getElementById("positionIndex"),
    cardSide: 0,

    cardAdd: function (back, front) {
        this.cards.push(new Card(back, front));
    },
    cardRemove: function () {
        this.cards = [];
    },
    cardUpdate: function () {
        var curCard = this.cards[ this.cardInd ];
        this.cardText.innerHTML = curCard.display(this.cardSide);
        this.cardAnswer.innerHTML = curCard.display(1);
        this.cardTPosition.innerHTML = (this.cardInd + 1) + "/" + this.cards.length;
    },
    cardFlip: function () {
        this.cardSide = (this.cardSide + 1) % 2;
    },
    cardMove: function (moveBy) {
        this.cardInd += moveBy;
        if (this.cardInd < 0) {
            this.cardInd += this.cards.length;
        }
        this.cardInd = this.cardInd % this.cards.length;

        this.cardSide = 0;// Set back to front
        this.cardUpdate();
    },
    cardTap: function () {
        this.cardFlip();
        this.cardUpdate();// Display card
    },
    cardAnswers: function () {
        var inputs = document.getElementsByTagName('input');
        for(var k = 0; k < inputs.length; k++) {
           inputs[k].onclick = function () {
               handleAnswer(this.value);
           }            
        }
    }
};



var userEnter = function () {
    var nFront = document.getElementById("newFront"),
            nBack = document.getElementById("newBack");

    if (nFront.value.isEmpty() || nBack.value.isEmpty())
        return;

    cardsHandle.cardAdd(nFront.value, nBack.value);
    nFront.value = "";
    nBack.value = "";
    cardsHandle.cardUpdate();
}

function loadFlashCards() {
    chrome.storage.local.get({flashCards: []}, function (result) {
        var flashCards = result.flashCards;
        for (var j = 0; j < flashCards.length; j++) {
            addRow(flashCards[j].originalText, flashCards[j].id, j);
        }
        //randomize flashcard
        flashCards.sort( function() { return 0.5 - Math.random() } );
        for (var i = 0; i < flashCards.length; i++) {
            var ori = '<div>' + flashCards[i].originalText + '</div>';
            ori += '<div id="answer_group"><div id="answer_correct">Correct!</div><div id="answer_wrong">Sorry, wrong answer.</div></div>'
            var translated = '<div id="shortanswer">' + flashCards[i].translatedText + '</div>';
            var answers = "<div class=\"answers\">";
            if(flashCards.length >= 5) {
                var options = [];
                var randomFlashCards = result.flashCards;
                
                randomFlashCards = randomFlashCards.filter( el => el.translatedText !== flashCards[i].translatedText);
                randomFlashCards.sort( function() { return 0.5 - Math.random() } );

                options = options.concat(randomFlashCards.slice(0, 3));
                
                var answerIndex = Math.floor(Math.random() * 4) + 1;
                answerIndex = answerIndex - 1;
                options.splice(answerIndex, 0, flashCards[i]);

                //ori += "<div class=\"answers\">";
                var options_index = ['A','B','C', 'D'];
                for (var j = 0; j < options.length; j++) {
                    var val = false;
                    if(answerIndex == j) {
                        val = true;
                    }
                    answers += '<input type="radio" class="radio" name="answers" value="' + val + '"> &nbsp; '
                    answers += options[j].translatedText;
                    //ori += options_index[j] + ": " + options[j].translatedText;
                    answers += "<br>";
                }
                answers += "</div>";
                translated = "<h3>Translation</h3>" + options_index[answerIndex] + ": " + flashCards[i].translatedText;
            } else {
                answers = translated;
            }
            cardsHandle.cardAdd(ori, answers);
        }
        
        cardsHandle.cardUpdate();
        cardsHandle.cardAnswers();
    });
}

function addRow(word, id, no) {
    var table = document.getElementById("cardlist_table");
    var row = table.tBodies[0].insertRow();

    //var cell0 = row.insertCell(0);
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);

    //cell0.innerHTML = no + 1;

    cell1.innerHTML = word;

    var btnDDiv = document.createElement("div");
    btnDDiv.className = "saveDiv";
    btnDDiv.innerHTML = '<i class="fas fa-times-circle"></i>';
    btnDDiv.setAttribute("title", "Remove flash card");
    btnDDiv.id = id + "_del";

    btnDDiv.addEventListener("click", function () {
        var result = confirm("Are you sure you want to delete?");
        if (result) {
            removeFlashCards(id);
        }
        
    }, false);

    cell2.appendChild(btnDDiv);

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
            cardsHandle.cardRemove();
            init();
        });
    });
}

function clearTable() {
    var table = document.getElementById("cardlist_table");
    table.tBodies[0].innerHTML = '';
}

function init() {
//    cardsHandle.cardButton.addEventListener('click', function () {
//        //cardsHandle.cardTap();
//    });
    
    document.querySelector('#prevCard').onclick = function () {
        cardsHandle.cardMove(-1);
        cardsHandle.cardAnswers();
    };
    
    document.querySelector('#nextCard').onclick = function () {
        cardsHandle.cardMove(1);
        cardsHandle.cardAnswers();
    };
    loadFlashCards();
    
}
 function handleAnswer(val) {
     
     if(val === 'true') {
         document.getElementById('answer_correct').style.display = 'block';
         document.getElementById('answer_wrong').style.display = 'none';
     } else {
         document.getElementById('answer_wrong').style.display = 'block';
         document.getElementById('answer_correct').style.display = 'none';
     }
 }
 
window.addEventListener('load', init);

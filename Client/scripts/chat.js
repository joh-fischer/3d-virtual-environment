const emojis = {":-)" : "0x1F60A", ":-(" : "0x1F641",
             ";-)" : "0x1F609", ":-D" : "0x1F600",
             ":-*" : "0x1F618", ":-P" : "0x1F61B"
}

String.prototype.containsAny = function(arr) {    
    for (var word in arr) {
        if (this.includes(arr[word])) return arr[word];
    }
    return false;
}

var typingList = {};
var isTyping = false;

function printMsg(message, personSending) {
    if (message.content == "") return;
    
    var template = DOM.templates.message;
    var newMsg = template.cloneNode(true);
    newMsg.id = personSending;
    
    // emoji
    var msgContent = message.content;
    var emojiThere = msgContent.containsAny(Object.keys(emojis));
    while (emojiThere) {
        var emoji = String.fromCodePoint(emojis[emojiThere]);
        msgContent = msgContent.replace(emojiThere, emoji);
        emojiThere =  msgContent.containsAny(Object.keys(emojis));
    }
    newMsg.querySelector("#content").innerText = msgContent;
    
    if (personSending == "other") {
        newMsg.querySelector("#username").innerText = message.username;
    }
    
    //newMsg.querySelector("#time").innerText = message.time;
    
    var chatDOM = null;
    if (message.goal == "general") {
        chatDOM = DOM.menu.general;
        chatDOM.msgs.appendChild(newMsg);
        if (personSending == "me") {
            chatDOM.msgInput.value = "";
        } else {
            newMsg.querySelector("#username").addEventListener("click", clickedOnName);
        }
        chatDOM.msgs.scrollTop = 99999999;
    } else {
        if (message.goal == localUserInfo.username)
            chatDOM = $(".friends-chat #" + message.username);
        else
            chatDOM = $(".friends-chat #" + message.goal);
                
        if (chatDOM) {
            chatDOM.appendChild(newMsg);
            chatDOM.scrollTop = 99999999;
        }
        
        if (personSending == "me") $(".friends-chat #msg-input").value = "";
    }
}

function clickedOnName() {
    var friendsName = this.innerText;
    if (localFriendsList.includes(friendsName)) {
        openFriends();
    } else {
        var confirmationFriendRequest = confirm("You want to add " + friendsName + " to your friends list?");
        if (confirmationFriendRequest) {
            addFriend(friendsName);
        }
    }
}

function printTyping(message) {
    var chatDOM = null;
    if (message.goal == "general")
        chatDOM = DOM.menu.general;
    else
        chatDOM = null;
    var template = DOM.templates.message;
    var newMsg = template.cloneNode(true);
    newMsg.id = "other";
    newMsg.querySelector("#username").style = "font-weight: 400;"
    newMsg.querySelector("#username").innerHTML = "<b>" + message.username + "</b> <i>...</i>";
    newMsg.style = "background-color: rgba(191, 213, 232, 0.6)";
    typingList[message.id] = newMsg;
    
    chatDOM.msgs.appendChild(newMsg);
    
    chatDOM.msgs.scrollTop = 99999;
}

function printHistory(history) {
    if (history.length == 0) return;
    
    for (var i in history) {
        var msgToPrint = history[i];
        
        if (typeof msgToPrint == "string")
            msgToPrint = JSON.parse(msgToPrint);
        
        if (msgToPrint.username == localUserInfo.username)
            printMsg(msgToPrint, "me");
        else
            printMsg(msgToPrint, "other");
    }
}

function getPrettyTime() {
    var date = new Date();
    return (date.getHours() + ":" + (date.getMinutes()<10?'0':'') + date.getMinutes());
}

function setNewMsgSign(message) {
    if (message.goal == "general") {
        if (!DOM.menu.general.active)
            DOM.menu.general.newMsg.style = "display: initial;";
    } else {
        // activate friends new message sign
        if (!DOM.menu.friends.active)
            DOM.menu.friends.newMsg.style = "display: initial;";
        // activate username new msg sign
        if (message.username != DOM.menu.friends.activeFriend) {
            $("#" + message.username + ".friends-entry .new-msg-sign").style = "display: initial;";
        }
    }
}


/* MESSAGING */
function pressSend(e) {
    var msgInput = DOM.menu.general.msgInput;
    if (msgInput.value.length < 1)
        return;
    if ((e.type == "keypress" && e.key == "Enter") || (e.type == "click")) {
        if (isTyping) {
            sendMsg(new Msg("typing", localUserInfo.username, localUserInfo.id, "stop", "general"));   
        }
        var msgToSend = new Msg("text", localUserInfo.username, localUserInfo.id, msgInput.value, "general", getPrettyTime());
        sendMsg(msgToSend);
        printMsg(msgToSend, "me");
    }    
}

function sendIsTyping(e) {
    var msgInput = DOM.menu.general.msgInput;
    if (msgInput.value.length < 1) {
        isTyping = false;
        sendMsg(new Msg("typing", localUserInfo.username, localUserInfo.id, "stop", "general"));   
    } else {
        if (!isTyping) {
            isTyping = true;
            sendMsg(new Msg("typing", localUserInfo.username, localUserInfo.id, "...", "general"));
        }
    }
}

function pressSendFriend(e) {
    var msgInput = $(".friends-chat #msg-input");
    if (msgInput.value.length < 1)
        return;

    var targetFriend = DOM.menu.friends.activeFriend;
    if ((e.type == "keypress" && e.key == "Enter") || (e.type == "click")) {
        if (isTyping) {
            sendMsg(new Msg("typing", localUserInfo.username, localUserInfo.id, "stop", "general"));   
        }
        var msgToSend = new Msg("text", localUserInfo.username, localUserInfo.id, msgInput.value, targetFriend, getPrettyTime());
        sendMsg(msgToSend);
        printMsg(msgToSend, "me");
    }
}

/* EVENT LISTENERS */
DOM.menu.general.msgInput.addEventListener("keypress", pressSend);
DOM.menu.general.sendButton.addEventListener("click", pressSend);
// user typing
DOM.menu.general.msgInput.addEventListener("input", sendIsTyping);
// sent to friend
DOM.menu.friends.chat.msgInput.addEventListener("keypress", pressSendFriend);
DOM.menu.friends.chat.sendButton.addEventListener("click", pressSendFriend);
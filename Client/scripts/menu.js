var activeMenu = null;

/* OPEN/CLOSE */
function closeMenu(menu) {
    if (localUserInfo.texture != mainCharacter.texture.color) {
        setTexture(mainCharacter, localUserInfo.texture);
    }
    if (!menu) return;
    menu.active = false;
    menu.button.style = "background-color: rgba(245, 245, 245, 1);";
    menu.window.style = "display: none;";
    activeMenu = null;
}

function openMenu(menu) {
    closeMenu(activeMenu);
    closeArtInfo();
    closeUploadImg();
    activeMenu = menu;
    menu.active = true;
    menu.button.style = "background-color: rgba(150, 150, 150, 0.8);";
    menu.window.style = "display: initial;";
    activeMenu = menu;
}

function openGeneral() {
    if (DOM.menu.general.active) {
        closeMenu(DOM.menu.general);
    } else {    
        openMenu(DOM.menu.general);
        DOM.menu.general.newMsg.style = "display: none;";
        DOM.menu.general.msgs.scrollTop = 99999999;
    }
}

function openFriends() {
    if (DOM.menu.friends.active) {
        closeMenu(DOM.menu.friends);
    } else {
        openMenu(DOM.menu.friends);
        DOM.menu.friends.newMsg.style = "display: none;";
    }
}

function openLook() {
    if (DOM.menu.look.active) {
        closeMenu(DOM.menu.look);
    } else {
        openMenu(DOM.menu.look);
    }
}

function openSettings() {
    if (DOM.menu.settings.active) {
        closeMenu(DOM.menu.settings);
    } else {
        openMenu(DOM.menu.settings);
    }
}

function closeActiveMenu() {
    if (DOM.menu.general.active)
        closeMenu(DOM.menu.general);
    else if (DOM.menu.friends.active)
        closeMenu(DOM.menu.friends);
    else if (DOM.menu.look.active)
        closeMenu(DOM.menu.look);
    else if (DOM.menu.settings.active) {
        closeMenu(DOM.menu.settings);
        DOM.menu.settings.failMsg.id = "pw-change-failed";
        DOM.menu.settings.failMsg.style = "opacity: 0;";
        DOM.menu.settings.oldPW.value = "";
        DOM.menu.settings.newPW.value = "";
        DOM.menu.settings.newPWRepeat.value = "";
    }
        
    closeArtInfo();
    closeUploadImg();
}

function logout() {
    localStorage.clear();
    var logoutMsg = new Msg("logoutMsg", localUserInfo.username, localUserInfo.id, localUserInfo.roomName);
    sendMsg(logoutMsg);
    location.reload();
}

/* SETTINGS */
function msg_error_changePW(txt) {
    DOM.menu.settings.newPW.value = "";
    DOM.menu.settings.newPWRepeat.value = "";
    DOM.register.password.style = "background-color: rgb(245,245,245);";
    DOM.menu.settings.failMsg.innerText = txt;
    DOM.menu.settings.failMsg.style = "opacity: 1;";
}

function changePassword(evt) {
    if (evt.type == "keypress" && evt.key != "Enter") return;
    if (!serverOnline) return;
    if (DOM.menu.settings.oldPW.value == "" || DOM.menu.settings.newPW.value == "" || DOM.menu.settings.newPWRepeat.value == "") {
        msg_error_changePW("Value missing...")
        return;
    }
    if (!passwordValid(DOM.menu.settings.newPW.value)) {
        msg_error_changePW("Invalid password... Please choose another one");
        return;
    }
    if (DOM.menu.settings.newPW.value != DOM.menu.settings.newPWRepeat.value) {
        msg_error_changePW("New passwords differ!");
        return;
    }
    var password = {
        old: md5(DOM.menu.settings.oldPW.value),
        new: md5(DOM.menu.settings.newPW.value)
    };
    var pwMsg = new Msg("changePW", localUserInfo.username, localUserInfo.id, password);
    sendMsg(pwMsg);
}

/* FRIENDS */
function hideFriendsList() {
    if (DOM.menu.friends.list.active) {
        DOM.menu.friends.list.entries.style = "visibility: hidden;";
        DOM.menu.friends.list.window.style = "width: 50px;";
        DOM.menu.friends.list.active = false;
        DOM.menu.friends.list.button.innerText = "Show";
    } else {
        DOM.menu.friends.list.entries.style = "visibility: visible;";
        DOM.menu.friends.list.window.style = "width: 150px;";
        DOM.menu.friends.list.active = true;
        DOM.menu.friends.list.button.innerText = "Hide";
    }
}

// add and delete
function addFriendEntry(username) {
    // add entry in friends list
    var template = DOM.templates.friendsEntry;
    var newEntry = template.cloneNode(true);
    newEntry.id = username;
    newEntry.querySelector(".name").innerText = username;
    DOM.menu.friends.list.entries.appendChild(newEntry);
    updateFriendsEventListener();
    localFriendsList.push(username);
}

function deleteFriendEntry(username) {
    var entry = null;
    if (DOM.menu.friends.activeFriend == username) {
        entry = $(".friends-list .friends-entry-selected#" + username);
        DOM.menu.friends.activeFriend = null;
    } else {
        entry = $(".friends-list .friends-entry#" + username);
    }
        
    
    if (!entry)
        console.log("Deletion failed, no entry with username " + username);
    else
        entry.remove();
    
    updateFriendsEventListener();
    
    // update local list
    var idx = localFriendsList.indexOf(username);
    if (idx > -1) {
      localFriendsList.splice(idx, 1);
    }
}

function addFriendChat(username) {
    var template = DOM.templates.messageWindow;
    var newEntry = template.cloneNode(true);
    newEntry.id = username;
    var element = $(".friends-chat");
    element.insertBefore(newEntry, element.firstElementChild);
}

function deleteFriendChat(username) {
    if (DOM.menu.friends.activeChat.id == username) {
        openChatWindow("placeholder");
        DOM.menu.friends.chat.window.style = "display: none;";
    }
    var entry = $(".friends-chat .messages#" + username);
    
    if (!entry)
        console.log("Deletion failed, no chat window with username " + username);
    else
        entry.remove();
}

function addFriend(username) {
    addFriendEntry(username);
    addFriendChat(username);
    var newFriend = new Msg("addFriend", localUserInfo.username, localUserInfo.id, username);
    sendMsg(newFriend);
    if (!localFriendsList.includes(username))
        localFriendsList.push(username);
}

function deleteFriend(username) {
    deleteFriendEntry(username);
    deleteFriendChat(username);
    var delFriend = new Msg("deleteFriend", localUserInfo.username, localUserInfo.id, username);
    sendMsg(delFriend);
}

function clickedOnCharacter(name) {
    if (localFriendsList.includes(name)) {
        openFriends();
    } else {
        var confirmationFriendRequest = confirm("You want to add " + name + " to your friends list?");
        if (confirmationFriendRequest) {
            addFriend(name);
        }
    }
}

// open the friends chat window
function openChatWindow(username) {
    DOM.menu.friends.chat.window.style = "display: initial;";
    DOM.menu.friends.activeChat.className = "messages";
    DOM.menu.friends.activeChat = $(".friends-chat #"+username);
    DOM.menu.friends.activeChat.className = "messages-selected";
    DOM.menu.friends.chat.msgInput.value = "";
    
    DOM.menu.friends.activeChat.scrollTop = 99999;
}

// open friend (for eventlistener)
function openFriendsChat() {
    
    var friendUsername = this.id;
    
    var oldActiveFriend = DOM.menu.friends.activeFriend;
    
    if (oldActiveFriend) {
        $(".friends-entry-selected").className = "friends-entry";
    }
     // activate button of friend
    var friendEntry = $(".friends-entries .friends-entry#"+friendUsername);
    friendEntry.querySelector(".new-msg-sign").style = "display: none;";
    friendEntry.className = "friends-entry-selected";
    
    DOM.menu.friends.activeFriend = friendUsername;
        
    openChatWindow(friendUsername);
}

function updateFriendsEventListener() {
    var friendsEntries = document.querySelectorAll(".friends-entries .friends-entry");
    for (var i = 0; i < friendsEntries.length; ++i) {
        friendsEntries[i].addEventListener("click", openFriendsChat);
    }
}

updateFriendsEventListener();

/* MENU OPENERS */
DOM.menu.general.button.addEventListener("click", openGeneral);
DOM.menu.friends.button.addEventListener("click", openFriends);
DOM.menu.look.button.addEventListener("click", openLook);
DOM.menu.settings.button.addEventListener("click", openSettings);
DOM.menu.logout.button.addEventListener("click", logout);
DOM.menu.friends.list.button.addEventListener("click", hideFriendsList);
//DOM.canvas.addEventListener("click", closeActiveMenu);
DOM.menu.settings.changeButton.addEventListener("click", changePassword);
DOM.menu.settings.newPWRepeat.addEventListener("keypress", changePassword);
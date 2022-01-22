/* SERVER HANDLER */
const wsClient = new WebSocket("wss://ecv-etic.upf.edu/node/9034/ws/");
wsClient.binaryType = 'arraybuffer';

var serverOnline = false;
var usernamesFromServer = [];
var localUserInfo = {
    username: '',
    token: '',
    id: -1,

    texture: '',
    position: null,
    rotation: null,
    roomName: ''
};

var localFriendsList = [];


wsClient.onopen = function() {
    console.log("READY TO USE SERVER");
    serverOnline = true;
    
    getStorageItem("userInfo", function(userInfo) {
        if (userInfo) {
            var userInfo = JSON.parse( userInfo );
            var tokenMsg = new Msg("tokenMsg", userInfo.username, "", userInfo.token);
            console.log("SEND ", tokenMsg);
            wsClient.send(JSON.stringify( tokenMsg ));
        }
    });
}

wsClient.onmessage = function(evt) {
    if (evt.data.constructor !== String) {
        console.log(evt);
        return;
    } else {
        var recvMsg = JSON.parse(evt.data);
    }   
    
    if (debug && recvMsg.type != "movement") console.log("RECV ", recvMsg);
    
    switch (recvMsg.type) {
        case "loginVerification":
            if (recvMsg.content) {
                localUserInfo.username = recvMsg.username;
                localUserInfo.token = recvMsg.content;
                localUserInfo.id = recvMsg.id;
                localStorage.setItem("userInfo", JSON.stringify( localUserInfo));
            } else {
                // create error message
                if (recvMsg.goal == "register")
                    msg_error("Something went wrong!")
                else if (recvMsg.goal == "login")
                    msg_error("Wrong username or password!")
                else if (recvMsg.goal == "secondLogin")
                    msg_error("User already logged in!");
            }
            break;
        
        case "listUsernames":
            usernamesFromServer = recvMsg.content;
            break;

        case "roomInfo":
            processRoomInfo(recvMsg);

            transitToWorld();
            break;
        
        case "addCharacter":
            var newCharacterNode = createCharacterNode(recvMsg.username, recvMsg.content);
            addCharacterNode(current_room, newCharacterNode);
            break;

        case "removeCharacter":
            var characterNode = getCharacterNodeByName(recvMsg.username);
            delete current_room.characters[recvMsg.username];
            if (characterNode)
                removeCharacterNode(current_room, characterNode);
            break;

        case "text":
            printMsg(recvMsg, "other");
            setNewMsgSign(recvMsg);            
            break;
            
        case "typing":
            if (recvMsg.content == "stop") {
                var typingMsg = typingList[recvMsg.id];
                typingMsg.remove();
                delete typingList[recvMsg.id];
            } else {
                if (recvMsg.goal == "general") {
                    printTyping(recvMsg);
                } else {
                    // todo!
                }
            }
            break;
        
        case "chatHistory":
            printHistory(recvMsg.content);
            break;
        
        case "newMsgSigns":
            for (var idx in recvMsg.content) {
                setNewMsgSign(JSON.parse( recvMsg.content[idx] ));
            }
            break;
        
        case "transitionInfo":
            localUserInfo.roomName = recvMsg.content.roomName;
            // add characters
            world[recvMsg.content.roomName].characters = recvMsg.content.charactersInRoom;
            transitTo(world[recvMsg.content.roomName]);
            break;

        case "addFriend":
            addFriendEntry(recvMsg.content);
            addFriendChat(recvMsg.content);
            localFriendsList.push(recvMsg.content);
            break;
        
        case "deleteFriend":
            deleteFriendChat(recvMsg.content);
            deleteFriendEntry(recvMsg.content);
            break;
        
        case "movement":
            var goalNode = getCharacterNodeByName(recvMsg.username);
            if (goalNode)
                goalNode.movementQueue.push(recvMsg.content);
            break;

        case "updateLook":
            var goalNode = getCharacterNodeByName(recvMsg.username);
            if (goalNode)
                setTexture(goalNode, recvMsg.content);
            break;
        
        case "dance":
            var goalNode = getCharacterNodeByName(recvMsg.username);
            if (goalNode) {
                // throws error in rendeer (?):
                // texture_name.indexOf is not a function
                //goalNode.dance = recvMsg.content;
            }
                    
            setTexture(goalNode, recvMsg.content);
            break;
        
        case "pwVerification":
            if (recvMsg.content) {
                // good news
                msg_error_changePW("Successfully changed password");
                DOM.menu.settings.failMsg.id = "pw-change-success";
                DOM.menu.settings.oldPW.value = "";
                localUserInfo.token = recvMsg.content;
                localStorage.setItem("userInfo", JSON.stringify( localUserInfo));
            } else {
                // bad news
                msg_error_changePW("Password change failed!");
            }
            break;

        default:
            console.log("Unknown msg type");
            console.log(recvMsg);
    }
}

wsClient.onerror = function(evt) {
	msg_serverOffline();
    run_loop = false;
}

function Msg(type, username, id, content, goal, time) {
    this.type = type,
	this.username = username || null,
	this.id = id || null,
    this.content = content || null,
    this.goal = goal || null,
    this.time = time || null;    
}

function processRoomInfo(msg) {
    // own character information
    localUserInfo.texture = msg.content.texture;
    localUserInfo.position = msg.content.position;
    localUserInfo.rotation = msg.content.rotation;
    localUserInfo.roomName = msg.content.roomName;
    // characters in room
    world[msg.content.roomName].characters = msg.content.charactersInRoom;
    
    // my friends
    if (msg.content.friendsList) {
        for (var idx in msg.content.friendsList) {
            var friendsName = msg.content.friendsList[idx];
            addFriendEntry(friendsName);
            addFriendChat(friendsName);
        }
    }
    // msg history
    printHistory(msg.content.msgHistory);

    var confirmRoomInfo = new Msg("confirmRoomInfo", localUserInfo.username, localUserInfo.id, true);
    sendMsg(confirmRoomInfo);
}

function sendMsg(message) {
    if (!serverOnline) return;
    if (message.type == "text" && message.content == "") return;
    if (message.type == "typing" && message.content == "stop") isTyping = false;
    
    if (debug) console.log("SEND", message);
    wsClient.send( JSON.stringify(message) );
}

// https://stackoverflow.com/questions/46994034/is-there-a-way-to-check-if-a-javascript-function-accepts-a-callback
function getStorageItem(key, callback) {
    if (typeof callback !== 'function') throw new Error("Invalid callback handler");
    
    var result = localStorage.getItem(key);
    
    if (result instanceof window.Promise) {
        result.then(callback);
    }
    else {
        callback(result);
    }
}
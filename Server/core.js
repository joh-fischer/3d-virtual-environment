var DB = require('./database.js');
var MSG = require('./msgHandler.js');

var freeUserIDs = [];

var CORE = {
    num_clients: 0,
    last_id: 9000,
    onlineByName: {},
    chatHistory: [],
    charactersByRoom: {
        alpine: {},
        universe: {},
        main: {},
        red: {},
        modernArt: {}
    },
    charactersByName: {},
    connectionsByRoom: {
        alpine: {},
        universe: {},
        main: {},
        red: {},
        modernArt: {}
    },
    connectionsByName: {},

    init: function() {
        console.log("App launching...");
    },

    onUserConnect: function(connection) {
        this.num_clients++;
        var id = getUserID();
        var user = {
            id: id,
            username: ""
        };
        connection.user = user;
        
        // send usernames for possible registration
        DB.getUserList(function(v) {
            MSG.sendListOfUsernames(connection, v);
        });

        console.log("User ", id, " connected");
    },

    onUserDisconnect: function(connection) {
        this.num_clients--;
        
        var username = connection.user.username;
        var room = connection.user.room;

        MSG.notifyRemoveCharacter(this.connectionsByRoom[room], username);

        logoutUser(username);

        if (username.length > 2) {
            console.log("[*] ", username, " disconnected from ", room);
            // store last position
            DB.updateCharacterData(username, null, connection.movement[0], connection.movement[1], null);
        }
        
        freeUserIDs.push(connection.user.id);
    },

    onNewMessage: function(connection, message) {
        var recvMsg = JSON.parse(message.utf8Data);
        switch (recvMsg.type) {

            case "movement":
                MSG.broadcastMsg(this.connectionsByRoom[recvMsg.goal], recvMsg);
                connection.movement = recvMsg.content;
                var charRoomInfo = this.charactersByRoom[recvMsg.goal][recvMsg.username];
                if (charRoomInfo) {
                    charRoomInfo.position = recvMsg.content[0];
                    charRoomInfo.rotation = recvMsg.content[1];
                }
                break;

            case "loginMsg":
                if (this.onlineByName[recvMsg.username]) {
                    console.log("Already logged in: ", recvMsg.username);
                    MSG.sendLoginVerification(connection, recvMsg.username, recvMsg.id, false, "secondLogin");
                    return;
                }
                console.log("[*] LOGIN ", recvMsg.username, recvMsg.content);
                
                var that = this;
                DB.login(recvMsg.username, recvMsg.content, function( token ) {
                    MSG.sendLoginVerification(connection, recvMsg.username, connection.user.id, token, "login");

                    if (token) {
                        loginByName(recvMsg.username, connection);
                        
                        // send character info
                        DB.getCharacterData(recvMsg.username, function( characterData ) {
                            
                            loginByRoom(recvMsg.username, characterData, connection);
                            MSG.notifyAddCharacter(that.connectionsByRoom[characterData.roomName], recvMsg.username, characterData);
                            connection.movement = [characterData.position, characterData.rotation];

                            DB.getFriendsList(recvMsg.username, function( friendsList ) {
                                var charactersInUserRoom =  that.charactersByRoom[characterData.roomName];
                                MSG.sendRoomInfo(connection, characterData, charactersInUserRoom, that.chatHistory, friendsList);
                            });
                        });
                    }
                });
                break;

            case "tokenMsg":

                if (this.onlineByName[recvMsg.username])
                    return;

                console.log("[*] TOKEN ", recvMsg.username);

                var that = this;
                DB.loginToken(recvMsg.username, recvMsg.content, function(token) {
                    
                    MSG.sendLoginVerification(connection, recvMsg.username, connection.user.id, token, "token");
                    
                    if (token) {    
                        loginByName(recvMsg.username, connection);

                        // send character info
                        DB.getCharacterData(recvMsg.username, function( characterData ) {
                            
                            loginByRoom(recvMsg.username, characterData, connection);
                            MSG.notifyAddCharacter(that.connectionsByRoom[characterData.roomName], recvMsg.username, characterData);
                            connection.movement = [characterData.position, characterData.rotation];

                            DB.getFriendsList(recvMsg.username, function( friendsList ) {
                                var charactersInUserRoom =  that.charactersByRoom[characterData.roomName];
                                MSG.sendRoomInfo(connection, characterData, charactersInUserRoom, that.chatHistory, friendsList);
                            });
                        });
                    }
                });
                break;

            case "registerMsg":

                console.log("[*] REGISTER ", recvMsg.username, recvMsg.content);

                var that = this;
                DB.register(recvMsg.username, recvMsg.content, function(token) {
                    MSG.sendLoginVerification(connection, recvMsg.username, connection.user.id, token, "register");
                    if (token) {
                        // send character info
                        DB.getCharacterData(recvMsg.username, function( characterData ) {
                            loginByName(recvMsg.username, connection);
                            loginByRoom(recvMsg.username, characterData, connection);

                            MSG.notifyAddCharacter(that.connectionsByRoom[characterData.roomName], recvMsg.username, characterData);
                            connection.movement = [characterData.position, characterData.rotation];

                            var charactersInUserRoom =  that.charactersByRoom[characterData.roomName];
                            MSG.sendRoomInfo(connection, characterData, charactersInUserRoom, that.chatHistory);
                        });
                    }
                });
                break;
            
            case "text":

                console.log("[*] TEXT ", recvMsg.username, " TO ", recvMsg.goal);

                if (recvMsg.goal == "general") {
                    MSG.broadcastMsg(this.connectionsByName, recvMsg);
                    // TODO: only send last x messages
                    this.chatHistory.push(recvMsg);
                } else {
                    // try to send message
                    if (this.onlineByName[recvMsg.goal]) {
                        MSG.sendMessage(this.connectionsByName[recvMsg.goal], recvMsg);
                    } else {
                        // if offline, set boolean for new msg to true
                        var newMsgSign = new Msg("newMsgSign", recvMsg.username, "", "newMsgFrom", recvMsg.goal);
                        DB.addNewMsgSign(newMsgSign);
                    }
                    // add message to DB
                    DB.addMessage(recvMsg);
                }
                break;
            
            case "transition":
                var newPosition = recvMsg.content.position;
                var newRoom = recvMsg.content.to;
                var newRotation = recvMsg.content.rotation;
                
                var oldRoom = this.charactersByName[recvMsg.username].roomName;

                transitUser(recvMsg.username, newRoom);

                var transitionInfo = {
                    roomName: newRoom,
                    charactersInRoom: this.charactersByRoom[newRoom]
                };
                MSG.sendTransitionInfo(connection, transitionInfo);

                DB.updateCharacterData(recvMsg.username, null, newPosition, newRotation, newRoom);
                
                // send remove info to users of old room & add info to users of new room
                var characterData = new CharacterData(this.charactersByName[recvMsg.username].texture, newPosition, newRotation, newRoom);
                MSG.sendTransitionNotification(this.connectionsByRoom, oldRoom, newRoom, recvMsg.username, characterData);
                break;

            case "confirmRoomInfo":
                // send private message history
                DB.getMessageHistory(recvMsg.username, function( privateHistory ) {
                    if (privateHistory)
                        MSG.sendPrivateMsgHistory(connection, privateHistory);
                });
                // send new message signs
                DB.getNewMsgSigns(recvMsg.username, function( newMsgSigns ) {
                    if (newMsgSigns) {
                        MSG.sendNewMsgSigns(connection, newMsgSigns);
                        DB.deleteNewMsgSigns(recvMsg.username);
                    }
                });
                break;

            case "typing":
                console.log("[*] TYPING ", recvMsg.username);
                if (recvMsg.goal == "general") {
                    MSG.broadcastMsg(this.connectionsByName, recvMsg);
                }
                break;
            
            case "addFriend":
                DB.addFriend(recvMsg.username, recvMsg.content);
                MSG.addFriend(this.connectionsByName[recvMsg.content], recvMsg.username);
                break;

            case "deleteFriend":
                DB.deleteFriend(recvMsg.username, recvMsg.content);
                MSG.deleteFriend(this.connectionsByName[recvMsg.content], recvMsg.username);
                break;
            
            case "logoutMsg":
                logoutUser(recvMsg.username);
                break;
            
            case "rotation":
                DB.updateCharacterData(recvMsg.username, null, null, recvMsg.content);
                break;
            
            case "updateLook":
                var newTexture = recvMsg.content;
                DB.updateCharacterData(recvMsg.username, newTexture);
                MSG.notifyChangeLook(this.connectionsByRoom[recvMsg.goal], recvMsg.username, newTexture);
                this.charactersByName[recvMsg.username].texture = newTexture;
                this.charactersByRoom[recvMsg.goal][recvMsg.username].texture = newTexture;
                break;
            
            case "changePW":
                console.log("[*] ", recvMsg.username, " changes password");
                DB.changePassword(recvMsg.username, recvMsg.content.old, recvMsg.content.new, function(token) {
                    MSG.sendPWUpdateVerification(connection, token);
                    console.log("[*] ", recvMsg.username, "password success: ", token);
                });
                break;

            case "dance":
                MSG.broadcastMsg(this.connectionsByRoom[recvMsg.goal], recvMsg);
                break;

            case "testMsg":
                console.log("[*] Test message from " +recvMsg.username);
                console.log(recvMsg);
                break;
            
            default:
                console.log("Unknown message type from user", recvMsg.id, " type ", recvMsg.type);
        }
    },

    onHTTPRequest: function(request, response) {
        switch (request.url) {
            case "/numUsers":
                console.log("Users: " + this.num_clients);
                return "Users: " + this.num_clients;
            case "/charactersByRoom":
                for (var idx in this.charactersByRoom) {
                    console.log(idx);
                    console.log(this.charactersByRoom[idx]);
                }
                return "charactersByRoom on console";
            case "/allCharacters":
                console.log("allCharacters: " + this.charactersByName);
                return "allCharacters: " + this.charactersByName;
            case "/restartDB":
                DB.restart();
                return "restarted DB";
            case "/userList":
                DB.getUserList(function(v) {
                    response.end(JSON.stringify(v));
                })
                return false;
            case "/login":
                DB.login("Javi", "pw1", function(v) {
                    if(v)
                        response.end("Password correct");
                    else
                        response.end("Wrong password");
                })
                return false;
            default:
                return "UNKNOWN";
        }
    }
}


function getUserID() {
	if (freeUserIDs.length == 0) {
		return CORE.last_id++;
	} else {
		return freeUserIDs.pop();
	}
}

function loginByName(username, connection) {
    CORE.connectionsByName[username] = connection;
    CORE.onlineByName[username] = true;
    connection.user.username = username;
}

function loginByRoom(username, characterData, connection) {
    CORE.charactersByRoom[characterData.roomName][username] = characterData;
    CORE.connectionsByRoom[characterData.roomName][username] = connection;
    CORE.charactersByName[username] = characterData;
    connection.user.room = characterData.roomName;
}

function logoutUser(username) {
    CORE.onlineByName[username] = false;
    if (CORE.charactersByName[username]) {
        var roomName = CORE.charactersByName[username].roomName;
        if (CORE.charactersByRoom[roomName][username])
            delete CORE.charactersByRoom[roomName][username];
        if (CORE.connectionsByRoom[roomName][username])
            delete CORE.connectionsByRoom[roomName][username];
    }
    if (CORE.charactersByName[username])
        delete CORE.charactersByName[username];
    if (CORE.connectionsByName[username])
        delete CORE.connectionsByName[username];    
}

function transitUser(username, to) {
    var from = CORE.charactersByName[username].roomName;
    // transit characterdata
    var characterDataOld = CORE.charactersByRoom[from][username];
    var characterData = new CharacterData(characterDataOld.texture, characterDataOld.position, characterDataOld.rotation, characterDataOld.roomName);
    CORE.charactersByRoom[to][username] = characterData;
    delete CORE.charactersByRoom[from][username];
    // transit connection
    var connectionData = CORE.connectionsByRoom[from][username];
    CORE.connectionsByRoom[to][username] = connectionData;
    delete CORE.connectionsByRoom[from][username];
    
    CORE.charactersByName[username].roomName = to;
}

function Msg(type, username, id, content, goal, time) {
    this.type = type,
	this.username = username || null,
	this.id = id || null,
    this.content = content || null,
    this.goal = goal || null,
    this.time = time || null;    
}

function CharacterData(texture, position, rotation, roomName) {
    this.texture = texture,
    this.position = position,
    this.rotation = rotation,
    this.roomName = roomName
}

module.exports = CORE;
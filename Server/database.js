var redis = require('redis');
var md5 = require('md5');

var database_idx = 15;

var namespace = { myRedis: "alpine:" };
namespace.userList = namespace.myRedis + "userList";
namespace.userData = namespace.myRedis + "users:";
namespace.session = namespace.myRedis + "session:";
namespace.messages = namespace.myRedis + "messages:";
namespace.friendsList = namespace.myRedis + "friendsList:";
namespace.newMsgSigns = namespace.myRedis + "newMsgSigns:";
namespace.characterData = namespace.myRedis + "characterData:";


var DB = {
    redis: null,
    users: [],

    init: function() {
        this.getUserList(function(userList) {
            this.users = userList;
            console.log("User List of DB: ", this.users);
        });
    },

    restart: function() {
        // delete
        var that = this;
        this.getUserList(function(userList) {
            console.log("Delete users: ", userList);
            for (var usr in userList) {
                var name = userList[usr];
                console.log("Name: " + name);
                that.redis.del(namespace.session + name);
                that.redis.del(namespace.userData + name);
                that.redis.del(namespace.messages + name);
                that.redis.del(namespace.friendsList + name);
                that.redis.del(namespace.newMsgSigns + name);
                that.redis.del(namespace.characterData + name);
            }
        })
        
        this.users = [];
        this.redis.del(namespace.userList);

        return true;
    },

    login: function(username, password, callback) {
        var that = this;
        this.getUserData(username, function(user_info) {
            if (!user_info) {
                callback(false);
                return;
            }
            var pw_correct = md5(user_info.salt + password) == user_info.password;
            var token = null;
            if (pw_correct) {
                token = md5(String(Date.now()) + username);
                that.redis.set(namespace.session + username, token);
            }
            callback(token);
        });
    },

    register: function(username, password, callback) {
        if (this.users.includes(username)) {
            console.log("already there!");
            callback(null);
            return;
        }
        var data = {
            token: md5(String(Date.now()) + username),
            password: password
        }
        this.redis.set(namespace.session + username, data.token);
        this.createUser(username, data);

        callback(data.token);    
    },

    loginToken: function(username, token, callback) {
        var that = this;
        this.getUserToken(username, function(user_token) {
            if (!user_token) {
                callback(false);
                return;
            }
            var token_correct = token == user_token;
            token = null;
            if (token_correct) {
                token = md5(String(Date.now()) + username);
                console.log(token);
                that.redis.set(namespace.session + username, token);
            }
            callback(token);
        })
    },

    createUser: function(username, data) {

        if (data.password) {
            var salt = username + "ashjklshss" + String(Date.now()) + String(Math.random());
            data.salt = salt;
            data.password = md5(salt + data.password);
        }

        if (data.constructor !== String)
            data = JSON.stringify(data);

        // add element to database
        this.redis.set(namespace.userData + username, data);
        // make list of all users
        this.redis.rpush(namespace.userList, username);
        // add username to local list
        this.users.push(username);
        // initial position, texture, & character
        var characterData = new CharacterData("./data/minibody/textures/skaterMaleA_brown.png", [10, 0, 0], [0, 0, 0, 1], "main");
        this.setCharacterData(username, characterData);
    },

    changePassword: function(username, oldPW, newPW, callback) {
        var that = this;
        this.getUserData(username, function(user_info) {
            if (!user_info) {
                callback(false);
                return;
            }
            var newUserData = user_info;
            var pw_correct = md5(user_info.salt + oldPW) == user_info.password;
            var token = null;
            if (pw_correct) {
                token = md5(String(Date.now()) + username);
                newUserData.password = md5(user_info.salt + newPW);
                if (newUserData.constructor !== String)
                    newUserData = JSON.stringify(newUserData);
                
                that.redis.set(namespace.userData + username, newUserData);
                that.redis.set(namespace.session + username, token);
            }
            callback(token);
        });
    },

    getUserData: function(username, callback) {
        this.redis.get(namespace.userData + username, function(err, v) {
            var user_info = JSON.parse( v );
            callback(user_info);
        });
    },

    getCharacterData: function(username, callback) {
        this.redis.get(namespace.characterData + username, function(err, v) {
            var characterData = JSON.parse( v );
            callback(characterData);
        });
    },

    setCharacterData: function(username, characterData) {
        if (characterData.constructor !== String)
            characterData = JSON.stringify(characterData);
        this.redis.set(namespace.characterData + username, characterData);
    },
    
    updateCharacterData: function(username, texture, position, rotation, roomName) {
        var that = this;

        this.getCharacterData(username, function( characterData ) {
            var newCharacterData = characterData;
            if (texture)
                newCharacterData.texture = texture;
            if (position)
                newCharacterData.position = position;
            if (rotation)
                newCharacterData.rotation = rotation;
            if (roomName)
                newCharacterData.roomName = roomName;
            that.setCharacterData(username, newCharacterData);
        });
    },

    getUserToken: function(username, callback) {
        this.redis.get(namespace.session + username, function(err, v) {
            callback(v);
        });
    },

    getUserList: function(callback) {
        this.redis.lrange(namespace.userList, 0, -1, function(err, v) {
            if (callback) {
                callback(v);
            }
        })
    },

    addMessage: function(message) {
        var receiverName = message.goal;
        var senderName = message.username;

        if (message.constructor !== String)
            message = JSON.stringify(message);
        this.redis.rpush(namespace.messages + senderName, message);
        this.redis.rpush(namespace.messages + receiverName, message);
    },

    getMessageHistory: function(username, callback) {
        this.redis.lrange(namespace.messages + username, 0, -1, function(err, v) {
            if (callback)
                callback(v);
        })
    },

    getFriendsList: function(username, callback) {
        this.redis.lrange(namespace.friendsList + username, 0, -1, function(err, v) {
            if (callback)
                callback(v);
        });
    },

    addFriend: function(username, friendsName) {
        this.redis.rpush(namespace.friendsList + username, friendsName);
        this.redis.rpush(namespace.friendsList + friendsName, username);
    },

    deleteFriend: function(username, friendsName) {
        this.redis.lrem(namespace.friendsList + username, 1, friendsName);
        this.redis.lrem(namespace.friendsList + friendsName, 1, username);
        // delete messages
        that = this;
        this.getMessageHistory(username, function(msgHistory) {
            that.redis.del(namespace.messages + username);
            for (var idx in msgHistory) {
                var msg = JSON.parse( msgHistory[idx] );
                if (msg.goal == friendsName || msg.username == friendsName)
                    continue;
                else
                    that.addMessage(msg);
            }
        });
        this.getMessageHistory(friendsName, function(msgHistory) {
            that.redis.del(namespace.messages + friendsName);
            for (var idx in msgHistory) {
                var msg = JSON.parse( msgHistory[idx] );
                if (msg.goal == username || msg.friendsName == username)
                    continue;
                else
                    that.addMessage(msg);
            }
        });
    },

    addNewMsgSign: function(message) {
        var receiverName = message.goal;
        if (message.constructor !== String)
            message = JSON.stringify(message);
        this.redis.rpush(namespace.newMsgSigns + receiverName, message);
    },

    getNewMsgSigns: function(username, callback) {
        this.redis.lrange(namespace.newMsgSigns + username, 0, -1, function(err, v) {
            if (callback)
                callback(v);
        });
    },

    deleteNewMsgSigns: function(username) {
        this.redis.del(namespace.newMsgSigns + username);
    }
}

function CharacterData(texture, position, rotation, roomName) {
    this.texture = texture || null,
    this.position = position || null,
    this.rotation = rotation || null,
    this.roomName = roomName || null
}

var client = DB.redis = redis.createClient();

client.on('connect', function() {
    client.select(database_idx);
    console.log("Connected to redis database", database_idx);
    DB.init();
})

module.exports = DB;
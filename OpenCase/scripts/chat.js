$(function () {
    var MESSAGE_LIMIT = parseInt($("#chat__new-message").attr("max"));
    $("#chat__new-message").on('keydown paste', function (event) {
        if (event.keyCode == 13) {
            $("#chat__send-new-message").click();
            event.preventDefault();
        }
        if (this.innerHTML.length >= this.getAttribute("max") && event.keyCode != 8) {
            event.preventDefault();
        }
    });
    
    var goToChat = false;
    
    //User location
    $.get("http://ipinfo.io", function(response) {
        Player.country = response.country.toLowerCase();
    }, "jsonp");
    
    if (/chat-\w{2}$/.test(history.state)) {
        var goToChat = history.state.match(/chat-(\w{2})/)[1];
    } else {
        history.replaceState("chat-rooms", null, null);
    }
    
    var rooms = "";
    for (var i = 0; i < fbChat.rooms.length; i++) {
        rooms += "<div class='chat__rooms__room" + (Settings.language == fbChat.rooms[i].code ? ' playerLang' : '') + "' data-room=\"" + fbChat.rooms[i].code + "\">";
        rooms += "<img src=\"../images/flags/" + fbChat.rooms[i].flag + "\"><span>" + fbChat.rooms[i].name + "</span></div>";
    }
    $('.chat__rooms').html(rooms);
    firebase.auth().onAuthStateChanged(function (user) {
        // Once authenticated, instantiate Firechat with the logged in user
        if (firebase.auth().currentUser != null && !goToChat) {
            $("#login").hide();
            $("#chat").hide();
            $(".chat__rooms-container").show();
            fbProfile.isModerator(null, function(isModerator) {
                fbChat.isModerator = isModerator;
            })
        } else if (firebase.auth().currentUser != null && goToChat != false) {
            fbChat.setChatRef(goToChat);
            $("#login").hide();
            $("#chat").show();
            $(".chat__rooms-container").hide();
            fbChat.initChat('.chat__messages');
            fbProfile.isModerator(null, function(isModerator) {
                fbChat.isModerator = isModerator;
            })
        } else {
            $("#chat").hide();
            $(".chat__rooms-container").hide();
            $("#login").show();
        }
    });
     
    $(document).on('click', '.message__info', function() {
        var nickname = $($(this).find('.message__from')[0]).text();
        var currentText = $('#chat__new-message').text();
        if (currentText.indexOf('@'+nickname) == -1 && currentText.length + nickname.length < MESSAGE_LIMIT)
            $('#chat__new-message').append('@'+nickname+', ');
    })
    
    $(document).on('click', '.delete-message', function() {
        var msgKey = $(this).closest('.chat__message').data('msgkey');
        var msgText = $(this).closest('.message__info').children('.message__text').text();
        Lobibox.confirm({
            iconSource : 'fontAwesome',
            title : Localization.chat2.delete_msg_title[Settings.language],
            msg : Localization.chat2.delete_msg[Settings.language],
            callback : function ($this, type, ev) {
                if (type == 'yes') {
                    fbChat.deleteMsg(msgKey);
                    if (isAndroid()) {
                        client.sendToAnalytics('Chat', 'Модератор', "Модератор удалил сообщение.", msgText+' | '+Player.nickname);
                    }
                }
            }
        });
    })
    
    $(document).on('click', '.chat__rooms__room', function () {
        fbChat.setChatRef($(this).data('room'));
        $("#login").hide();
        $("#chat").show();
        $(".chat__rooms-container").hide();
        if (isAndroid()) {
            client.sendToAnalytics('Chat', 'Open Chat Room', 'Open Chat Room', "Room: "+$(this).data('room'));
            fbProfile.getAndroidID(function(androidID){
                if (!androidID || androidID == "") {
                    fbProfile.setAndroidID();
                }
            })
        }
        fbChat.initChat('.chat__messages');
        history.pushState('chat-'+$(this).data('room'), "Chat Room", 'chat.html?room='+$(this).data('room'))
    })
    $(document).on('click', '#login button', function () {
        $(".chat__messages").append('<li id="js-loading-inventory" data-from="1"><div class="cssload-container"><div class="cssload-speeding-wheel"></div></div></li>');
        setTimeout(function () {
            fbChat.initChat('.chat__messages');
        }, 2000);
    });
    
    /*$(document).on('click', '.chat__message img', function () {
        var uid = $(this).data('userid');
        if (typeof uid == 'undefined') return false;
        if (isAndroid())
            client.sendToAnalytics('Chat', 'Open profile', "Player clicked on img in chat", 'UserId: '+$(this).data('userid'));
        window.location = 'profile.html?uid=' + uid;
    })*/
    
    $(document).on('click', '#forgot-pass',function() {
        fbProfile.forgotPassword($("#email").val());
        if (isAndroid())
            client.sendToAnalytics('Profile', 'Forgot pass', "Pressed on 'Forgot password' button", "none");
    })
});

window.addEventListener('popstate', function(e) {
    var prev = e.state;
    if (prev == 'chat-rooms') {
        $("#login").hide();
        $("#chat").hide();
        $(".chat__rooms-container").show();
    } else if (/chat-\w{2}/.test(prev)) {
        var room = prev.match(/chat-(\w{2})/)[1];
        fbChat.setChatRef(room);
        $("#login").hide();
        $("#chat").show();
        $(".chat__rooms-container").hide();
        fbChat.initChat('.chat__messages');
    }
}, false);
var fbChat = (function (module) {
    module.chatRef = '';
    module.isModerator = false;
    module.chatRoomsRef = firebase.database().ref('chatRooms');
    module.rooms = [
        {
            name: "Русский"
            , flag: 'RU.svg'
            , code: 'RU'
        , }, {
            name: 'Polski'
            , flag: 'PL.svg'
            , code: 'PL'
        , }, {
            name: 'English'
            , flag: 'EN.svg'
            , code: 'EN'
        , }, {
            name: 'Deutsch'
            , flag: 'DE.svg'
            , code: 'DE'
        , }, {
            name: 'Türk'
            , flag: 'TR.svg'
            , code: 'TR'
        , }, {
            name: 'Românesc'
            , flag: 'RO.svg'
            , code: 'RO'
        , }, {
            name: 'Suomalainen'
            , flag: 'FI.svg'
            , code: 'FI'
        , }, {
            name: 'Português'
            , flag: 'PT.svg'
            , code: 'PT'
        , }, {
            name: 'Français'
            , flag: 'FR.svg'
            , code: 'FR'
        , }
    ];
    module.setChatRef = function(ref) {
        if (module.chatRef) module.chatRef.off('child_added');
        module.chatRef = firebase.database().ref('chat/'+ref);
    }
    module.sendMsg = function (userName, text, img, country) {
        country = country || null;
        var time = new Date();
        time = "" + time;
        var uid = firebase.auth().currentUser.uid;
        firebase.database().ref('users/'+uid+'/moder/group').once('value', function(snapshot) {
            var group = snapshot.val() ;
            fbChat.chatRef.push({
                username: userName
                , uid: uid
                , text: text
                , time: time
                , img: img
                , group: group
                , country: country
                , timestamp: firebase.database.ServerValue.TIMESTAMP
            });
        })
        if (isAndroid())
            client.sendToAnalytics('Chat', 'Send message', "User send msg", text);
    }
    module.deleteMsg = function (msgKey) {
        module.chatRef.child(msgKey).remove();
    }
    module.clearChat = function (ref) {
        var chatRef = firebase.database().ref('chat/'+ref);
        (function(chatRef) {
            chatRef.limitToLast(40).once('value', function(snapshot) {
                chatRef.set(snapshot.val());
            });
        })(chatRef)
    }
    module.clearChatFull = function(ref) {
        var chatRef = firebase.database().ref('chat/'+ref);
        chatRef.remove();
    }
    module.loadAllChat = function (ref) {
        var chatRef = firebase.database().ref(ref);
        chatRef.once('value', function(snapshot) {
            messages = snapshot.val();
            for (key in messages) {
                var time = new Date(messages[key].timestamp);
                time = time.toLocaleString((Settings.language == 'RU') ? 'ru' : 'en-US', {
                    hour: 'numeric'
                    , minute: 'numeric'
                });
                console.log('('+messages[key].uid+') ['+time+']'+messages[key].username+': '+messages[key].text);
            }
            /*for (key in messages) {
                newMsg(key, messages[key].uid, messages[key].img, messages[key].username, messages[key].timestamp, messages[key].text, messages[key].group);
            }
            $("html, body").animate({
                    scrollTop: $(document).height()
            }, 500);*/
        });
    }
    module.initChat = function (selector) {
        var newItems = false;
        $(selector + " li").remove();
        if (module.chatRef == '') return;
        var chatRef = module.chatRef;
        
        chatRef.limitToLast(40).once('value').then(function (snapshot) {
            newItems = true;
            messages = snapshot.val();
            for (key in messages) {
                newMsg(key, messages[key]);
            }
            $("html, body").animate({
                    scrollTop: $(document).height()
            }, 500);
        })
        
        chatRef.limitToLast(1).on('child_added', function (data) {
            if (!newItems) return;
            if ($("li[data-msgkey='" + data.key + "']").length == 0) {
                newMsg(data.key, data.val());
                $("html, body").animate({
                    scrollTop: $(document).height()
                }, 200);
            }
        });
        
        chatRef.limitToLast(40).on('child_removed', function (data) {
            removeMsg(data.key);
        });
    }
    return module;
}(fbChat || {}));

function newMsg(key, message) {
    var uid = message.uid,
        img = message.img,
        username = message.username,
        time = message.timestamp,
        text = message.text,
        group = message.group || "",
        country = message.country || "";
    
    var flag = "";
    if (country)
        flag = '<img src="../images/none.png" class="flag flag-'+country.toLowerCase()+'"/>';        
    var time = new Date(time);
    time = time.toLocaleString((Settings.language == 'RU') ? 'ru' : 'en-US', {
        hour: 'numeric'
        , minute: 'numeric'
    });
    
    var moderBlock = "<div class='message__moderator'><i aria-hidden='true' class='fa fa-times delete-message'></i></div>";
    
    var myMessage = false;
    if (uid == firebase.auth().currentUser.uid) myMessage = true;
    text = uid == "TrgkhCFTfVWdgOhZVUEAwxKyIo33" ? text : fbProfile.XSSreplace(text);
    username = fbProfile.XSSreplace(username);
    var toMe = text.indexOf('@'+Player.nickname) != -1 ? true : false;
    text = text.replace(/@(.*?),[ ]?/gi, '<b class="player-nickname">@$1</b>, ');
    var msg = "<li class='animated bounceIn chat__message" + (myMessage ? " my_message" : "") + (toMe ? " msgToMe" : "") + " " + (group == 'vip' ? 'vip' : '')+ "' data-msgkey='" + key + "'>" + "<a href='profile.html?uid="+uid+"'><img src='" + img + "' data-userID='" + uid + "'></a>" + "<div class='message__info'>" + "<div class='message__info__from-time'>" + "<span class='message__from'>" + username + "</span>" + flag + (group != "" ? "<span class='group'>"+group+"</span>" : "") + "<span class='message__time'>" + time + "</span>" + (fbChat.isModerator ? moderBlock : "") + "</div>" + "<span class='message__text'>" + text + "</span>" + "</div></li>";
    $(".chat__messages").append(msg);
}

function removeMsg(key) {
    try {
        $("li[data-msgkey='" + key + "']").removeClass('bounceIn');
        $("li[data-msgkey='" + key + "']").addClass('zoomOut');
        setTimeout(function () {
            $('.zoomOut').remove();
        }, 1000);
    }
    catch (e) {}
}
$(document).on('click', '#chat__send-new-message', function () {
    var msg = $('#chat__new-message').text();
    if (msg.length == 0) return false;
    fbChat.sendMsg(Player.nickname, msg, '../images/ava/' + Player.avatar, Player.country);
    $('#chat__new-message').empty();
});
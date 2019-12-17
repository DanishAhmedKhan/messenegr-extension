console.log('Hello from the background!');

const backendUrl = 'http://localhost:4400';
//const backendUrl = 'http://13.232.210.23:4400';

// Load user auth token required for requires
let userAuthToken;
chrome.storage.sync.get({ userAuthToken: '' }, function(result) {
    userAuthToken = result.userAuthToken;
});


chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log('onMessageListener');
    if (message.type == "addTagToFriend") {
        console.log('adding tag to friend...');
        let data = {
            friendId: message.friendId,
            friendName: message.friendName,
            tag: message.tag,
            imageUrl: message.friendImageUrl,
        };

        $.ajax({
            type: 'POST',
            url: backendUrl + '/api/user/addTagToFriend',
            data: data,
            beforeSend: function(request) {
                request.setRequestHeader("x-user-auth-token", message.userAuthToken);
            },
            success: function(data, textStatus, request) {
                console.log(data);
            },
            error: function (request, textStatus, errorThrown) {
                console.log(request);
            }
        });
    } else if (message.type == 'changeTag') {
        console.log('Changing tag value...');
        let data = {
            oldTag: message.oldTag,
            newTag: message.newTag,
        };

        $.ajax({
            type: 'POST',
            url: backendUrl + '/api/user/changeTag',
            data: data,
            beforeSend: function(request) {
                request.setRequestHeader("x-user-auth-token", message.userAuthToken);
            },
            success: function(data, textStatus, request) {
                console.log(data);
            },
            error: function (request, textStatus, errorThrown) {
                console.log(request);
            }
        });
    }
});
console.log('Hello from the background!');

const backendUrl = 'http://192.168.0.104:4400';

// Load user auth token required for requires
let userAuthToken;
chrome.storage.sync.get({ userAuthToken: '' }, function(result) {
    userAuthToken = result.userAuthToken;
});


chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.type == "addTagToFriend") {
        console.log('adding tag to friend...');
        let data = {
            friendId: message.friendId,
            friendName: message.friendName,
            tag: message.tag,
            imageUrl: message.imageUrl,
        };
        console.log(data);

        $.ajax({
            type: 'POST',
            url: backendUrl + '/api/user/addTagToFriend',
            data: data,
            beforeSend: function(request) {
                request.setRequestHeader("x-user-auth-token", userAuthToken);
            },
            success: function(data, textStatus, request) { },
            error: function (request, textStatus, errorThrown) {
                console.log('Error in addTagToFriend server');
            }
        })
    }
});
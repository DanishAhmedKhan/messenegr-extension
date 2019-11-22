console.log('Hello from popup!');

const backendUrl = 'http://192.168.0.101:4400';
const colors = ['#fa697c', '#10316b', '#94aa2a', '#fc7fb2', '#888888', '#c71c56', '#a25016', '	#6a3577',
                ' #005b96 ', '#451e3e', '#f37736', '#ffa700'];


$signupBox = $('.signup_box');
$loginBox = $('.login_box');
$mainContentBox = $('.main_content');

// Display signup section
function openSignup() {
    $signupBox.css('display', 'block');
    $loginBox.css('display', 'none');
    $mainContentBox.css('display', 'none');
}

// Display login section
function openLogin() {
    $signupBox.css('display', 'none');
    $loginBox.css('display', 'block');
    $mainContentBox.css('display', 'none');
}

// Diaplay main section ehen user is loggged in
function openMain() {
    $signupBox.css('display', 'none');
    $loginBox.css('display', 'none');
    $mainContentBox.css('display', 'block');
}

// Get the user authToken
let userAuthToken = '';
chrome.storage.sync.get(['userAuthToken'], function(result) {
    authToken = result.userAuthToken;
    if (authToken == null || authToken == '') openSignup(); // Not logged in
    else {
        // Logged in
        openMain();
        userAuthToken = authToken;
    }
});


$('.go_to_signup').click(() => {
    openSignup();
});

$('.go_to_login').click(() => {
    openLogin();
});


let tags;
let friendList;


// Get tags from storage
chrome.storage.sync.get({tags: []}, function(result) {
    tags = result.tags;
    $tagBox = $('.tag_box');
    tagHtml = '';
    // Add all saved tags to the popup
    for (let i = 0; i < tags.length; i++) {
        tagHtml += `<div class="tag_item" style="background:${tags[i].color}">
                        <div class="tag_value" style="inline-block;">${tags[i].name}</div>
                        <div class="tag_remove" style="display:inline-block;margin-left:10px;">x</div>
                    </div>`;
    }
    $tagBox.append(tagHtml);
});


// Signup form action
$('#signup_form').submit(function(e) {
    e.preventDefault();

    let formData = {
        email: $('#email_signup').val(),
        password: $('#password_signup').val(),
    };

    if (formData.password != $('#confirm_password_signup')) {
        console.log('password does not match confirm password');
        return;
    }

    $.ajax({
        type: 'POST',
        url: backendUrl + '/api/user/signup',
        data: formData,
        success: function(data, textStatus, request) {
            // Save auth token required for further requests
            const authToken = request.getResponseHeader('x-user-auth-token');
            userAuthToken = authToken;
            chrome.storage.sync.set({userAuthToken: authToken}, function() {
                openMain();
                // Empty input fields
                $('#email_signup').val('');
                $('#password_signup').val('');
            });
            loadDataFromServer();
        },
        error: function (request, textStatus, errorThrown) {
            console.log('Error signing up');
        }
    })
});



// Login form action
$('#login_form').submit(function(e) {
    e.preventDefault();

    let formData = {
        email: $('#email_login').val(),
        password: $('#password_login').val(),
    };

    $.ajax({
        type: 'POST',
        url:backendUrl + '/api/user/login',
        data: formData,
        success: function(data, textStatus, request) {
            // Save auth token required for further requests
            const authToken = request.getResponseHeader('x-user-auth-token');
            userAuthToken = authToken;
            chrome.storage.sync.set({userAuthToken: authToken}, function() {
                openMain();
                // Empty input fields
                $('#email_login').val('');
                $('#password_login').val('');
            });
            loadDataFromServer();
        },
        error: function (request, textStatus, errorThrown) {
            console.log('Error signing up');
        }
    });
});


function loadDataFromServer() {
    // Get all the tags
    $.ajax({
        type: 'POST',
        url: backendUrl + '/api/user/getAllTagsAndFriendList',
        beforeSend: function(request) {
            request.setRequestHeader("x-user-auth-token", userAuthToken);
        },
        success: function(data, textStatus, request) {
            tags = data.data.tags;
            // Save tags to storage
            chrome.storage.sync.set({ tags });

            // Add tags to popup html
            let tagHtml = '';
            for (let i = 0; i < tags.length; i++) {
                tagHtml += '<div class="tag_item">' + tags[i].name + '</div>';
            }
            $('.tag_box').append(tagHtml);

            friendList = data.data.friends;
            // TODO: save friend list to storage
            chrome.storage.sync.set({ friendList });

            // Enable extension
            chrome.tabs.getAllInWindow(null, function(tabs) {
                // Find messenger tab
                for (let i = 0; i < tabs.length; i++) {
                    if (tabs[i].title == 'Messenger') {
                        chrome.tabs.sendMessage(tabs[i].id, { 
                            action: 'enableExtension',
                            userAuthToken: userAuthToken,
                            tags: tags,
                            friendList: friendList,
                        });
                        break;
                    }                        
                }
            });
        },
        error: function (request, textStatus, errorThrown) {
            console.log('Error signing up');
        }
    });
}


// new tag form submit
$('#add_tag_form').submit(function(e) {
    e.preventDefault();
    $tagBox = $('.tag_box');
    $tagInput = $('#tag_input');
    tag = $tagInput.val(); // Tag value

    // Cheack if tag is alredy present
    for (let i = 0; i < tags.length; i++) {
        if (tags[i] == tag) {
            console.log('Tag already present');
            return;
        }
    }

    // Get aa random color for the tag
    let r = Math.floor(Math.random() * colors.length);
    console.log(r);
    let color = colors[r];
    console.log(color);

    // Tag not present so add to the tags array
    tags.push({ name: tag, color: color });

    // Add tag to popup
    $tagBox.append(`<div class="tag_item" style="background:${color}">
                        <div class="tag_value" style="inline-block;">${tag}</div>
                        <div class="tag_remove" style="display:inline-block;margin-left:10px;">x</div>
                    </div>`);
    // Reset tag input field to blank
    $tagInput.val('');

    // Add tag to the server database
    $.ajax({
        type: 'POST',
        url: backendUrl + '/api/user/addTag',
        data: {
            name: tag,
            color: color,
        },
        beforeSend: function(request) {
            request.setRequestHeader("x-user-auth-token", userAuthToken);
        },
        success: function(data, textStatus, request) { },
        error: function (request, textStatus, errorThrown) {
            console.log('Error signing up');
        }
    });

    // Save the tag to local stoarge
    chrome.storage.sync.set({ tags });

    // Send tag to mesenger content.js for adding option tag to the select tag
    chrome.tabs.getAllInWindow(null, function(tabs) {
        // Find messenger tab
        for (let i = 0; i < tabs.length; i++) {
            if (tabs[i].title == 'Messenger') {
                chrome.tabs.sendMessage(tabs[i].id, { action: 'addTag', tag, color });
                break;
            }                        
        }
    });
});

// Rempve tag
$('.tag_box').on('click', '.tag_remove', function(e) {
    console.log('remove');
    e.stopPropagation();
    e.stopImmediatePropagation();

    let $parent = $(this).parent();
    let tag = $parent.find('.tag_value').text().trim();
    $parent.remove();

    // Remove tag from the server database
    $.ajax({
        type: 'POST',
        url: backendUrl + '/api/user/removeTag',
        data: {
            name: tag,
        },
        beforeSend: function(request) {
            request.setRequestHeader("x-user-auth-token", userAuthToken);
        },
        success: function(data, textStatus, request) { },
        error: function (request, textStatus, errorThrown) {
            console.log('Error removing tag');
        }
    });

    console.log('Tag = ' + tag);
    // Find and remove tag from tag array
    for (let i = 0; i < tags.length; i++) {
        if (tags[i].name == tag) {
            tags.splice(i, 1);
            break;
        }
    }

    // Save the tag to local stoarge
    chrome.storage.sync.set({ tags });

    // 
    chrome.tabs.getAllInWindow(null, function(tabs) {
        // Find messenger tab
        for (let i = 0; i < tabs.length; i++) {
            if (tabs[i].title == 'Messenger') {
                chrome.tabs.sendMessage(tabs[i].id, { action: 'removeTag', tag });
                break;
            }                        
        }
    });
});


// Logout button action
$('.logout_box').click(() => {
    // Clear all storage data and oprn login form
    chrome.storage.sync.clear(function(result) {
        $('.tag_box').html('');
        openLogin();

        // Send message to content.js to disable the extension
        chrome.tabs.getAllInWindow(null, function(tabs) {
            for (let i = 0; i < tabs.length; i++) {
                // Find messenger tab
                if (tabs[i].title == 'Messenger') {
                    chrome.tabs.sendMessage(tabs[i].id, { action: 'logout' });
                    break;
                }                        
            }
        });
    });
});
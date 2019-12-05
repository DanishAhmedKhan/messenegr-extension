let backendUrl = 'http://192.168.0.102:4400';
//const backendUrl = 'http://13.232.210.23:4400';

let userAuthToken
let templates = [];
let messages = [];

chrome.storage.sync.get(['templates', 'userAuthToken'], function(result) {
    if (result.userAuthToken != null)
        userAuthToken = result.userAuthToken;
    if (result.templates != null)
        templates = result.templates;

    let storageKeys = [];
    for (let i = 0; i < templates.length; i++) {
        storageKeys.push(generateKey(templates[i]));
    }

    chrome.storage.sync.get(storageKeys, function(r) {
        for (let i = 0; i < templates.length; i++) {
            let key = generateKey(templates[i]);
            messages[key] = r[key];
        }

        initialize();
    });
}); 

function generateKey(str) {
    return str.replace(/ /g, '-');
}

function initialize() {
    let textareaScrollHeight = $('.message_textarea').prop('scrollHeight');
    console.log(textareaScrollHeight);
    $('.messages').css('height', 'calc(100% - ' + (textareaScrollHeight + 16 + 16) + 'px)');
    $('.message_textarea_box').css('height', (textareaScrollHeight + 16 + 16) + 'px');

    templateHtml = '';
    for (let i = 0; i < templates.length; i++) {
        templateHtml += `
            <div class="template">
                <div class="template_value">
                    ${templates[i]}
                </div>
                <div class="template_action">
                    <i class="fa fa-remove delete_template"></i>
                </div>
            </div>
        `;
    }

    $('.templates').html(templateHtml);
}

function removeOverlay() {
    $('.overlay').css('display', 'none');
    $('.overlay_heading').html('');
    $('.overlay_text').html('');
    $('.overlay_action').html('');
}

let templateToBeDeleted;
function deleteTemplate(template) {
    if (templateToBeDeleted.hasClass('template_selected')) {
        $('.messages').html('');
    }
    templateToBeDeleted.remove();

    for (let i = 0; i < templates.length; i++) {
        if (templates[i] == template) {
            templates.splice(i, 1);
            delete messages[generateKey(template)];
            break;
        }
    }

    chrome.storage.sync.set({ templates });

    // Send message to content.js to disable the extension
    chrome.tabs.getAllInWindow(null, function(tabs) {
        for (let i = 0; i < tabs.length; i++) {
            // Find messenger tab
            if (tabs[i].title == 'Messenger') {
                chrome.tabs.sendMessage(tabs[i].id, { action: 'deleteTemplate', template });
                break;
            }               
        }
    });

    $.ajax({
        type: 'POST',
        url: backendUrl + '/api/user/removeTemplate',
        data: { template },
        beforeSend: function(request) {
            request.setRequestHeader("x-user-auth-token", userAuthToken);
        },
        success: function(data, textStatus, request) {
            console.log(data.data);
        },
        error: function (request, textStatus, errorThrown) {
            console.log('Error removing template to friend');
        }
    });
}

$('.add_template_button').click(function(e) {
    let template = $('.add_template_input').val();

    $('.add_template_input').val('');

    for (let i = 0; i < templates.length; i++) {
        if (templates[i] == template) {
            console.log('Template with this name already exist');
            return;
        }
    }

    let templateHtml = `
        <div class="template">
            <div class="template_value">
                ${template}
            </div>
            <div class="template_action">
                <i class="fa fa-remove delete_template"></i>
            </div>
        </div>
    `;

    $('.templates').append(templateHtml);

    templates.push(template);
    chrome.storage.sync.set({ templates });

    // Send message to content.js to disable the extension
    chrome.tabs.getAllInWindow(null, function(tabs) {
        for (let i = 0; i < tabs.length; i++) {
            // Find messenger tab
            if (tabs[i].title == 'Messenger') {
                chrome.tabs.sendMessage(tabs[i].id, { action: 'newTemplate', template });
                break;
            }                        
        }
    });

    $.ajax({
        type: 'POST',
        url: backendUrl + '/api/user/addTemplate',
        data: { template },
        beforeSend: function(request) {
            request.setRequestHeader("x-user-auth-token", userAuthToken);
        },
        success: function(data, textStatus, request) {
            console.log(data);
        },
        error: function (request, textStatus, errorThrown) {
            console.log(request);
        }
    });
});

$('.templates').on('click', '.template', function(e) {
    let template = $(this).find('.template_value').text().trim();
    $('.template_selected').removeClass('template_selected');
    $(this).addClass('template_selected');

    let key = generateKey(template);
    let messageHtml = '';
    if (messages[key] == null) messages[key] = [];
    for (let i = 0; i < messages[key].length; i++) {
        messageHtml += `
            <div class="message">
                <div class="message_value">
                    ${messages[key][i]}
                </div>
                <div class="message_action">
                    <i class="fa fa-remove delete_message"></i>
                </div>
            </div>
        `;
    }

    $('.messages').html(messageHtml);
});

$('.templates').on('click', '.delete_template', function(e) {
    let template = $(this).parent().prev().text().trim();

    if (messages[generateKey(template)].length > 0) {
        $('.overlay_view').css({
            'width': '300px',
            'height': 'auto',
        });
        $('.overlay').css('display', 'block');

        $('.overlay_heading').html(`
            <i class="fa fa-warning" style="color:#ff9966"></i><span style="color:#ff9966;margin-left:8px;">Warning</span>
        `);
        $('.overlay_text').html(`Are you sure you want to delete template <span style="font-weight:bold;">${template}</span>?`);
        $('.overlay_action').html(`
            <div class="secondary_button action_template_no" style="width:65px;margin-right:20px;">No</div>
            <div class="secondary_button action_template_yes" style="width:65px;">Yes</div>
        `);

        templateToBeDeleted = $(this).parent().parent();

        return false;
    }

    let $template = $(this).parent().parent();
    if ($template.hasClass('template_selected')) {
        $('.messages').html('');
    }
    $template.remove();

    for (let i = 0; i < templates.length; i++) {
        if (templates[i] == template) {
            templates.splice(i, 1);
            delete messages[generateKey(template)];
            break;
        }
    }

    chrome.storage.sync.set({ templates });

    // Send message to content.js to disable the extension
    chrome.tabs.getAllInWindow(null, function(tabs) {
        for (let i = 0; i < tabs.length; i++) {
            // Find messenger tab
            if (tabs[i].title == 'Messenger') {
                chrome.tabs.sendMessage(tabs[i].id, { action: 'deleteTemplate', template });
                break;
            }               
        }
    });

    $.ajax({
        type: 'POST',
        url: backendUrl + '/api/user/removeTemplate',
        data: { template },
        beforeSend: function(request) {
            request.setRequestHeader("x-user-auth-token", userAuthToken);
        },
        success: function(data, textStatus, request) {
            console.log(data.data);
        },
        error: function (request, textStatus, errorThrown) {
            console.log('Error removing template to friend');
        }
    });
});

$('.save_message').on('click', function(e) {
    let message = $('.message_textarea').val();
    let $template = $('.template_selected');
    if ($template.length == 0) {
        console.log('Template not selected');
        return;
    }
    $('.message_textarea').val('');

    let template = $template.find('.template_value').text().trim();
    let key = generateKey(template);

    if (messages[key] == null) messages[key] = [];
    messages[key].push(message);

    let storage = {};
    storage[key] = messages[key];
    chrome.storage.sync.set(storage);

    let messageHtml = `
        <div class="message">
            <div class="message_value">
                ${message}
            </div>
            <div class="message_action">
                <i class="fa fa-remove delete_message"></i>
            </div>
        </div>
    `;

    $('.messages').append(messageHtml);

    $('.messages').css('height', 'calc(100% - ' + (this.scrollHeight + 16 + 16) + 'px)');
    $('.message_textarea_box').css('height', (this.scrollHeight + 16 + 16) + 'px');
    $('.message_textarea').css('height', '29px');

    // Send message to content.js to disable the extension
    chrome.tabs.getAllInWindow(null, function(tabs) {
        for (let i = 0; i < tabs.length; i++) {
            // Find messenger tab
            if (tabs[i].title == 'Messenger') {
                chrome.tabs.sendMessage(tabs[i].id, { action: 'newMessage', template, message });
                break;
            }                        
        }
    });

    $.ajax({
        type: 'POST',
        url: backendUrl + '/api/user/addMessageToTemplate',
        data: {
            template, 
            message,
        },
        beforeSend: function(request) {
            request.setRequestHeader("x-user-auth-token", userAuthToken);
        },
        success: function(data, textStatus, request) {
            console.log(data.data);    
        },
        error: function (request, textStatus, errorThrown) {
            console.log('Error adding message to friend');
        }
    });
});

$('.messages').on('click', '.delete_message', function(e) {
    let message = $(this).parent().prev().text().trim();

    let $message = $(this).parent().parent();
    $message.remove();

    let template = $('.template_selected').find('.template_value').text().trim();
    let key = generateKey(template);

    for (let i = 0; i < messages[key].length; i++) {
        if (messages[key][i] == message) {
            messages[key].splice(i, 1);
            break;
        }
    }

    let storage = {};
    storage[key] = messages[key];
    chrome.storage.sync.set(storage);

    // Send message to content.js to disable the extension
    chrome.tabs.getAllInWindow(null, function(tabs) {
        for (let i = 0; i < tabs.length; i++) {
            // Find messenger tab
            if (tabs[i].title == 'Messenger') {
                chrome.tabs.sendMessage(tabs[i].id, { action: 'deleteMessage', template, message });
                break;
            }               
        }
    });

    $.ajax({
        type: 'POST',
        url: backendUrl + '/api/user/removeMessageFromTemplate',
        data: {
            template, 
            message,
        },
        beforeSend: function(request) {
            request.setRequestHeader("x-user-auth-token", userAuthToken);
        },
        success: function(data, textStatus, request) {
            console.log(data.data);    
        },
        error: function (request, textStatus, errorThrown) {
            console.log('Error adding message to friend');
        }
    });
});

$('body').on('input', '.message_textarea', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight + 2) + 'px';

    $('.messages').css('height', 'calc(100% - ' + (this.scrollHeight + 16 + 16) + 'px)');
    $('.message_textarea_box').css('height', (this.scrollHeight + 16 + 16) + 'px');
});

$('.overlay_action').on('click', '.action_template_no', function() {
    removeOverlay();
});

$('.overlay_action').on('click', '.action_template_yes', function() {
    let template = $(this).parent().prev().find('span').text().trim();
    removeOverlay();
    deleteTemplate(template);
});

$('.add_template_input').keypress(function(event){
    if(event.keyCode == 13){
        $('.add_template_button').click();
    }
});

$('.message_textarea').keypress(function(e){
    if(event.keyCode == 13 && $(this).val().trim() != '') {
        e.preventDefault();
        $('.save_message').click();
    }
});

$('.emoji_button').on('click', function(e) {
    let emojiContainer = $('.emoji_box_container');
    if (emojiContainer.css('display') == 'none') {
        emojiContainer.css('display', 'block');
    } else {
        emojiContainer.css('display', 'none');
    }
});

$('th').on('click', function(e) {
    let emoji = $(this).text().trim();
    let messageTextarea = $('.message_textarea');
    messageTextarea.val(messageTextarea.val() + emoji);

    messageTextarea.css('height', '29px');
});

// $('body').click(function(e) {
//     if (!(e.target.id == "emoji_box" || $(e.target).parents("#emoji_box").length)) {
//         let emojiContainer = $('.emoji_box_container');
//         if (emojiContainer.css('display') == 'block') {
//             emojiContainer.css('display', 'none');
//         }
//         console.log('outside');
//     }
// });
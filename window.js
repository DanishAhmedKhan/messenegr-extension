// Local development serrver
let backendUrl = 'http://localhost:4400';
// Production AWS EC2 server
// const backendUrl = 'http://13.232.210.23:4400';

let userAuthToken; // User authentication JSON web token
let templates = [];
let messages = [];

// Initialize data from loacl storage
chrome.storage.local.get(['templates', 'userAuthToken'], function(result) {
    if (result.userAuthToken != null)
        userAuthToken = result.userAuthToken;
    if (result.templates != null)
        templates = result.templates;

    let storageKeys = [];
    for (let i = 0; i < templates.length; i++) {
        storageKeys.push(generateKey(templates[i]));
    }

    chrome.storage.local.get(storageKeys, function(r) {
        for (let i = 0; i < templates.length; i++) {
            let key = generateKey(templates[i]);
            messages[key] = r[key];
            if (messages[key] == null) messages[key] = [];
        }

        console.log(messages);

        initialize();
    });
}); 

// Generate object key for a template by replacing all white spaces by '-'
function generateKey(str) {
    return str.replace(/ /g, '-');
}


function initialize() {
    // Set the proper sizes of the messages box
    let textareaScrollHeight = $('.message_textarea').prop('scrollHeight');
    $('.messages').css('height', 'calc(100% - ' + (textareaScrollHeight + 16 + 16) + 'px)');
    $('.message_textarea_box').css('height', (textareaScrollHeight + 16 + 16) + 'px');

    // Set up the templates
    templateHtml = '';
    for (let i = 0; i < templates.length; i++) {
        templateHtml += `
            <li class="template" id="i-${i}">
                <div class="template_value">
                    ${templates[i]}
                </div>
                <div class="template_action">
                    <i class="fa fa-remove delete_template"></i>
                </div>
            </li>
        `;
    }

    $('.templates').html('<ul id="templateSortable">' + templateHtml + '</ul>');
    console.log(templates);
    $('#templateSortable').sortable({
        cursor: 'move',
        delay: 100,
        start: function(event, ui) {
            let startPos = ui.item.index();
            ui.item.data('start_pos', startPos);
            console.log(startPos);
        },
        update: function(event, ui) {
            let i1 = ui.item.data('start_pos');
            let i2 = ui.item.index();
            console.log(i2);

            let tmp = templates[i1];
            templates.splice(i1, 1);
            templates.splice(i2, 0, tmp);

            chrome.storage.local.set({ templates });

            $.ajax({
                type: 'POST',
                url: backendUrl + '/api/user/changeTemplateOrder',
                data: {
                    i1, 
                    i2,
                },
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
        }
    });
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

    chrome.storage.local.set({ templates });

    // Send message to content.js to delete the template
    chrome.tabs.getAllInWindow(null, function(tabs) {
        for (let i = 0; i < tabs.length; i++) {
            if (tabs[i].title == 'Messenger') { // Find messenger tab
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
            console.log(data);
        },
        error: function (request, textStatus, errorThrown) {
            console.log(request);
        }
    });
}

$('.add_template_button').click(function(e) {
    let template = $('.add_template_input').val().trim();

    $('.add_template_input').val('');

    // Check for template with the same name
    for (let i = 0; i < templates.length; i++) {
        if (templates[i] == template) {
            console.log('Template with this name already exist');
            // TODO: Display the error message on the overlay
            return;
        }
    }

    // Add the new template
    let templateHtml = `
        <li class="template">
            <div class="template_value">
                ${template}
            </div>
            <div class="template_action">
                <i class="fa fa-remove delete_template"></i>
            </div>
        </li>
    `;
    $('.templates ul').append(templateHtml);

    // Add template to local storage
    templates.push(template);
    chrome.storage.local.set({ templates });

    // Send message to content.js to add a new template
    chrome.tabs.getAllInWindow(null, function(tabs) {
        for (let i = 0; i < tabs.length; i++) {
            if (tabs[i].title == 'Messenger') { // Find messenger tab
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
        // Check for a normal message or an image
        let main = '';
        if (messages[key][i].indexOf('--template--') < 0) {
            let message = messages[key][i];
            let regex = new RegExp("([a-zA-Z0-9]+://)?([a-zA-Z0-9_]+:[a-zA-Z0-9_]+@)?([a-zA-Z0-9.-]+\\.[A-Za-z]{2,4})(:[0-9]+)?(/.*)?")
            let match = regex.exec(message);
            if (match != null) {
                let m = match['0']
                main = message.replace(match['0'], `<a href='${match['0']}'>` + match['0'] + '</a>');
            } else {
                main = messages[key][i];
            }
            // main = messages[key][i];
        } else {
            main = `<img src="${'http://localhost:4400/temp/' + messages[key][i]}" 
                style="width:210px;margin-top:4px;">`;
        }

        messageHtml = messageHtml + `
            <li class="message">
                <div class="message_value">` + 
                    main + 
                `</div>
                <div class="message_action">
                    <i class="fa fa-remove delete_message" style="cursor:pointer;"></i>
                </div>
            </li>
        `;
    }

    $('.messages').html('<ul id="messageSortable">' + messageHtml + '</ul>');
    $('#messageSortable').sortable();
});

$('.templates').on('click', '.delete_template', function(e) {
    let template = $(this).parent().prev().text().trim();
    let key = generateKey(template);

    //if (messages[key] == null) messages[key]

    // Give a warning before deleting a templayte that has one or more message
    console.log(messages);
    console.log(key);
    console.log(messages[key]);
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

    // Delete message
    for (let i = 0; i < templates.length; i++) {
        if (templates[i] == template) {
            templates.splice(i, 1);
            delete messages[generateKey(template)];
            break;
        }
    }

    chrome.storage.local.set({ templates });

    // Send message to content.js to delete template
    chrome.tabs.getAllInWindow(null, function(tabs) {
        for (let i = 0; i < tabs.length; i++) {
            if (tabs[i].title == 'Messenger') { // Find messenger tab
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
    let message = $('.message_textarea').val().trim();
    // let regex = new RegExp("([a-zA-Z0-9]+://)?([a-zA-Z0-9_]+:[a-zA-Z0-9_]+@)?([a-zA-Z0-9.-]+\\.[A-Za-z]{2,4})(:[0-9]+)?(/.*)?")
    // let match = regex.exec(message);
    // console.log(match);
    // if (match != null) {
    //     let i1 = match.index;
    //     let i2 = message.indexOf(i1, ' ');
        
    // }

    let $template = $('.template_selected');
    if ($template.length == 0) {
        console.log('Template not selected');
        // TODO: Show a message on overlay
        return;
    }
    $('.message_textarea').val('');

    let template = $template.find('.template_value').text().trim();
    let key = generateKey(template);

    if (messages[key] == null) messages[key] = [];
    messages[key].push(message);

    let storage = {};
    storage[key] = messages[key];
    chrome.storage.local.set(storage);

    let messageHtml = `
        <li class="message">
            <div class="message_value">
                ${message}
            </div>
            <div class="message_action">
                <i class="fa fa-remove delete_message" style="cursor:pointer;"></i>
            </div>
        </li>
    `;

    $('.messages ul').append(messageHtml);

    $('.messages').css('height', 'calc(100% - ' + (this.scrollHeight + 16 + 16) + 'px)');
    $('.message_textarea_box').css('height', (this.scrollHeight + 16 + 16) + 'px');
    $('.message_textarea').css('height', '29px');

    // Send message to content.js to add the message
    chrome.tabs.getAllInWindow(null, function(tabs) {
        for (let i = 0; i < tabs.length; i++) {
            if (tabs[i].title == 'Messenger') { // Find messenger tab
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
            console.log(data);    
        },
        error: function (request, textStatus, errorThrown) {
            console.log(request);
        }
    });
});

$('.messages').on('click', '.delete_message', function(e) {
    let message = '';
    if ($(this).parent().prev().find('img').length > 0) {
        message = $(this).parent().prev().find('img').attr('src');
        message = message.substring(message.lastIndexOf('/') + 1);
    } else {
        message = $(this).parent().prev().text().trim();
    }

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

    // Delete message from local storage
    let storage = {};
    storage[key] = messages[key];
    chrome.storage.local.set(storage);

    // Send message to content.js to delete message
    chrome.tabs.getAllInWindow(null, function(tabs) {
        for (let i = 0; i < tabs.length; i++) {
            if (tabs[i].title == 'Messenger') { // Find messenger tab
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

$('.add_template_input').keypress(function(event) {
    if(event.keyCode == 13){
        $('.add_template_button').click();
    }
});

$('.message_textarea').keypress(function(e) {
    if(event.keyCode == 13 && $(this).val().trim() != '') {
        e.preventDefault();
        $('.save_message').click();
    }
});

$('.emoji_button').on('click', function(e) {
    e.stopPropagation();
    e.stopImmediatePropagation();

    let emojiContainer = $('.emoji_box_container');
    if (emojiContainer.css('display') == 'none') {
        emojiContainer.css('display', 'block');
    } else {
        emojiContainer.css('display', 'none');
    }
});

$('.load_image').on('click', function(e) {
    $('#loadImageInput').trigger('click');
});

$('#loadImageInput').change(function(e) {
    saveImage(this);
});

$('#loadImageForm').on('submit', function(e) {
    e.preventDefault(); // Prevent page reload

    let formData = new FormData(this);
    console.log(formData);
    let data = { ...formData, a: 'aaa' };
    console.log(data);
});

async function saveImage(input) {
    if (input.files && input.files[0]) {
        let img = input.files[0];

        // if (img.type.match(/image\/jpe?g/i) !== null) {
        //     JpgToPngConvertor(img).process();
        // }



        let fn = input.files[0].name;
        let mt = input.files[0].type;
        console.log('Name ' + fn + '  Mt' + mt);

        if (mt != 'image/jpeg' && mt != 'image/jpg' && mt != 'image/png'){
            console.log('File type should be an image');
            return;
        }

        let reader = new FileReader();

        reader.onloadend = async function() {
            let base64 = reader.result; // Encoded image data

            // Check if template is selected
            let $template = $('.template_selected');
            if ($template.length == 0) {
                console.log('Template not selected');
                return;
            }

            $('.messages').append(`
                <div class="message">
                    <div class="message_image">
                        <img src="${base64}" class="image12" style="width:210px;" style="margin-top:4px;">
                    </div>
                    <div class="message_action">
                        <i class="fa fa-remove delete_message"></i>
                    </div>
                </div>
            `);

            let template = $template.find('.template_value').text().trim();
            let key = generateKey(template);

            if (messages[key] == null) messages[key] = [];
            let extension = mt.substring(mt.indexOf('/') + 1);
            if (extension == 'jpeg') extension = 'jpg';
            let mes = '--template--' + template + '--' + generateId(10) + '-' 
                + (new Date().getTime()) + '.' + extension;
            messages[key].push(mes);

            // Add image file name to messages
            let storage = {};
            storage[key] = messages[key];
            chrome.storage.local.set(storage);

            // Send message to content.js to disable the extension
            chrome.tabs.getAllInWindow(null, function(tabs) {
                for (let i = 0; i < tabs.length; i++) {
                    if (tabs[i].title == 'Messenger') { // Find messenger tab
                        chrome.tabs.sendMessage(tabs[i].id, { action: 'newImage', template, filename: mes });
                        break;
                    }
                }
            });

            $.ajax({
                type: 'POST',
                url: backendUrl + '/api/user/addImageToTemplate',
                data: {
                    imageBase64: base64,
                    template: template,
                    imageName: mes,
                    imageType: mt,
                },
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
        }

        reader.readAsDataURL(input.files[0]);
    }
}

function generateId(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (let i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

$('th').on('click', function(e) {
    // Emoji clicked
    e.stopPropagation();
    e.stopImmediatePropagation();

    let emoji = $(this).text().trim();
    let messageTextarea = $('.message_textarea');
    messageTextarea.val(messageTextarea.val() + emoji);

    messageTextarea.css('height', '29px');
});

$('.nav_item_template').on('click', function(e) {
    $('#tag').css('display', 'none');
    $('#template').css('display', 'block');
});


$('.nav_item_tag').on('click', function(e) {
    $('#template').css('display', 'none');
    $('$tag').css('display', 'block');
});

window.addEventListener('click', function(e) {
    if (!document.getElementById('emoji_box').contains(e.target)){
        // Clicked outside emoji box
        let emojiContainer = $('.emoji_box_container');
        emojiContainer.css('display', 'none');
    }
}); 




const JpgToPngConvertor = (() => {
    function convertor(imageFileBlob, options) {
        options = options || {};

        const defaults = {};
        const settings = extend(defaults, options);
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext("2d");
        const imageEl = createImage();
        const downloadLink = settings.downloadEl || createDownloadLink();

        function createImage(options) {
            options = options || {};
            const img = (Image) ? new Image() : document.createElement('img');

            img.style.width = (options.width) ? options.width + 'px' : 'auto';
            img.style.height = (options.height) ? options.height + 'px' : 'auto';

            return img;
        }

        function extend(target, source) {
            for (let propName in source) {
            if (source.hasOwnProperty(propName)) {
                target[propName] = source[propName];
            }
            }

            return target;
        }

        function createDownloadLink() {
            return document.createElement('a');
        }

        function download() {
            if ('click' in downloadLink) {
                downloadLink.click();
            } else {
                downloadLink.dispatchEvent(createClickEvent());
            }
        }

        function updateDownloadLink(jpgFileName, pngBlob) {
            const linkEl = downloadLink;
            const pngFileName = jpgFileName.replace(/jpe?g/i, 'png');

            linkEl.setAttribute('download', pngFileName);
            linkEl.href = window.URL.createObjectURL(pngBlob);

            // If there is custom download link we don't download automatically
            if (settings.downloadEl) {
                settings.downloadEl.style.display = 'block';
            } else {
                download();
            }
        }

        function createClickEvent() {
            if ('MouseEvent' in window) {
                return new MouseEvent('click');
            } else {
                const evt = document.createEvent("MouseEvents");
                evt.initMouseEvent("click", true, true, window);
                return evt;
            }
        }

        function process() {
            const imageUrl = window.URL.createObjectURL(imageFileBlob);

            imageEl.onload = (e) => {
                canvas.width = e.target.width;
                canvas.height = e.target.height;
                ctx.drawImage(e.target, 0, 0, e.target.width, e.target.height);
                canvas.toBlob(updateDownloadLink.bind(window, imageFileBlob.name), 'image/png', 1);
            };

            imageEl.src = imageUrl;
            if (settings.downloadEl) {
                settings.downloadEl.style.display = 'none';
            }
        }

        return {
            process: process
        };
    }

    return convertor;
})();
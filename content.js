console.log('Hello from messenger extension!');

$chatBox = null;
$chatList = null;

$(document).ready(() => {
    start();
});

function start() {
    $chatBox = $('[aria-label="Conversation List"]');
    $chatList = $chatBox.find('li._5l-3 ._1qt5:not("._6zkd")');
    console.log($chatList);

    $chatList.each(function() {
        let item = $(this);
        item.html(item.html() + `<select class="tag_select" style="width:100px;margin-right:4px;margin-left:4px;">
                                    <option hidden>...</option>
                                </select>`);
    });

    // $('.tag_select').click(function(e) {
    //     console.log('select clicked!');
    //     //e.stopPropagation();
    //     //e.preventDefault();
    // }); 


    chrome.runtime.onMessage.addListener(
        function(message, sender, sendResponse) {
            switch(message.from) {
                case "popup":
                    addTag(message.tag);
                break;
            }
        }
    );
}

function addTag(tag) {
    console.log(tag);
    $chatList.each(function() {
        let select = $(this).find('select');
        select.append(`<option>${tag}</option>`)
    });
}
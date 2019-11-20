$form = $('#add_tag_form');
$tagList = $('.tag_box .tag_list');
console.log($form);

$form.submit(function(e) {
    e.preventDefault();
    $inputTag = $('#tag_input');
    tag = $inputTag.val();

    $tagList.append(`<li>${tag}</li>`);
    $inputTag.val('');

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { from: 'popup', tag: tag });
    });
});
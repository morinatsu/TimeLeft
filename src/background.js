chrome.action.onClicked.addListener(() => {
    chrome.windows.create({
        url: 'popup/popup.html',
        type: 'popup',
        width: 666,
        height: 110, 
        focused: true
    });
});

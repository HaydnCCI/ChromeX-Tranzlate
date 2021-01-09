// chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
//     const re = new RegExp('bear', 'gi')
//     const matches = document.documentElement.innerHTML.match(re)
//     sendResponse({count: matches.length})
// }) 

// Testing with a simple common word
const re = new RegExp('you', 'gi') 
const matches = document.documentElement.innerHTML.match(re)
chrome.runtime.sendMessage({
    url: window.location.href,
    count: matches.length
})
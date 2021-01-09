document.addEventListener('DOMContentLoaded', function () {
    
    const bg = chrome.extension.getBackgroundPage()
    Object.keys(bg.words).forEach(function (url) {
       const div = document.createElement('div')
       div.textContent = `${url}: ${bg.words[url]}`
       document.body.appendChild(div)
    })


    // document.querySelector('button').addEventListener('click', 
    // onclick, false)
    
    // function onclick () {
    //     chrome.tabs.query({currentWindow: true, active: true}, 
    //     function (tabs) {
    //         chrome.tabs.sendMessage(tabs[0].id, 'hi', setCount) 
    //     })
    // }

    // function setCount (res) {
    //     // alert(res)
    //     const div = document.createElement('div')
    //     div.textContent = `${res.count} bears`
    //     document.body.appendChild(div)
    // }



}, false)
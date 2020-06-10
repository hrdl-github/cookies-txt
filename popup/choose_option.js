document.addEventListener("click", (e) => {
  browser.tabs.query({active: true, currentWindow: true})
    .then(tabs => {
      console.log(JSON.stringify(tabs));
      if (tabs.length > 0) {
        const tab = tabs[0];
        if      (e.target.classList.contains("all")) {
          browser.runtime.sendMessage({})
        }
        else if (e.target.classList.contains("current")) {
          browser.runtime.sendMessage({url: tab.url})
        }
      }  
    });
});

for (const elem of document.querySelectorAll("[data-i18n]")) {
  elem.textContent = browser.i18n.getMessage(elem.attributes['data-i18n'].value);
}

document.querySelector(".all").addEventListener("click", () => browser.runtime.sendMessage({}));
document.querySelector(".current").addEventListener("click", () => {
  browser.tabs.query({active: true, currentWindow: true})
    .then(tabs => {
      console.log(JSON.stringify(tabs));
      if (tabs.length > 0) {
        browser.runtime.sendMessage({url: tabs[0].url});
      }  
    });
});

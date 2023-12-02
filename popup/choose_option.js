if (typeof browser === "undefined") var browser = chrome;

for (const elem of document.querySelectorAll("[data-i18n]")) {
  elem.textContent = browser.i18n.getMessage(elem.attributes['data-i18n'].value);
}

document.querySelector(".all").addEventListener("click", () => {
  browser.runtime.sendMessage({});
  window.close();
});
document.querySelector(".current").addEventListener("click", () => {
  var query = (typeof browser === "undefined") ? {active: true, windowId : browser.windows.WINDOW_ID_CURRENT}
    :  {active: true, currentWindow: true};
  browser.tabs.query(query, tabs => {
        if (tabs.length > 0) {
          browser.runtime.sendMessage({url: tabs[0].url});
        }
      });
  window.close();
});

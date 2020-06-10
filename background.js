function formatCookie(co) {
  return [
    [
      co.httpOnly ? '#HttpOnly_' : '',
      !co.hostOnly && co.domain && !co.domain.startsWith('.') ? '.' : '',
      co.domain
    ].join(''),
    co.hostOnly ? 'FALSE' : 'TRUE',
    co.path,
    co.secure ? 'TRUE' : 'FALSE',
    co.session || !co.expirationDate ? 0 : co.expirationDate,
    co.name,
    co.value + '\n'
  ].join('\t');
}

async function getCookiesFilename(storeId) {
  if (storeId == 'firefox-default') {
    return 'cookies.txt'
  } else {
    let container;
    try {
      container = await browser.contextualIdentities.get(storeId);
    } catch (e) {
      /* In case we can't get the name of the container, fallback on the storeId */
      container = storeId
    }
    return 'cookies.' + container.name + '.txt'
  }
}

async function saveCookies(cookies) {
  var header = [
    '# Netscape HTTP Cookie File\n',
    '# https://curl.haxx.se/rfc/cookie_spec.html\n',
    '# This is a generated file! Do not edit.\n\n'
  ];
  var body = cookies.map(formatCookie)
  let storeId = cookies[0].storeId
  var blob = new Blob(header.concat(body), {type: 'text/plain'});
  var objectURL = URL.createObjectURL(blob);
  let cookiesFilename = await getCookiesFilename(storeId)
  browser.downloads.download(
    {
      url: objectURL,
      filename: cookiesFilename,
      saveAs: true,
      conflictAction: 'overwrite'
    }
  );
}

function getCookies(stores) {
  for (var store of stores) {
    console.log("Store: " + store.id)
    var gettingAll = browser.cookies.getAll({
        storeId: store.id
    });
    gettingAll.then(saveCookies);
  }
}

function handleClick() {
  var gettingAllStores = browser.cookies.getAllCookieStores()
  gettingAllStores.then(getCookies)
}

browser.browserAction.onClicked.addListener(handleClick);


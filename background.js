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

/**
 * Get the cookies.txt file's name.
 * @param {string} storeId ID of the cookie store to get cookies for.
 */
async function getCookiesFilename(storeId) {
  if (storeId == 'firefox-default') {
    return 'cookies.txt'
  } else {
    let containerName;
    try {
      containerName = (await browser.contextualIdentities.get(storeId)).name;
    } catch (e) {
      /* In case we can't get the name of the container, fallback on the storeId */
      containerName = storeId;
    }
    return 'cookies.' + containerName + '.txt';
  }
}

/**
 * Save all cookies from a given store.
 * @param {browser.cookies.Cookie[]} cookies Cookies from the store
 * @param {string} storeId ID of the store
 */
async function saveCookies(cookies, storeId) {
  var header = [
    '# Netscape HTTP Cookie File\n',
    '# https://curl.haxx.se/rfc/cookie_spec.html\n',
    '# This is a generated file! Do not edit.\n\n'
  ];
  var body = cookies.map(formatCookie)
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

async function getCookies(stores_filter) {
  for (var store of stores_filter.stores) {
    console.log("Store: " + store.id)
    var cookies = await browser.cookies.getAll({
        ...stores_filter.filter,
        ...{ storeId: store.id, firstPartyDomain: null }});
    saveCookies(cookies, store.id);
  }
}

function handleClick(filter = {}) {
  var gettingAllStores = browser.cookies.getAllCookieStores()
  gettingAllStores
    .then(stores => ({stores: stores, filter: filter}))
    .then(getCookies);
}

browser.runtime.onMessage.addListener(handleClick)

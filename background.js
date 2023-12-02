var browser = browser || chrome;

function formatCookie(co) {
  return [
    [
      // co.httpOnly ? '#HttpOnly_' : '',
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
    let containerNameSafe = containerName.replaceAll(/[\/\\]/g, "_")
    return 'cookies.' + containerNameSafe + '.txt';
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
  let cookiesFilename = await getCookiesFilename(storeId);
  // browser.downloads is not supported yet and fails silently
  if ((await browser.runtime.getPlatformInfo()).os == "android") {
    const tabId = (await browser.tabs.query({active: true, currentWindow: true}))[0].id;
    await browser.tabs.sendMessage(tabId, {
      message: "Download",
      blob: blob,
      filename: cookiesFilename
    });
  } else {
    const objectURL = URL.createObjectURL(blob);
    browser.downloads.download(
      {
        url: objectURL,
        filename: cookiesFilename,
        saveAs: true,
        conflictAction: 'overwrite'
      }
    );
  }
}

async function getCookies(stores_filter) {
  for (var store of stores_filter.stores) {
    try {
      query = (browser.runtime.getBrowserInfo().version >= "59.0")?
        { ...stores_filter.filter,
          ...{ storeId: store.id, firstPartyDomain: null }
        }
      : { ...stores_filter.filter,
          ...{ storeId: store.id }
        };

      cookies = await browser.cookies.getAll(query);
      await saveCookies(cookies, store.id);
    } catch(e) {
      /* Returning a promise when no function is specified has not been implemented:
       * https://developer.chrome.com/docs/extensions/reference/cookies/#method-getAll */
      cookies = await browser.cookies.getAll(
        { ...stores_filter.filter,
          ...{ storeId: store.id }
        },
        cookies => saveCookies(cookies, store.id)
      );
    }
  }
}

function handleClick(filter = {}) {
  browser.cookies.getAllCookieStores(stores =>
      getCookies({stores: stores, filter: filter})
    );
}

browser.runtime.onMessage.addListener(handleClick)

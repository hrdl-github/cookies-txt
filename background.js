var browser = browser || chrome;

function formatCookie(co) {
  let lines = [];

  // Add partition key as a comment if present
  if (co.partitionKey && co.partitionKey.topLevelSite) {
    let partInfo = co.partitionKey.topLevelSite;
    if (co.partitionKey.hasCrossSiteAncestor) {
      partInfo += ' (cross-site)';
    }
    lines.push('# Partition: ' + partInfo + '\n');
  }

  lines.push([
    [
      // co.httpOnly ? '#HttpOnly_' : '',
      !co.hostOnly && co.domain && !co.domain.startsWith('.') ? '.' : '',
      co.domain
    ].join(''),
    co.hostOnly ? 'FALSE' : 'TRUE',
    co.path,
    co.secure ? 'TRUE' : 'FALSE',
    co.session || !co.expirationDate ? 0 : Math.floor(co.expirationDate),
    co.name,
    co.value + '\n'
  ].join('\t'));

  return lines.join('');
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
 * @param {boolean} clipboard whether to copy to clipboard instead of download
 */
async function saveCookies(cookies, storeId, clipboard = false) {
  var header = [
    '# Netscape HTTP Cookie File\n',
    '# https://curl.haxx.se/rfc/cookie_spec.html\n',
    '# This is a generated file! Do not edit.\n\n'
  ];
  var body = cookies.map(formatCookie)

  if (clipboard) {
    const text = header.concat(body).join('');
    const tabId = (await browser.tabs.query({ active: true, currentWindow: true }))[0].id;
    await browser.tabs.sendMessage(tabId, {
      message: "Clipboard",
      text: text
    });
  } else {
    var blob = new Blob(header.concat(body), { type: 'text/plain' });
    let cookiesFilename = await getCookiesFilename(storeId);
    // browser.downloads is not supported yet and fails silently
    if ((await browser.runtime.getPlatformInfo()).os == "android") {
      const tabId = (await browser.tabs.query({ active: true, currentWindow: true }))[0].id;
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
}

async function getCookies(stores_filter, clipboard = false) {
  for (var store of stores_filter.stores) {
    try {
      query = {
        ...stores_filter.filter, ...{
          storeId: store.id,
          firstPartyDomain: null,
          partitionKey: {},
        }
      };
      cookies = await browser.cookies.getAll(query);
      await saveCookies(cookies, store.id, clipboard);
    } catch (e) {
      /* Returning a promise when no function is specified has not been implemented:
       * https://developer.chrome.com/docs/extensions/reference/cookies/#method-getAll */
      cookies = await browser.cookies.getAll(
        {
          ...stores_filter.filter,
          ...{ storeId: store.id, partitionKey: {} }
        },
        cookies => saveCookies(cookies, store.id, clipboard)
      );
    }
  }
}

function handleClick(filter = {}) {
  const clipboard = filter.clipboard || false;
  browser.cookies.getAllCookieStores(stores =>
    getCookies({
      stores: stores.filter(store =>
        // if cookieStoreId is not provided, do not filter
        (filter.cookieStoreId == undefined) ||
        // if cookieStoreId is provided, only provide that store
        (store.id == filter.cookieStoreId)),
      filter: { url: filter.url }
    }, clipboard)
  );
}

browser.runtime.onMessage.addListener(handleClick)

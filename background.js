
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

function saveCookies(cookies) {
  var header = [
    '# Netscape HTTP Cookie File\n',
    '# https://curl.haxx.se/rfc/cookie_spec.html\n',
    '# This is a generated file! Do not edit.\n\n'
  ];
  var body = cookies.map(formatCookie)
  var blob = new Blob(header.concat(body), {type: 'text/plain'});
  var objectURL = URL.createObjectURL(blob);
  browser.downloads.download({url: objectURL, filename: 'cookies.txt',
    saveAs: true, conflictAction: 'overwrite'});
}

function handleClick() {
  var gettingAll = browser.cookies.getAll({firstPartyDomain: null});
  gettingAll.then(saveCookies);
}

browser.browserAction.onClicked.addListener(handleClick);


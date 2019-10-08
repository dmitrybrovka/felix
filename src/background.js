chrome.browserAction.onClicked.addListener(() => {
	if (chrome.runtime.openOptionsPage) {
		chrome.runtime.openOptionsPage();
	} else {
		window.open(chrome.runtime.getURL('options.html'));
	}
});

chrome.runtime.onMessage.addListener((data, sender, callback) => {
	if (data.query === 'request') {
		if (!data.url) {
			callback({err: 'URL do not specified'});
			return false;
		}

		fetch(data.url)
			.then((res) => res.json())
			.then((response) => callback({response}))
			.catch((err) => callback({err}));

		return true;
	}

	callback({
		err: `I don't know this command: ${data.query} at the background runtime message listener`
	});
});

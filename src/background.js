const
	port = chrome.runtime.connect({name: 'felixMainThread'});

chrome.runtime.onConnect.addListener((port) => {
	port.onMessage.addListener((data) => {
		const
			callback = (data) => port.postMessage({type: 'taskDataResponse', ...data})

		if (data.type === 'taskDataRequest') {
			if (!data.url) {
				callback({err: 'URL is not specified'});
				return false;
			}

			fetch(data.url)
				.then((res) => res.json())
				.then((response) => callback({response}))
				.catch((err) => callback({err}));

			return true;
		}

		callback({
			err: `I don't know commands with type: "${data.type}" at the background runtime message listener`
		});
	});
});

(() => {
	/*eslint-disable */
	const
		configFields = {
			api_url: 'api',
			tracker_url: 'url',
			queue: 'expression',
			token: 'token'
		};
	/*eslint-enable */

	let
		notificationTimeout;

	document.addEventListener('DOMContentLoaded', () => {
		chrome.storage.sync.get([
			'api',
			'token',
			'expression',
			'url'
		], ({token = '', api = '', expression = '', url = ''}) => {
			tokenField.value = token;
			urlField.value = url;
			apiField.value = api;
			expressionField.value = expression;
		});
	});

	fileUploader.addEventListener('change', () => {
		const
			reader = new FileReader(),
			obj = {};

		let
			config = {};

		reader.readAsText(fileUploader.files[0]);
		reader.addEventListener('load', () => {

			try {
				config = JSON.parse(reader.result);

				for (const k in config) {
					if (config.hasOwnProperty(k) && configFields[k]) {
						obj[configFields[k]] = config[k];
					}
				}

				chrome.storage.sync.set(obj, location.reload);

			} catch {
				throw new Error('Error while parsing a json file');
			}
		});

	});

	optionsForm.addEventListener('submit', (e) => {
		clearTimeout(notificationTimeout);

		if (apiField && tokenField) {
			saveBtn.disabled = true;

			chrome.storage.sync.set({
				api: apiField.value,
				url: urlField.value,
				token: tokenField.value,
				expression: expressionField.value
			}, () => {
				setTimeout(() => {
					notification.classList.add('options__notification_show_true');
					saveBtn.disabled = false;

					notificationTimeout = setTimeout(() => {
						notification.classList.remove('options__notification_show_true');
					}, 800);
				}, 1000);
			});
		}

		e.preventDefault();
	});
})();

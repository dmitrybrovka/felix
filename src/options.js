(() => {
	const
		configFields = new Set(['api', 'url', 'expression', 'token']);

	let
		notificationTimeout;

	pasteButton.addEventListener('click', (e) => {
		systemData.focus();
		document.execCommand('paste');

		const
			content = systemData.value;

		let config;

		try {
			config = JSON.parse(content);

		} catch {
			config = content.split('\n');
		}

		systemData.value = '';
		pasteConfig(config);
		e.preventDefault();
	});

	document.addEventListener('DOMContentLoaded', () => {
		chrome.storage.sync.get(Array.from(configFields), (config) => {
			Object.keys(config).forEach((key) => {
				window[`${key}Field`].value = config[key];
			});
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

	function pasteConfig(config) {
		if (Object.prototype.toString.call(config) === '[object Object]') {
			for (const k in config) {
				if (config.hasOwnProperty(k)) {
					const
						field = document.querySelector(`#${k}Field`);

					field.value = config[k];
				}
			}

		} else if (Array.isArray(config)) {
			const
				els = optionsForm.querySelectorAll('[id$="Field"]');

			let j = 0;

			for (let i = 0; i < config.length; i++) {
				if (!els[j]) {
					break;
				}

				const
					val = config[i].trim();

				if (!val) {
					continue;
				}

				els[j++].value = config[i].trim();
			}
		}
	}
})();

'use strict';

chrome.storage.sync.get(['api', 'token', 'expression', 'url'], (params) => {
	new Felix(params);
});

class Felix {
	constructor(params) {
		this.api = params.api;
		this.token = params.token;
		this.trackerUrl = params.url;
		this.taskIcon = chrome.runtime.getURL('assets/images/st.svg');
		this.expression = this.createExpression(params.expression);

		this.observerConfig = {
			childList: true,
			subtree: true
		};

		this.startDaemon();
	}

	createExpression(str, params = 'ig') {
		return new RegExp(`(${str})[-| ]?([0-9]+)`, params);
	}

	cookTaskName(str) {
		return str.replace(this.expression, '$1-$2');
	}

	update(links) {
		links.forEach((el) => {
			const
				prev = el.previousElementSibling;

			if (!prev || prev.className !== 'stLink') {
				const
					match = el.textContent.match(this.expression);

				if (match && !el.href.includes(this.trackerUrl)) {
					match.forEach((m) => {
						const
							l = document.createElement('a');

						l.href = `${this.trackerUrl}/${this.cookTaskName(m)}`;
						l.target = '_blank';
						l.className = 'stLink';

						l.style.backgroundImage = `url("${this.taskIcon}")`;
						l.title = m;

						el.insertAdjacentElement('beforebegin', l);
					});
				}
			}
		});
	}

	debounce(fn, ms) {
		let t;

		return (...args) => {
			clearTimeout(t);
			t = setTimeout(() => fn(...args), ms);
		};
	}

	startDaemon() {
		const
			observer = new MutationObserver(this.debounce(() => this.update(Array.from(document.links)), 500));

		observer.observe(document.body, this.observerConfig);
	}
}

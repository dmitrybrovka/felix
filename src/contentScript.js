document.addEventListener('DOMContentLoaded', () => {
	chrome.storage.sync.get(['api', 'token', 'expression'], (params) => {
		new Felix(params);
	});
});

class Felix {
	token;
	api;
	expression;
	trackerUrl;
	taskIcon;

	observerConfig = {
		childList: true,
		subtree: true
	};

	constructor(params) {
		this.api = params.api;
		this.token = params.token;
		this.trackerUrl = params.url;
		this.taskIcon = chrome.runtime.getURL('assets/images/st.svg');
		this.expression = this.createExpression(params.expression);

		this.startDaemon();
	}

	createExpression(str, params = 'ig') {
		return new RegExp(str, params);
	}

	update(links) {
		links.forEach((el) => {
			const
				prev = el.previousElementSibling;

			if (!prev || prev.className !== 'stLink') {
				const
					match = el.textContent.match(this.expression);

				if (match && !el.href.match(this.trackerUrl)) {
					match.forEach((m) => {
						const
							l = document.createElement('a');

						l.href = `${this.trackerUrl}/${m}`;
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

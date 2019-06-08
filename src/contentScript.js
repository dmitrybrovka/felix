const
	r = /EDADEAL\w+-\d+/g,
	icon = chrome.runtime.getURL('assets/images/st.svg');

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

	observerConfig = {
		childList: true,
		subtree: true
	};

	constructor(params) {
		this.api = params.api;
		this.token = params.token;
		this.trackerUrl = params.url;
		this.expression = this.createExpression(params.expression);
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
					match = el.textContent.match(r),
					apiRegexp = new RegExp(api);

				if (match && !el.href.match(apiRegexp)) {
					match.forEach((m) => {
						const
							l = document.createElement('a');

						l.href = `${api}/${m}`;
						l.target = '_blank';
						l.className = 'stLink';

						l.style.backgroundImage = `url("${icon}")`;
						l.title = m;

						el.insertAdjacentElement('beforebegin', l);
					});
				}
			}
		});
	}

	init() {

	}

	debounce(fn, ms) {
		let t;

		return (...args) => {
			clearTimeout(t);
			t = setTimeout(() => fn(...args), ms);
		};
	}

	daemon() {
		const
			observer = new MutationObserver(this.debounce(() => this.update(Array.from(document.links)), 500));

		observer.observe(document.body, this.observerConfig);
	}
}

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
		this.id = chrome.runtime.id;

		this.observerConfig = {
			childList: true,
			subtree: true
		};

		this.createPopOver();
		this.startDaemon();
	}

	/**
	 * Creates expression with necessary groups
	 *
	 * @param str
	 * @param params
	 * @returns {RegExp}
	 */
	createExpression(str, params = 'ig') {
		return new RegExp(`(${str})[-| ]?([0-9]+)`, params);
	}

	/**
	 * Cooks valid api task name
	 *
	 * @param str
	 * @returns {void | string | never}
	 */
	cookTaskName(str) {
		return str.replace(this.expression, '$1-$2');
	}

	/**
	 * Creates popover with additional
	 * information about marked task
	 */
	createPopOver() {
		const
			wrapper = document.createElement('div'),
			title = document.createElement('div'),
			content = document.createElement('p');

		content.className = 'st-popover-content';
		title.className = 'st-popover-title';
		wrapper.className = 'st-popover';
		wrapper.id = `uid-${this.id}-pop-over`;

		wrapper.insertAdjacentElement('beforeend', title);
		wrapper.insertAdjacentElement('beforeend', content);

		this.popOver = {
			title,
			content,
			wrapper,
			classes: {
				show: 'st-popover_show_true'
			}
		};

		document.body.insertAdjacentElement('beforeend', wrapper);
	}

	/**
	 * Find links for marking
	 * @param links
	 */
	update(links) {
		links.forEach((el) => {
			const
				prev = el.previousElementSibling;

			if (!prev || prev.className !== 'st-link') {
				const
					match = el.textContent.match(this.expression);

				if (match && !el.href.includes(this.trackerUrl)) {
					match.forEach((m) => {
						const
							l = document.createElement('a');

						l.href = `${this.trackerUrl}/${this.cookTaskName(m)}`;
						l.target = '_blank';
						l.className = 'st-link';

						l.style.backgroundImage = `url("${this.taskIcon}")`;
						l.title = m;

						el.insertAdjacentElement('beforebegin', l);

						l.addEventListener('mouseover', this.catchMouse.bind(this));
						l.addEventListener('mouseleave', this.releaseMouse.bind(this));
					});
				}
			}
		});
	}

	/**
	 * Handler: hides popover
	 */
	releaseMouse() {
		const {wrapper, classes: {show}} = this.popOver;
		wrapper.classList.remove(show);
	}

	/**
	 * Handler: shows popover
	 * @param e
	 */
	catchMouse(e) {
		const
			{wrapper, classes: {show}} = this.popOver;

		wrapper.style.left = `${e.clientX}px`;
		wrapper.style.top = `${e.clientY}px`;

		if (!wrapper.classList.contains(show)) {
			wrapper.classList.add(show);
		}
	}

	/**
	 * Debounce input function
	 *
	 * @param fn
	 * @param ms
	 * @returns {Function}
	 */
	debounce(fn, ms) {
		let t;

		return (...args) => {
			clearTimeout(t);
			t = setTimeout(() => fn(...args), ms);
		};
	}

	/**
	 * Runs observer for all page links
	 */
	startDaemon() {
		const observer = new MutationObserver(this.debounce(() => this.update(Array.from(document.links)), 500));
		observer.observe(document.body, this.observerConfig);
	}
}

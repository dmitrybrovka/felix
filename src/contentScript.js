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

		this.additionalInfoConfig = {
			key: true,
			summary: true,
			assignee: 'assignee.display',
			priority: 'priority.display',
			status: 'status.display'
		};

		this.popOver = this.createPopOver(this.additionalInfoConfig);
		this.startDaemon();

		if (!this.trackerUrl) {
			this.catchError('You didn\'t show me where to go to tasks.\nClick on me on the top bar and fill required fields');
		}
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
		return str.toUpperCase().replace(this.expression, '$1-$2');
	}

	/**
	 * Creates popover with additional
	 * information about marked task
	 *
	 * @param config
	 */
	createPopOver(config) {
		const
			popOver = {},
			wrapper = document.createElement('div');

		for (const key in config) {
			if (config.hasOwnProperty(key)) {
				const element = document.createElement('div');
				element.className = `st-popover-${key}`;

				wrapper.insertAdjacentElement('beforeend', element);
				popOver[key] = element;
			}
		}

		wrapper.id = `uid-${this.id}-pop-over`;
		wrapper.className = 'st-popover';

		popOver.wrapper = wrapper;
		popOver.classes = {show: 'st-popover_show_true'};

		document.body.insertAdjacentElement('beforeend', wrapper);

		return popOver;
	}

	/**
	 * Find links for marking
	 * @param links
	 */
	update(links) {
		links.forEach((link) => {
			if (link.classList.contains('st-link-here')) {
				return;
			}

			const
				prev = link.previousElementSibling;

			if (!prev || prev.className !== 'st-link') {
				const
					match = link.textContent.match(this.expression);

				if (match && !link.href.includes(this.trackerUrl)) {
					const
						mSet = new Set(match);

					mSet.forEach((m) => {
						const
							l = document.createElement('a'),
							task = this.cookTaskName(m);

						l.href = `${this.trackerUrl}/${task}`;
						l.target = '_blank';
						l.className = 'st-link';
						l.style.backgroundImage = `url("${this.taskIcon}")`;
						l.dataset.title = task;

						if (link.children) {
							const
								walk = document.createTreeWalker(link, NodeFilter.SHOW_TEXT, null, false);

							let
								n = walk.nextNode();

							while (n) {
								if (n.className === 'st-link') {
									break;
								}

								if (n.textContent && this.expression.test(n.textContent)) {
									n.parentElement.insertAdjacentElement('beforebegin', l);
									link.classList.add('st-link-here');
									break;

								} else {
									n = walk.nextNode();
								}
							}

						} else {
							el.insertAdjacentElement('beforebegin', l);
						}


						l.addEventListener('mouseenter', this.catchMouse.bind(this));
						l.addEventListener('mouseout', this.releaseMouse.bind(this));
					});
				}
			}
		});
	}

	/**
	 * Gets task data
	 *
	 * @param p
	 * @returns {Promise<Response> | void}
	 */
	fetchData(p) {
		if (!p.url) {
			return;
		}

		return fetch(p.url, {
			headers: new Headers({
				Accept: 'application/json',
				Authorization: `OAuth ${this.token}`
			}),

			credentials: 'include',
			method: 'GET'
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

		if (this.api && this.token) {
			wrapper.classList.remove(show);

			this.getInfo(e.target.dataset.title).then((data) => {
				if (!data) {
					return;
				}

				wrapper.style.left = `${e.pageX + 20}px`;
				wrapper.style.top = `${e.pageY}px`;

				for (const key in data) {
					if (data.hasOwnProperty(key)) {
						if (this.popOver[key]) {
							this.popOver[key].textContent = data[key];
						}
					}
				}

				if (!wrapper.classList.contains(show)) {
					wrapper.classList.add(show);
				}
			});
		}
	}

	/**
	 * Returns data by task key
	 *
	 * @param task
	 * @returns {Promise<any | never>}
	 */
	getInfo(task) {
		return this.fetchData({url: `${this.api}/v2/issues/${task}`})
			.then((res) => res.json())
			.then((res) => {
				if (res.errorMessages) {
					throw new Error(res.errorMessages);
				}

				const
					config = this.additionalInfoConfig,
					data = {};

				for (const key in config) {
					if (config.hasOwnProperty(key)) {
						if (typeof config[key] === 'string') {
							const
								arr = config[key].split('.');

							let
								value = res;

							for (let i = 0; i < arr.length; i++) {
								value = value[arr[i]];
							}

							data[key] = value;

						} else if (config[key] && res[key]) {
							data[key] = res[key];
						}
					}
				}

				return data;
			})
			.catch(this.catchError);
	}

	/**
	 * Debounce input function
	 *
	 * @param fn
	 * @param ms
	 * @returns {Function}
	 */
	debounce(fn, ms = 500) {
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
		const observer = new MutationObserver(this.debounce(() => this.update(Array.from(document.links))));
		observer.observe(document.body, this.observerConfig);
	}

	/**
	 * Handles errors
	 * @param err
	 */
	catchError(err) {
		const
			disclaimer = 'FELIX THE MARKER';

		let str;

		if (typeof err === 'object' && !(err instanceof Error)) {
			try {
				str = JSON.stringify(err);

			} catch (e) {
				console.warn(`${disclaimer}:\n🙀 ${e}`);
			}

		} else {
			str = err;
		}

		console.warn(`${disclaimer}\n😿 ${str}`);
	}
}

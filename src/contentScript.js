const
	r = /EDADEAL\w+-\d+/,
	icon = chrome.runtime.getURL('assets/images/st.svg');

function update(links) {
	links.forEach((el) => {
		const
			prev = el.previousElementSibling;

		if (!prev || prev.className !== 'stLink') {
			const
				match = el.textContent.match(r);

			if (match && !el.href.match(/st\.yandex-team\.ru/)) {
				const
					l = document.createElement('a');

				l.href = `https://st.yandex-team.ru/${match[0]}`;
				l.target = '_blank';
				l.className = 'stLink';

				l.style.backgroundImage = `url("${icon}")`;

				el.insertAdjacentElement('beforebegin', l);
			}
		}
	});
}

function debounce(fn, ms) {
	let t;

	return (...args) => {
		clearTimeout(t);
		t = setTimeout(() => fn(...args), ms);
	}
}

const
	observer = new MutationObserver(debounce(() => update(Array.from(document.links)), 500)),
	config = {childList: true, subtree: true};

update(Array.from(document.links));
observer.observe(document.body, config);

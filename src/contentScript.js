const
	r = /EDADEAL\w+-\d+/,
	icon = chrome.runtime.getURL('images/st.svg');

function updateLinks(links) {
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

let linksLength = document.links.length;

setInterval(() => {
	const
		links = Array.from(document.links);

	if (links.length !== linksLength) {
		updateLinks(links);
	}
}, 5000);


async function loadBodyElements() {
    let header = await fetchHeader();
    let container = document.querySelector('#header');
    container.innerHTML = header;

    //  Search box code
    const search = document.getElementById('symbolSearch');
    search.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            symbolSearch(search.value);
        }
    });
}

async function fetchHeader() {
    let url = 'header.html';

    try {
        let res = await fetch(url);
        return await res.text();
    } catch (error) {
        console.log(error);
    }
}

async function symbolSearch(symbol) {
    window.location.href = '/symbol.html?symbol='+symbol;
}

function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}

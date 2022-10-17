
async function loadBodyElements() {
    let header = await fetchHeader();
    let container = document.querySelector('#header');
    container.innerHTML = header;

    //  Search box code
    const search = document.getElementById('symbolSearch');
    search.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            symbol = search.value;
            symbolSearch(symbol.trim());
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

function unixToReadable(unix_timestamp) {
    let dt = new Date(unix_timestamp * 1000).toLocaleString()
    console.log(dt);
    return dt
}


async function fetchHistoryInfo() {
    let info_url = 'https://efd6n53bol.execute-api.us-west-1.amazonaws.com/positions/closed'
    console.log(info_url)
    try {
        let res = await fetch(info_url);
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

async function fetchPositionsInfo() {
    let info_url = 'https://efd6n53bol.execute-api.us-west-1.amazonaws.com/positions/opened'
    console.log(info_url)
    try {
        let res = await fetch(info_url);
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

async function fetchOptionTable(symbol) {
    let info_url = 'https://efd6n53bol.execute-api.us-west-1.amazonaws.com/options/' + symbol
    console.log(info_url)
    try {
        let res = await fetch(info_url);
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

function findOptionInfo(jsonOptionTable,option_symbol) {
//  Find this option in the option table
    let option_table = jsonOptionTable.Item.info.option_table_near
    for(var key in option_table) {
        if ((option_table[key]['quote_symbol'] == option_symbol))
            return option_table[key]
    }

    option_table = jsonOptionTable.Item.info.option_table_far
    for(var key in option_table) {
        if ((option_table[key]['quote_symbol'] == option_symbol))
            return option_table[key]
    }
    return null
}
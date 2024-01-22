
async function loadScannerData() {
    document.querySelector('#wait_status').innerHTML = "... Downloading Scanner Table ...";

    let jsonInfo = await fetchScannerInfo();
    if ((jsonInfo == null) || (jsonInfo.hasOwnProperty("Item") == false)) {      
        return loadError("Unable to load Scanner Table")
    }
    
    console.log(jsonInfo.Item.info)
 

    let last_update = jsonInfo.Item.info.last_update
    document.querySelector('#last_update').innerHTML = unixToReadable(last_update)

//  Build scanner tables
    let divTable = document.getElementById("scanner_table");
    table = jsonInfo.Item.info.results

    for (var key in table) {
        symbol = table[key]['symbol']
        console.log(table[key])

        line = '<div class="scanner_table_row">'

        option_symbol = table[key]['quote_symbol'];
        strike_price = table[key]['strike_price'].toFixed(2);
        expiration_date = table[key]['expiration_date']
        link = '<a href="symbol.html?symbol='+symbol+'" style="font-weight:750;">'+symbol+'</a> - ' + strike_price;
        line = line + '<span class="scanner_table_col_1">' + link + '<br/>Expires :'+expiration_date+'</span>'

// bid x ask
        ask = parseFloat(table[key]['quote']['ask'])
        bid = parseFloat(table[key]['quote']['bid'])
        line = line + '<span class="scanner_table_col_2">' + bid.toFixed(2) + ' x '+ ask.toFixed(2) +'</span>'

// Chance of Payout
        value = parseFloat(table[key]['chance_of_payout'])
        value = value * 100.0
        line = line + '<span class="scanner_table_col_4">' + value.toFixed(2) + '%</span>'

// Est ROI
        value = parseFloat(table[key]['est_roi'])
        line = line + '<span class="scanner_table_col_5">' + value.toFixed(1) + '</span>'

// Next Earnings Date
        line = line + '<span class="scanner_table_col_6">' + table[key]['next_earnings_date'] + '</span>'
        line = line + '</div>'

        ele = htmlToElement(line)
        divTable.appendChild(ele);
    }

    document.querySelector('#wait').remove();
    document.querySelector('#contents').style.visibility = "visible";
}

async function fetchScannerInfo() {
    let my_url = new URL(window.location.href);
    let info_url = 'https://efd6n53bol.execute-api.us-west-1.amazonaws.com/scanner/3'
    try {
        let res = await fetch(info_url);
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

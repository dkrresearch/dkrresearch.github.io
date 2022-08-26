
async function loadScannerData() {
    let jsonInfo = await fetchScannerInfo();
    console.log(jsonInfo.Items[0].info)
 
//  Build scanner tables
    let divTable = document.getElementById("scanner_table");
    table = jsonInfo.Items[0].info.results

    for (var key in table) {
        symbol = table[key]['symbol']



        line = '<div class="scanner_table_row">'

        option_symbol = table[key]['quote_symbol'];
        strike_price = table[key]['strike_price'].toFixed(2);
        expiration_date = table[key]['expiration_date']
        link = '<a href="/symbol.html?symbol='+symbol+'" style="font-weight:750;">'+symbol+'</a> - ' + strike_price;
        line = line + '<span class="scanner_table_col_1">' + link + '<br/>Expires :'+expiration_date+'</span>'

        line = line + '<span class="scanner_table_col_2">$' + table[key]['target_price'].toFixed(2) + '</span>'

        ask = parseFloat(table[key]['quote']['ask'])
        bid = parseFloat(table[key]['quote']['bid'])
        line = line + '<span class="scanner_table_col_3">' + bid.toFixed(2) + ' x '+ ask.toFixed(2) +'</span>'

        value = table[key]['chance_of_loss']
        line = line + '<span class="scanner_table_col_4">' + value.toFixed(2) + '%</span>'

        line = line + '<span class="scanner_table_col_5">' + table[key]['next_earnings_date'] + '</span>'
        line = line + '</div>'

        ele = htmlToElement(line)
        divTable.appendChild(ele);
    }

    document.querySelector('#wait').remove();
    document.querySelector('#contents').style.visibility = "visible";
}

async function fetchScannerInfo() {
    let my_url = new URL(window.location.href);
    let info_url = 'https://efd6n53bol.execute-api.us-west-1.amazonaws.com/scanner'
    try {
        let res = await fetch(info_url);
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

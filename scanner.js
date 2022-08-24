
async function loadScannerData() {
    let jsonInfo = await fetchScannerInfo();
    console.log(jsonInfo.Items[0].info)
 
//  Build scanner tables
    let divTable = document.getElementById("scanner_table");
    table = jsonInfo.Items[0].info.results

    for (var key in table) {
        symbol = table[key]['symbol']

        line = '<div class="scanner_table_row">'
        line = line + '<span class="scanner_table_col_1"><a href="/symbol.html?symbol='+symbol+'">'+symbol+'</a></span>'
        line = line + '<span class="scanner_table_col_2">' + table[key]['expiration_date'] + '</span>'
        line = line + '<span class="scanner_table_col_3">' + table[key]['next_earnings_date'] + '</span>'
        
        value = parseFloat(table[key]['target_price'])
        line = line + '<span class="scanner_table_col_4">' + value.toFixed(2) + '</span>'

        value = parseFloat(table[key]['quote']['bid'])
        line = line + '<span class="scanner_table_col_5">' + value.toFixed(2) + '</span>'
        value = parseFloat(table[key]['quote']['ask'])
        line = line + '<span class="scanner_table_col_6">' + value.toFixed(2) + '</span>'

        value = table[key]['chance_of_loss'] * 100.0
        line = line + '<span class="scanner_table_col_7">' + value.toFixed(2) + '</span>'

        ele = htmlToElement(line)
        divTable.appendChild(ele);
    }

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

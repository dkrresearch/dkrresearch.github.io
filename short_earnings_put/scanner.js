
async function loadScannerData() {
    document.querySelector('#wait_status').innerHTML = "... Downloading Scanner Table ...";

    let jsonInfo = await fetchScannerInfo(2);
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

        line = '<div class="scanner_table_row">'

        option_symbol = table[key]['quote_symbol'];
        strike_price = table[key]['strike_price'].toFixed(2);
        expiration_date = table[key]['expiration_date']
        link = '<a href="symbol.html?symbol='+symbol+'" style="font-weight:750;">'+symbol+'</a> - ' + strike_price;
        line = line + '<span class="scanner_table_col_1">' + link + '<br/>Expires :'+expiration_date+'</span>'

        icons = '&nbsp;'
        has_strike = parseFloat(table[key]['has_opened_strikes'])
        if (has_strike == 1)
            icons = icons + 'Op&nbsp;'

        line = line + '<span class="scanner_table_col_2">' +icons +'</span>'

// Premimum
        value = parseFloat(table[key]['total_premimums'])
//        value = globalDefaultValue * (value / 100.0)
        line = line + '<span class="scanner_table_col_3">$' + value.toFixed(0) + '</span>'

// Risk of Assignment
        value = 100.0 * parseFloat(table[key]['chance_of_loss'])
        line = line + '<span class="scanner_table_col_4">' + value.toFixed(2) + '%</span>'

// Prem over Value at Risk
        value = parseFloat(table[key]['prem_over_var']) * 1000.0
        line = line + '<span class="scanner_table_col_5">' + value.toFixed(1) + '</span>'

// Price over Risk
        value = parseFloat(table[key]['price_over_risk']) 
        line = line + '<span class="scanner_table_col_6">' + value.toFixed(1) + '</span>'

// Next Earnings Date
        line = line + '<span class="scanner_table_col_7">' + table[key]['next_earnings_date'] + '</span>'
        line = line + '</div>'

        ele = htmlToElement(line)
        divTable.appendChild(ele);
    }

    document.querySelector('#wait').remove();
    document.querySelector('#contents').style.visibility = "visible";
}


async function loadSymbolData() {
    let jsonInfo = await fetchSymbolInfo();

    document.querySelector('#symbol').innerHTML = jsonInfo.Item.symbol;
    document.querySelector('#Name').innerHTML = " : " + jsonInfo.Item.info.overview.Name;
    document.querySelector('#Industry').innerHTML = jsonInfo.Item.info.overview.Industry;
    document.querySelector('#Description').innerHTML = jsonInfo.Item.info.overview.Description;
    document.querySelector('#next_earnings_date').innerHTML = jsonInfo.Item.info.next_earnings_date;
    document.querySelector('#ExDividendDate').innerHTML = jsonInfo.Item.info.overview.ExDividendDate;
    document.querySelector('#DividendPerShare').innerHTML = jsonInfo.Item.info.overview.DividendPerShare;

    let jsonOptionTable = await fetchOptionTable();
    console.log(jsonOptionTable);
    console.log(jsonOptionTable.Item.info)

    value = (10000.0 * jsonOptionTable.Item.info.max_earnings_delta).toFixed();
    value = value / 100.0
    document.querySelector('#max_earnings_effect').innerHTML = value    
    document.querySelector('#last_price').innerHTML = jsonOptionTable.Item.info.last_price.toFixed(2)    

//  Build option tables
    let divTable = document.getElementById("far_put_table");
    table = jsonOptionTable.Item.info.option_table_far
    console.log(table[0])
    
    document.querySelector('#far_exp_date').innerHTML = table[0]['expiration_date']
    document.querySelector('#far_dte').innerHTML = table[0]['dte']
    
    if (table[0]['sub_earnings_data'] == true)
        document.querySelector('#far_sub_earnings_data').style.visibility = "visible";

    for(var key in table.reverse()) {
        console.log(key)
        console.log(table[key])

        if (table[key]['quote'] == null)
            continue
        if ((parseFloat(table[key]['quote']['bid']) <= 0.02) && 
            (parseFloat(table[key]['quote']['ask']) <= 0.02) &&
            (parseFloat(table[key]['price_of_loss']) <= 0.00))
            break
        if (parseFloat(table[key]['quote']['ask']) <= 0.02)
            continue

        line = '<div class="put_table_row">'
        line = line + '<span class="put_table_col_1">' + table[key]['strike_price'].toFixed(2) + '</span>'
        value = table[key]['discount'] * 100.0
        line = line + '<span class="put_table_col_2">' + value.toFixed(2) + '</span>'
        line = line + '<span class="put_table_col_3">' + table[key]['target_price'].toFixed(2) + '</span>'
        value = parseFloat(table[key]['quote']['bid'])
        line = line + '<span class="put_table_col_4">' + value.toFixed(2) + '</span>'
        value = parseFloat(table[key]['quote']['ask'])
        line = line + '<span class="put_table_col_5">' + value.toFixed(2) + '</span>'
        line = line + '<span class="put_table_col_6">' + table[key]['price_of_loss'].toFixed(2) + '</span>'

        value = table[key]['chance_of_loss'] * 100.0
        line = line + '<span class="put_table_col_7">' + value.toFixed(2) + '</span>'
        value = parseFloat(table[key]['quote']['imp_volatility'])
        line = line + '<span class="put_table_col_8">' + value.toFixed(4) + '</span>'
        line = line + '</div>'
        ele = htmlToElement(line)
        divTable.appendChild(ele);
    }

    document.querySelector('#contents').style.visibility = "visible";
}

async function fetchSymbolInfo() {
    let my_url = new URL(window.location.href);
    let symbol = my_url.searchParams.get("symbol").toUpperCase();
    let info_url = 'https://efd6n53bol.execute-api.us-west-1.amazonaws.com/items/' + symbol
    try {
        let res = await fetch(info_url);
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

async function fetchOptionTable() {
    let my_url = new URL(window.location.href);
    let symbol = my_url.searchParams.get("symbol").toUpperCase();
    let info_url = 'https://efd6n53bol.execute-api.us-west-1.amazonaws.com/options/' + symbol
    console.log(info_url)
    try {
        let res = await fetch(info_url);
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}
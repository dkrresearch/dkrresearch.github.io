
async function loadSymbolData() {
    let jsonInfo = await fetchSymbolInfo();

    symbol = jsonInfo.Item.symbol
    document.querySelector('#symbol').innerHTML = symbol;
 
    symbol_name = jsonInfo.Item.info.overview.Name
    link = "<a href='https://www.marketwatch.com/investing/stock/"+symbol+"' target='_blank' rel='noopener noreferrer'>"+symbol_name+"</a>"
    document.querySelector('#Name').innerHTML = " : " + link;
    document.querySelector('#Industry').innerHTML = jsonInfo.Item.info.overview.Industry;
    document.querySelector('#Description').innerHTML = jsonInfo.Item.info.overview.Description;
    document.querySelector('#next_earnings_date').innerHTML = jsonInfo.Item.info.next_earnings_date;
    document.querySelector('#ExDividendDate').innerHTML = jsonInfo.Item.info.overview.ExDividendDate;
    document.querySelector('#DividendPerShare').innerHTML = jsonInfo.Item.info.overview.DividendPerShare;

    let jsonOptionTable = await fetchOptionTable();

    value = (10000.0 * jsonOptionTable.Item.info.max_earnings_delta).toFixed();
    value = value / 100.0
    document.querySelector('#max_earnings_effect').innerHTML = value    
    document.querySelector('#last_price').innerHTML = jsonOptionTable.Item.info.last_price.toFixed(2)    

//  Build option tables
    let divTable = document.getElementById("near_put_table");
    let table = jsonOptionTable.Item.info.option_table_near
    for (var e=0; e<2; e++) {
        if (e == 1) {
            divTable = document.getElementById("far_put_table");
            table = jsonOptionTable.Item.info.option_table_far
        }

        if (table[0]['sub_earnings_data'] == true) {
            if (e == 0)
                document.querySelector('#near_sub_earnings_data').style.visibility = "visible";
            else
                document.querySelector('#far_sub_earnings_data').style.visibility = "visible";
        }
        if (e == 0) {
            document.querySelector('#near_exp_date').innerHTML = table[0]['expiration_date']
            document.querySelector('#near_dte').innerHTML = table[0]['dte']
        }else{
            document.querySelector('#far_exp_date').innerHTML = table[0]['expiration_date']
            document.querySelector('#far_dte').innerHTML = table[0]['dte']
        }   


        for(var key in table.reverse()) {
            if (table[key]['quote'] == null)
                continue
            if (parseFloat(table[key]['chance_of_loss']) > 0.021)  
                continue
            if (parseFloat(table[key]['quote']['ask']) <= 0.02)
                continue

            line = '<div class="put_table_row">'

            option_symbol = table[key]['quote_symbol'];
            strike_price = table[key]['strike_price'].toFixed(2);
            discount = table[key]['discount'] * 100.0
            link = "<a href='/option.html?symbol="+symbol+"&option_symbol="+option_symbol+"'>"+strike_price+"</a>";
            line = line + '<span class="put_table_col_1">' + link + '<br/>'+discount.toFixed(0)+'% Discount</span>'

            line = line + '<span class="put_table_col_2">$' + table[key]['target_price'].toFixed(2) + '</span>'

            ask = parseFloat(table[key]['quote']['ask'])
            bid = parseFloat(table[key]['quote']['bid'])
            line = line + '<span class="put_table_col_3">' + bid.toFixed(2) + ' x '+ ask.toFixed(2) +'</span>'

            value = table[key]['price_of_loss']
            line = line + '<span class="put_table_col_4">$' + value.toFixed(2) + '</span>'

            value = table[key]['chance_of_loss'] * 100.0
            line = line + '<span class="put_table_col_5">' + value.toFixed(2) + '%</span>'

            value = parseFloat(table[key]['quote']['imp_volatility'])
            line = line + '<span class="put_table_col_6">' + value.toFixed(4) + '</span>'
            line = line + '</div>'

            ele = htmlToElement(line)
            divTable.appendChild(ele);
        }
    }

    document.querySelector('#wait').remove();
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
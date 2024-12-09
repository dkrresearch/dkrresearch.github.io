var jsonInfo = null;

async function loadSymbolData() {
    jsonInfo = await fetchSymbolInfo();
    if ((jsonInfo == null) || (jsonInfo.hasOwnProperty("Item") == false)) {
        let my_url = new URL(window.location.href);
        let symbol = my_url.searchParams.get("symbol").toUpperCase();        
        return loadError(symbol + " - Symbol Not Found")
    }
    console.log(jsonInfo)

    symbol = jsonInfo.Item.symbol
    document.querySelector('#title').innerHTML = "DKR Research : " + symbol 
    document.querySelector('#symbol').innerHTML = symbol;

    link = "<a href='/short_earnings_call/symbol.html?symbol="+symbol+"'>Earnings Call</a>"
    document.querySelector('#link_short_call').innerHTML = link;

    symbol_name = jsonInfo.Item.info.overview.Name
    link = "<a href='https://www.marketwatch.com/investing/stock/"+symbol+"' target='_blank' rel='noopener noreferrer'>"+symbol_name+"</a>"
    document.querySelector('#Name').innerHTML = " : " + link;
    document.querySelector('#Industry').innerHTML = jsonInfo.Item.info.overview.Industry;
    document.querySelector('#Description').innerHTML = jsonInfo.Item.info.overview.Description;
    document.querySelector('#next_earnings_date').innerHTML = jsonInfo.Item.info.next_earnings_date;
    document.querySelector('#details_earnings_date').value = jsonInfo.Item.info.next_earnings_date;
    document.querySelector('#ExDividendDate').innerHTML = jsonInfo.Item.info.overview.ExDividendDate;
    document.querySelector('#DividendPerShare').innerHTML = jsonInfo.Item.info.overview.DividendPerShare;

    let jsonOptionTable = await fetchOptionTable(symbol);
    console.log(jsonOptionTable)

    value = (10000.0 * jsonOptionTable.Item.info.max_earnings_delta).toFixed();
    value = value / 100.0
    document.querySelector('#max_earnings_effect').innerHTML = value    

    last_price = jsonOptionTable.Item.info.last_price
    last_g =  jsonOptionTable.Item.info.last_g * 100.0

    document.querySelector('#last_price').innerHTML = "$" + last_price.toFixed(2) + "<span style='margin-left:15px;'>" + last_g.toFixed(2) + "%</span>"
    if (last_g < 0.0) 
        document.querySelector('#last_price').style.color = "red"
    
    last_update = jsonOptionTable.Item.info.last_update
    document.querySelector('#last_update').innerHTML = unixToReadable(last_update)

    document.querySelector('#next_earnings_date').innerHTML = jsonOptionTable.Item.info.next_earnings_date;

//  Build option tables
    let divTable = document.getElementById("near_put_table");
    let table = jsonOptionTable.Item.info.option_table_weekly
    console.log(table)
    if (table.length > 0) {
        for(var key in table.reverse()) {
            if (table[key]['quote'] == null)
                continue
            if (table[key]['type'] != 'short_earnings_put')
                continue
            
            document.querySelector('#near_sub_earnings_data').style.visibility = "visible";
            document.querySelector('#near_exp_date').innerHTML = table[key]['expiration_date']
            document.querySelector('#near_dte').innerHTML = table[key]['dte']

            if (parseFloat(table[key]['chance_of_loss']) > 0.25)  
                continue
            if (parseFloat(table[key]['quote']['ask']) <= 0.02)
                continue
            if (parseFloat(table[key]['total_premimums']) <= 0.0)
                continue
    
    
            console.log(table[key])
            if (table[key].hasOwnProperty('prem_over_var') == false)
                continue
            if (table[key].hasOwnProperty('price_over_risk') == false)
                continue
                

            line = '<div class="put_table_row">'

            option_symbol = table[key]['quote_symbol'];
            strike_price = table[key]['strike_price'].toFixed(2);
            discount = table[key]['discount'] * 100.0
            link = "<a href='option.html?symbol="+symbol+"&option_symbol="+option_symbol+"'>"+strike_price+"</a>";
            line = line + '<span class="put_table_col_1">' + link + '<br/>'+discount.toFixed(0)+'% Discount</span>'

// bid x ask
            ask = parseFloat(table[key]['quote']['ask'])
            bid = parseFloat(table[key]['quote']['bid'])
            line = line + '<span class="put_table_col_2">' + bid.toFixed(2) + ' x '+ ask.toFixed(2) +'</span>'

// Premimum
            value = parseFloat(table[key]['total_premimums'])
//            value = globalDefaultValue * (value / 100.0)
            line = line + '<span class="put_table_col_3">$' + value.toFixed(0) + '</span>'

// Risk of Assignment
            value = 100.0 * parseFloat(table[key]['chance_of_loss'])
            line = line + '<span class="put_table_col_4">' + value.toFixed(2) + '%</span>'

// Prem over Value at Risk
            value = parseFloat(table[key]['net_over_var']) * 1000.0
            line = line + '<span class="put_table_col_5">' + value.toFixed(1) + '</span>'

// Price over Risk
            value = table[key]['price_over_risk']
            line = line + '<span class="put_table_col_6">' + value.toFixed(1) + '</span>'

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
    console.log(info_url)

    document.querySelector('#wait_status').innerHTML = "... Downloading "+symbol+" Data ...";

    try {
        let res = await fetch(info_url);
        return await res.json();
    } catch (error) {
        console.log(error);
        return null
    }
}

function editEarningsDate() {
    document.querySelector('#edit_symbol').style.visibility = "visible";
    return false;
}

async function onSave() {
    edited_date = document.querySelector('#details_earnings_date').value
    document.querySelector('#next_earnings_date').innerHTML = edited_date.trim()
    jsonInfo.Item.info.next_earnings_date = edited_date.trim()


    let payload = {};
    payload['symbol'] = jsonInfo.Item.symbol;
    payload['info'] = jsonInfo.Item.info;
    let aws_url = 'https://efd6n53bol.execute-api.us-west-1.amazonaws.com/items'
    await putSymbolInfo(aws_url,payload)


    document.querySelector('#edit_symbol').style.visibility = "hidden";
    return false;
}

async function putSymbolInfo(url,data) {
    // Awaiting fetch which contains method,
    // headers and content-type and body
    console.log(url)
    console.log(data)
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify(data)
    });
           
    // Awaiting response.json()
    const resData = await response.json();
    return resData;
}
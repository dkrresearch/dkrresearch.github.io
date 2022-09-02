
async function loadPageData() {
    await loadOptionData();
    loadOpenPosition();
}

async function loadOptionData() {
    let value
    let link

    jsonInfo = await fetchSymbolInfo();
    jsonOptionInfo = await fetchOptionTable();
    jsonOptionTableInfo = findOptionInfo(jsonOptionInfo);

    console.log(jsonInfo)
    console.log(jsonOptionTableInfo)

    let symbol = jsonOptionTableInfo.symbol
    link = "<a href='/symbol.html?symbol="+symbol+"'>"+symbol+"</a>"
    document.querySelector('#symbol').innerHTML = link;
    
    document.querySelector('#expiration').innerHTML = jsonOptionTableInfo.expiration_date;
    document.querySelector('#strike').innerHTML = jsonOptionTableInfo.strike_price.toFixed(2);
    document.querySelector('#dte').innerHTML = jsonOptionTableInfo.dte;

    let symbol_name = jsonInfo.Item.info.overview.Name
    link = "<a href='https://www.marketwatch.com/investing/stock/"+symbol+"' target='_blank' rel='noopener noreferrer'>"+symbol_name+"</a>"
    document.querySelector('#name').innerHTML = link;

    document.querySelector('#next_earnings_date').innerHTML = jsonInfo.Item.info.next_earnings_date;
    document.querySelector('#ExDividendDate').innerHTML = jsonInfo.Item.info.overview.ExDividendDate;
    document.querySelector('#DividendPerShare').innerHTML = jsonInfo.Item.info.overview.DividendPerShare;
    document.querySelector('#description').innerHTML = jsonInfo.Item.info.overview.Description;
    
    value = (10000.0 * jsonOptionInfo.Item.info.max_earnings_delta).toFixed();
    value = value / 100.0
    document.querySelector('#max_earnings_effect').innerHTML = value    
    document.querySelector('#last_price').innerHTML = jsonOptionInfo.Item.info.last_price.toFixed(2)  

    value = jsonOptionTableInfo.chance_of_loss * 100.0
    document.querySelector('#chance_of_loss').innerHTML = value.toFixed(2)  
    document.querySelector('#price_of_loss').innerHTML = jsonOptionTableInfo.price_of_loss.toFixed(2)  
    document.querySelector('#target_price').innerHTML = jsonOptionTableInfo.target_price.toFixed(2)  


    let last_price = jsonOptionInfo.Item.info.last_price
    let strike_price = jsonOptionTableInfo.strike_price
    value = (1.0 - (strike_price / last_price)) * 100.0
    document.querySelector('#discount').innerHTML = value.toFixed(2)   

    value = parseFloat(jsonOptionTableInfo.quote.bid)
    document.querySelector('#bid').innerHTML = value.toFixed(2)  
    value = parseFloat(jsonOptionTableInfo.quote.ask)
    document.querySelector('#ask').innerHTML = value.toFixed(2)  
    value = parseFloat(jsonOptionTableInfo.quote.vl)
    document.querySelector('#vl').innerHTML = value.toFixed(0)  
    value = parseFloat(jsonOptionTableInfo.quote.openinterest)
    document.querySelector('#openinterest').innerHTML = value.toFixed(0)     
    
    value = parseFloat(jsonOptionTableInfo.quote.idelta)
    document.querySelector('#idelta').innerHTML = value.toFixed(4)  
    value = parseFloat(jsonOptionTableInfo.quote.igamma)
    document.querySelector('#igamma').innerHTML = value.toFixed(4)  
    value = parseFloat(jsonOptionTableInfo.quote.imp_volatility)
    document.querySelector('#imp_volatility').innerHTML = value.toFixed(4)  
    value = parseFloat(jsonOptionTableInfo.quote.itheta)
    document.querySelector('#itheta').innerHTML = value.toFixed(4)   
    value = parseFloat(jsonOptionTableInfo.quote.ivega)
    document.querySelector('#ivega').innerHTML = value.toFixed(4)   

    document.querySelector('#wait').remove();
    document.querySelector('#contents').style.visibility = "visible";
}

function findOptionInfo(jsonOptionTable) {
    let my_url = new URL(window.location.href);
    let option_symbol = my_url.searchParams.get("option_symbol").toUpperCase();

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

function loadOpenPosition() {
    bid = parseFloat(jsonOptionTableInfo.quote.bid)
    document.getElementById("details_open_price").value = (bid + 0.01).toFixed(2)
    onSliderChange()
}

function onSliderChange() {
    var slider = document.getElementById("myRange");

    document.getElementById("details_margin_label").innerHTML = "$" + slider.value + "K";

    let shares = (slider.value * 1000.0) / jsonOptionTableInfo.strike_price
    let contracts = shares / 100
    document.getElementById("details_contracts").value = contracts.toFixed(0);
    onMarginChange();
}

function onMarginChange() {
    let contracts = parseFloat( document.getElementById("details_contracts").value )
    let shares = contracts * 100
    let commision = parseFloat( document.getElementById("details_commision_price").value )
    let open_price = parseFloat( document.getElementById("details_open_price").value )
    let details_total_proceeds = (shares * open_price) -  commision
    document.getElementById("details_total_proceeds").innerHTML = "$" + details_total_proceeds.toFixed(2);
}

function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }

  
async function onOpenPosition() {
    
    document.getElementById("open_button").style.backgroundColor = "#888";
    document.getElementById("open_button").disabled = true;
    document.getElementById("open_button").innerHTML = "Opening Position ...";

    let info = {}
    info["symbol"] = jsonOptionTableInfo["symbol"]

    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear();
    let open_date = yyyy+"-"+mm+"-"+dd;
    info['open_date'] = open_date
    info['open_dte'] = parseInt( jsonOptionTableInfo['dte'] )
    info['open_price'] = parseFloat( document.getElementById("details_open_price").value )
    info['open_pol'] = parseFloat( jsonOptionTableInfo['price_of_loss'] )

    info['expiration_date'] = jsonOptionTableInfo["expiration_date"]
    info['contracts'] = parseInt(document.getElementById("details_contracts").value)
    info['quote_symbol'] = jsonOptionTableInfo['quote_symbol']
    info['target_price'] = jsonOptionTableInfo['target_price']
    info['close_price'] = -1
    info['stock_price'] = -1
    info['assigned'] = false
    info['strike_price'] = parseFloat( jsonOptionTableInfo['strike_price'] )
    info['commisions'] = parseFloat( document.getElementById("details_commision_price").value )

    info['close_date'] = ''
    info['close_dte'] = -1
    info['close_pol'] = -1
    info['sold_price'] = -1
    info['profit'] = 0
    info['bs_premium'] = 0

    payload = {}
    payload['id'] = uuidv4();
    payload['info'] = info
    payload['opened'] = true
    
    console.log(payload)

    let aws_url = 'https://efd6n53bol.execute-api.us-west-1.amazonaws.com/positions'
    await putPosition(aws_url,payload)

    document.getElementById("open_button").style.backgroundColor = "#888";
    document.getElementById("open_button").disabled = true;
    document.getElementById("open_button").innerHTML = "Opened";
}

async function putPosition(url,data) {
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
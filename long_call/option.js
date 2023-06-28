

// "7d50d586-7387-4f9d-be7d-023679cd0783"

async function loadPageData() {
    await loadOptionData();
    loadOpenPosition();
}

async function loadOptionData() {
    let value
    let link

    jsonInfo = await fetchSymbolInfo();
    jsonOptionInfo = await fetchOptionTable(jsonInfo.Item.symbol);
    jsonOptionTableInfo = findOptionInfo(jsonOptionInfo);

    let symbol = jsonOptionTableInfo.symbol
    let option_label = jsonOptionTableInfo.strike_price.toFixed(2) + " Put"
 
    console.log(jsonOptionTableInfo)

    document.querySelector('#title').innerHTML = "DKR Research : " + symbol + " " + option_label

    link = "<a href='symbol.html?symbol="+symbol+"'>"+symbol+"</a>"
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
    document.querySelector('#last_price').innerHTML = jsonOptionInfo.Item.info.last_price.toFixed(2)  

    let last_price = jsonOptionInfo.Item.info.last_price
    let strike_price = jsonOptionTableInfo.strike_price
    value = parseFloat(jsonOptionTableInfo.discount) * 100.0
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


    value = parseFloat(jsonOptionTableInfo.chance_of_payout) * 100.0
    document.querySelector('#chance_of_payout').innerHTML = value.toFixed(2)   

    value = parseFloat(jsonOptionTableInfo.payout_over_prem)
    document.querySelector('#payout_over_prem').innerHTML = value.toFixed(2)   

    
    value = parseFloat(jsonOptionTableInfo.mean_payout)
    document.querySelector('#avg_payout').innerHTML = "$" + value.toFixed(2)   

    value = parseFloat(jsonOptionTableInfo.fair_price_of_option)
    document.querySelector('#fair_price').innerHTML = "$" + value.toFixed(2)   
    value = parseFloat(jsonOptionTableInfo.quote.buy_price)
    document.querySelector('#buy_price').innerHTML = "$" + value.toFixed(2)   

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

function loadOpenPosition() {
    let mark = parseFloat(jsonOptionTableInfo.quote.buy_price)
    document.getElementById("details_open_price").value = (mark).toFixed(2)
    onSliderChange()
}

function onContractsChange() {
    let contracts = parseInt( document.getElementById("details_contracts").value )
        
    let commision = 0.65 * contracts
    document.getElementById("details_commision_price").value = commision.toFixed(2);

    return onMarginChange()
}

function onSliderChange() {
    let slider = document.getElementById("myRange");
    let value = slider.value

    let open_price = parseFloat( document.getElementById("details_open_price").value )
    let shares = value / open_price
    let contracts = Math.round( shares / 100 )
    document.getElementById("details_contracts").value = contracts.toFixed(0);

    let commision = 0.65 * contracts
    document.getElementById("details_commision_price").value = commision.toFixed(2);

    onMarginChange();
}

function onMarginChange() {
    let contracts = parseFloat( document.getElementById("details_contracts").value )
    let shares = contracts * 100
    let commision = parseFloat( document.getElementById("details_commision_price").value )
    let open_price = parseFloat( document.getElementById("details_open_price").value )
    let strike_price = parseFloat( jsonOptionTableInfo['strike_price'] )

    let prem = contracts * 100 * open_price
    document.getElementById("details_premimum").innerHTML = "$" + prem.toFixed(0);

    let details_total_price = (shares * open_price) +  commision
    document.getElementById("details_total_price").innerHTML = "$" + details_total_price.toFixed(2);

    let assignment_margin = (strike_price * shares)
    document.getElementById("details_am").innerHTML = printUSD(assignment_margin);

    let avg_payout = parseFloat( jsonOptionTableInfo['mean_payout'] ) * shares
    document.getElementById("details_payout").innerHTML = printUSD(avg_payout);
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
    info["option_type"] = "long_call"
    info["symbol"] = jsonOptionTableInfo["symbol"]

    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear();
    let open_date = yyyy+"-"+mm+"-"+dd;
    info['open_date'] = open_date
    info['open_dte'] = parseInt( jsonOptionTableInfo['dte'] )
    info['chance_of_payout'] = parseFloat( jsonOptionTableInfo['chance_of_payout'] )
    info['payout_over_prem'] = parseFloat( jsonOptionTableInfo['payout_over_prem'] )
    info['discount'] = parseFloat( jsonOptionTableInfo['discount'] )
    info['fair_price_of_option'] = parseFloat( jsonOptionTableInfo['fair_price_of_option'] )
    info['expiration_date'] = jsonOptionTableInfo["expiration_date"]
    info['quote_symbol'] = jsonOptionTableInfo['quote_symbol']
    info['strike_price'] = parseFloat( jsonOptionTableInfo['strike_price'] )

    info['open_price'] = parseFloat( document.getElementById("details_open_price").value )
    info['contracts'] = parseInt(document.getElementById("details_contracts").value)
    info['commisions'] = parseFloat( document.getElementById("details_commision_price").value )
    info['close_price'] = -1
    info['stock_price'] = -1
    info['assigned'] = false

    info['close_date'] = ''
    info['close_dte'] = -1
    info['close_pol'] = -1
    info['sold_price'] = -1
    info['profit'] = 0
    info['bs_premium'] = 0

    let payload = {}
    payload['id'] = uuidv4();
    payload['info'] = info
    payload['opened'] = true
    
    console.log(payload)
    await putPosition(payload)

    document.getElementById("open_button").style.backgroundColor = "#888";
    document.getElementById("open_button").disabled = true;
    document.getElementById("open_button").innerHTML = "Opened";
}


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

    let symbol = jsonInfo.Item.symbol

    link = "<a href='symbol.html?symbol="+symbol+"'>"+symbol+"</a>"
    document.querySelector('#symbol').innerHTML = link;
    
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

    if (jsonOptionTableInfo != null) {
        let option_label = jsonOptionTableInfo.strike_price.toFixed(2) + " Put"
        document.querySelector('#title').innerHTML = "DKR Research : " + symbol + " " + option_label
        document.querySelector('#next_earnings_date').innerHTML = jsonOptionTableInfo.next_earnings_date;
    
        document.querySelector('#expiration').innerHTML = jsonOptionTableInfo.expiration_date;
        document.querySelector('#strike').innerHTML = jsonOptionTableInfo.strike_price.toFixed(2);
        document.querySelector('#dte').innerHTML = jsonOptionTableInfo.dte;
        document.querySelector('#last_price').innerHTML = jsonOptionInfo.Item.info.last_price.toFixed(2)  
        document.querySelector('#last_price_2').innerHTML = jsonOptionInfo.Item.info.last_price.toFixed(2)  

        value = jsonOptionTableInfo.chance_of_loss * 100.0
        document.querySelector('#chance_of_loss').innerHTML = value.toFixed(2)  
        document.querySelector('#price_of_loss').innerHTML = jsonOptionTableInfo.price_of_loss.toFixed(4)  

        value = jsonOptionTableInfo.var * (100000.00 / (100.0 * jsonOptionTableInfo.strike_price))
        document.querySelector('#var_per_100K').innerHTML = numberWithCommas( parseInt(value) )

        if (jsonOptionTableInfo.hasOwnProperty('net_over_var') == true) {
            value = 1000.0 * parseFloat(jsonOptionTableInfo.net_over_var)
            document.querySelector('#net_over_var').innerHTML = value.toFixed(1)
        } else {
            document.querySelector('#net_over_var').innerHTML = '---'
        }

        if (jsonOptionTableInfo.hasOwnProperty('prem_over_var') == true) {
            value = parseFloat(jsonOptionTableInfo.prem_over_var) * 1000.0
            document.querySelector('#prem_over_var').innerHTML = value.toFixed(1)
            document.querySelector('#details_prem_over_var').innerHTML = value.toFixed(1)
        } else {
            document.querySelector('#prem_over_var').innerHTML = ''
            document.querySelector('#details_prem_over_var').innerHTML = ''
        }

        if (jsonOptionTableInfo.hasOwnProperty('price_over_risk') == true) {
            value = jsonOptionTableInfo.price_over_risk
            document.querySelector('#price_over_risk').innerHTML = value.toFixed(1)
            document.getElementById("details_price_over_risk").innerHTML = value.toFixed(1);
        } else {
            document.querySelector('#price_over_risk').innerHTML = ''
            document.getElementById("details_price_over_risk").innerHTML = ''
        }
        
        document.getElementById("details_margin_label").innerHTML = "$" + globalDefaultValue + "K";


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

        console.log(jsonOptionTableInfo)

        //  Fair Value Calcs
        if (jsonOptionTableInfo != null) {
            document.querySelector('#price_of_prem').innerHTML = jsonOptionTableInfo.bs_prem_per_share.toFixed(2)  
            let fair_value = jsonOptionTableInfo.bs_prem_per_share + jsonOptionTableInfo.price_of_loss
            document.querySelector('#fair_value').innerHTML = fair_value.toFixed(2)              
        }
    }

    document.querySelector('#wait').remove();
    document.querySelector('#contents').style.visibility = "visible";
}

function findOptionInfo(jsonOptionTable) {
    let my_url = new URL(window.location.href);
    let option_symbol = my_url.searchParams.get("option_symbol").toUpperCase();

//  Find this option in the option table
    let option_table = jsonOptionTable.Item.info.option_table_near
    for(var key in option_table) {
        if (option_table[key]['type'] != 'short_put')
            continue
        if ((option_table[key]['quote_symbol'] == option_symbol))
            return option_table[key]
    }

    option_table = jsonOptionTable.Item.info.option_table_far
    for(var key in option_table) {
        if (option_table[key]['type'] != 'short_put')
            continue
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
    let mark = parseFloat(jsonOptionTableInfo.quote.mark_price)
    document.getElementById("details_open_price").value = (mark).toFixed(2)
    onSliderChange()
}

function onContractsChange() {
    let contracts = Math.floor(parseInt( document.getElementById("details_contracts").value ))
    
    let margin_value = parseInt( contracts * 100.0 * jsonOptionTableInfo.strike_price / 1000.0)
    document.getElementById("details_margin_label").innerHTML = "$" + margin_value + "K";
    
    let commision = 0.65 * contracts
    document.getElementById("details_commision_price").value = commision.toFixed(2);

    return onMarginChange()
}

function onSliderChange() {
    let slider = document.getElementById("myRange");
    let value = slider.value

//  Get the selected value at risk contracts
    let contracts = value * (jsonOptionTableInfo['constant_var_contracts'] / 10000)
    contracts = Math.floor(contracts)

    let commision = 0.65 * contracts
    document.getElementById("details_contracts").value = contracts.toFixed(0);
    document.getElementById("details_commision_price").value = commision.toFixed(2);

    let shares = contracts * 100
    let margin = shares * jsonOptionTableInfo['strike_price']
    document.getElementById("details_margin_label").innerHTML = "$" + parseInt(margin / 1000) + "K";

    onMarginChange();
}

function onMarginChange() {
    let contracts = Math.floor( parseFloat( document.getElementById("details_contracts").value )  )
    let shares = contracts * 100
    let commision = parseFloat( document.getElementById("details_commision_price").value )
    let open_price = parseFloat( document.getElementById("details_open_price").value )
    let details_total_proceeds = (shares * open_price) -  commision

    document.getElementById("details_total_proceeds").innerHTML = "$" + details_total_proceeds.toFixed(2);

    let value = (jsonOptionTableInfo.var * contracts) / 1000.0
    document.getElementById("details_value_at_risk").innerHTML = "$" + value.toFixed(0) + "K";

    let base_por = jsonOptionTableInfo.price_over_risk
    let mark = parseFloat(jsonOptionTableInfo.quote.mark_price)
    let new_por = (base_por / mark) * open_price
    document.getElementById("details_price_over_risk").innerHTML = new_por.toFixed(1);

    let base_pov = parseFloat(jsonOptionTableInfo.prem_over_var) * 1000.0
    let new_pov = (base_pov / mark) * open_price
    document.getElementById("details_prem_over_var").innerHTML = new_pov.toFixed(1);

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
    info["option_type"] = "short_put"
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

    info['open_var'] = parseFloat( jsonOptionTableInfo['var'] ) * parseInt(document.getElementById("details_contracts").value)

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

    let payload = {}
    payload['id'] = uuidv4();
    payload['info'] = info
    payload['opened'] = true
    await putPosition(payload)

    document.getElementById("open_button").style.backgroundColor = "#888";
    document.getElementById("open_button").disabled = true;
    document.getElementById("open_button").innerHTML = "Opened";
}



var jsonInfo;
var jsonOptionInfo;
var jsonOptionTableInfo;
var jsonPositionInfo;

var prem_per_day_per_1K = 0.050

async function loadPositionData() {
    let value;

    await loadOptionData();

    let my_url = new URL(window.location.href);
    let quote_symbol = my_url.searchParams.get("option_symbol").toUpperCase();
    let symbol = my_url.searchParams.get("symbol").toUpperCase();

    jsonPositionInfo = await _fetchPosition(quote_symbol)
    console.log(jsonPositionInfo)

    let option_label = jsonPositionInfo['info']['strike_price'].toFixed(2) + " Put"
    document.querySelector('#title').innerHTML = "DKR Research : " + symbol + " " + option_label

    document.querySelector('#details_contracts').innerHTML = jsonPositionInfo['info']['contracts'].toFixed(0)  
    document.querySelector('#details_open_price').innerHTML = jsonPositionInfo['info']['open_price'].toFixed(2)

    value = jsonPositionInfo['info']['strike_price'] * jsonPositionInfo['info']['contracts'] / 10.0

    let last_price = jsonOptionInfo.Item.info.last_price

    let dte = 0
    if (jsonOptionTableInfo == null) {
        let bs_remaining = 0
        document.querySelector('#details_bs_remaining').innerHTML = '$' + bs_remaining.toFixed(2)  
        
        let value_at_risk = 0
        document.querySelector('#details_var').innerHTML = '$' + (value_at_risk / 1000.0).toFixed(1) +'K';

        document.querySelector('#myRange').min = 0.0  
        document.querySelector('#myRange').max = 0.01  
        document.querySelector('#myRange').value = 0.0  
    } else {
        console.log(jsonOptionTableInfo)
        dte = jsonOptionTableInfo['dte']

        let strike_price = jsonOptionTableInfo.strike_price
        value = (1.0 - (strike_price / last_price)) * 100.0
        document.querySelector('#details_discount').innerHTML = value.toFixed(2) + '%'  
            
        value = jsonOptionTableInfo.chance_of_loss * 100.0
        document.querySelector('#details_roa').innerHTML = value.toFixed(2)  + '%'   
        document.querySelector('#details_poa').innerHTML = jsonOptionTableInfo.price_of_loss.toFixed(2)  

        value_at_risk = jsonOptionTableInfo['var'] * jsonPositionInfo['info']['contracts']
        document.querySelector('#details_var').innerHTML = '$' + (value_at_risk / 1000.0).toFixed(1) +'K' 

        let bid = parseFloat(jsonOptionTableInfo.quote.bid)
        let ask = parseFloat(jsonOptionTableInfo.quote.ask)
        let mark = ((ask - bid) / 2.0) + bid
        
        document.querySelector('#myRange').min = bid  
        document.querySelector('#myRange').max = ask  
        document.querySelector('#myRange').value = mark      
    }

    value = jsonPositionInfo['info']['strike_price'] * jsonPositionInfo['info']['contracts'] / 10.0
    document.querySelector('#details_margin_label').innerHTML = '$' + value.toFixed(2)  + 'K'  
    value = jsonPositionInfo['info']['open_price']
    document.querySelector('#details_open_price').innerHTML = value.toFixed(2)  

    let margin = jsonPositionInfo['info']['strike_price'] * jsonPositionInfo['info']['contracts'] / 10.0
    let bs_remaining = dte * margin * prem_per_day_per_1K
    document.querySelector('#details_bs_remaining').innerHTML = '$' + bs_remaining.toFixed(2)  

    
    if ('open_dte' in jsonPositionInfo['info']) {
        let opened_dte = jsonPositionInfo['info']['open_dte']
        let bs_paid = (opened_dte - dte) * margin * prem_per_day_per_1K
        document.querySelector('#details_bs_paid').innerHTML = '$' + bs_paid.toFixed(2)  
    }

    let pop = bs_remaining / (100.0 * jsonPositionInfo['info']['contracts'])
    document.querySelector('#details_pop').innerHTML = pop.toFixed(2)  

    onClosePriceChange();
}


function onClosePriceChange() {
    var slider = document.getElementById("myRange");

    document.getElementById("details_close_price_label").innerHTML = slider.value;
    document.getElementById("details_close_price").value = slider.value;

    let open = jsonPositionInfo['info']['open_price']
    let mark = slider.value 
    let profit = (open - mark) * jsonPositionInfo['info']['contracts'] * 100.0
    document.getElementById("details_profit").innerHTML = "$" + profit.toFixed(2);

    let max_value = jsonPositionInfo['info']['contracts'] * 100.0 * open
    document.getElementById("details_max_value").innerHTML = "$" + max_value.toFixed(2);
}

async function onAssignPosition() {
    document.getElementById("close_button").style.backgroundColor = "#888";
    document.getElementById("close_button").disabled = true;

    document.getElementById("assign_button").style.backgroundColor = "#888";
    document.getElementById("assign_button").disabled = true;
    document.getElementById("assign_button").innerHTML = "Assigning ...";

    let info = jsonPositionInfo['info']
    console.log(info)
    
    payload = {}
    payload['id'] = jsonPositionInfo["id"]
    payload['info'] = info
    payload['opened'] = true    
    payload['assigned'] =  true
    await putPosition(payload)

    document.getElementById("close_button").innerHTML = "Assigned";
}

async function onClosePosition() {
    document.getElementById("close_button").style.backgroundColor = "#888";
    document.getElementById("close_button").disabled = true;
    document.getElementById("close_button").innerHTML = "Closing Position ...";

    document.getElementById("assign_button").style.backgroundColor = "#888";
    document.getElementById("assign_button").disabled = true;

    let info = jsonPositionInfo['info']

    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear();
    let close_date = yyyy+"-"+mm+"-"+dd;

    info['close_price'] = parseFloat( document.getElementById("details_close_price").value )
    info['close_date'] =  close_date
    if (jsonOptionTableInfo == null) {
        info['close_dte'] = 0
        info['close_pol'] = 0
    } else {
        info['close_dte'] =  jsonOptionTableInfo['dte']
        info['close_pol'] =  jsonOptionTableInfo['price_of_loss']
    }

    info['assigned'] =  false
    if (  document.getElementById("details_close_price").checked == true )
        info['assigned'] =  true
    info['sold_price'] = -1

    info['commisions'] += parseFloat( document.getElementById("details_commision_price").value )
    info['profit'] = ((info['open_price'] - info['close_price'] ) * info['contracts'] * 100.0) - info['commisions']
    
    days_open = (info['open_dte']  - info['close_dte'])
    strike_value_1K = (info['strike_price'] * info['contracts'] * 100.0) / 1000.0

    //info['bs_premium'] = (info['open_dte']  - info['close_dte']) * (info['strike_price'] * info['contracts']) * 0.0075
    info['bs_premium'] = (days_open * strike_value_1K) * prem_per_day_per_1K 

    let jsonStatus = await fetchStatus(globalCurrentYear);
    jsonStatus['short_put']['cnt_positions'] += 1
    jsonStatus['short_put']['carried_losses'] += 100.0 * info['open_pol'] * info['contracts']
    if (info['profit'] < 0) 
        jsonStatus['short_put']['carried_losses'] += info['profit']
    
    jsonStatus['short_put']['bs_premium'] += info['bs_premium']
    jsonStatus['short_put']['profit'] += info['profit']

    let payload = {}
    payload['id'] = globalCurrentYear
    payload['status'] = jsonStatus
    await putStatus(payload);
    
    payload = {}
    payload['id'] = jsonPositionInfo["id"]
    payload['info'] = info
    payload['opened'] = false
    await putPosition(payload)

    document.getElementById("close_button").innerHTML = "Closed";
}

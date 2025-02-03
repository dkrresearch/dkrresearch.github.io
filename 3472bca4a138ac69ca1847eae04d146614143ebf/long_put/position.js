

var jsonInfo;
var jsonOptionInfo;
var jsonOptionTableInfo;
var jsonPositionInfo;


async function loadPositionData() {
    let value;

    await loadOptionData();

    let my_url = new URL(window.location.href);
    let quote_symbol = my_url.searchParams.get("option_symbol").toUpperCase();
    let symbol = my_url.searchParams.get("symbol").toUpperCase();

    jsonPositionInfo = await _fetchPosition(quote_symbol)
    console.log(jsonPositionInfo)

    let option_label = jsonPositionInfo['info']['strike_price'].toFixed(2) + "  Put"
    document.querySelector('#title').innerHTML = "DKR Research : " + symbol + " " + option_label

    document.querySelector('#details_contracts').innerHTML = jsonPositionInfo['info']['contracts'].toFixed(0)  
    document.querySelector('#details_open_price').innerHTML = jsonPositionInfo['info']['open_price'].toFixed(2)

    value = jsonPositionInfo['info']['strike_price'] * jsonPositionInfo['info']['contracts'] / 10.0

    let last_price = jsonOptionInfo.Item.info.last_price
    let strike_price = jsonPositionInfo['info']['strike_price']
    value = (1.0 - (strike_price / last_price)) * 100.0
    document.querySelector('#details_discount').innerHTML = value.toFixed(2) + '%'  

    let mark = jsonPositionInfo['info']['strike_price']
    let dte = 0
    if (jsonOptionTableInfo == null) {
        document.querySelector('#myRange').min = 0.0  
        document.querySelector('#myRange').max = 0.01  
        document.querySelector('#myRange').value = 0.0  
    } else {
        console.log(jsonOptionTableInfo)
        dte = jsonOptionTableInfo['dte']

        value = jsonOptionTableInfo.fair_price_of_option / jsonPositionInfo['info']['open_price']
        document.querySelector('#est_roi').innerHTML = value.toFixed(2)   
    
        let pop = jsonOptionTableInfo.chance_of_payout
        document.querySelector('#details_coa').innerHTML = (pop * 100.0).toFixed(2) + '%'  

        value = parseFloat(jsonOptionTableInfo.mean_payout)
        document.querySelector('#details_avg_payout').innerHTML = "$" + value.toFixed(2)   
    
        let bid = parseFloat(jsonOptionTableInfo.quote.bid)
        let ask = parseFloat(jsonOptionTableInfo.quote.ask)
        mark = parseFloat(jsonOptionTableInfo.quote.sell_price)
        
        document.querySelector('#myRange').min = bid  
        document.querySelector('#myRange').max = ask  
        document.querySelector('#myRange').value = mark      
    }

    value = last_price  * jsonPositionInfo['info']['contracts'] * 100.0
    document.querySelector('#details_am').innerHTML = printUSD(value) 
    
    value = jsonPositionInfo['info']['open_price']
    document.querySelector('#details_open_price').innerHTML = value.toFixed(2)  


    onClosePriceChange();
}


function onClosePriceChange() {
    var slider = document.getElementById("myRange");

    document.getElementById("details_close_price_label").innerHTML = slider.value;
    document.getElementById("details_close_price").value = slider.value;

    let open = jsonPositionInfo['info']['open_price']
    let mark = slider.value 
    let profit = (mark - open) * jsonPositionInfo['info']['contracts'] * 100.0
    document.getElementById("details_profit").innerHTML = printUSD(profit);

    let cur_value = mark  * jsonPositionInfo['info']['contracts'] * 100.0
    document.getElementById("details_cur_value").innerHTML = printUSD(cur_value);
}

async function onAssignPosition() {
    document.getElementById("assign_button").style.backgroundColor = "#888";
    document.getElementById("assign_button").disabled = true;
    document.getElementById("assign_button").innerHTML = "Assigning ...";

    document.getElementById("close_button").style.backgroundColor = "#888";
    document.getElementById("close_button").disabled = true;

    let info = jsonPositionInfo['info']
    info['assigned'] =  true
    console.log(info)
    
    payload = {}
    payload['id'] = jsonPositionInfo["id"]
    payload['info'] = info
    payload['opened'] = true    
    payload['assigned'] =  true
    console.log(info)

    await putPosition(payload)

    document.getElementById("assign_button").innerHTML = "Assigned";
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
    info['sold_price'] = -1

    info['commisions'] += parseFloat( document.getElementById("details_commision_price").value )
    info['profit'] = ((info['close_price'] - info['open_price']) * info['contracts'] * 100.0) - info['commisions']
    info['bs_premium'] = 0.0

    console.log(info)

    let jsonStatus = await fetchStatus(globalCurrentYear);
    let algo = 'long_put'
    let symbol = info['symbol'].toString()
    let month = info['quote_symbol'].substring( symbol.length + 4, symbol.length + 6)
    console.log( month )

    if ((algo in jsonStatus['algos']) == false) {
        jsonStatus['algos'][algo] = {}
        jsonStatus['algos'][algo]['cnt_positions'] = 0
        jsonStatus['algos'][algo]['cnt_assignments'] = 0
        jsonStatus['algos'][algo]['carried_gains'] = 0.0
        jsonStatus['algos'][algo]['profit'] = 0.0  
        jsonStatus['algos'][algo]['history'] = {}
    }

    if ((month in jsonStatus['algos'][algo]['history']) == false) {
        jsonStatus['algos'][algo]['history'][month] = {}
        jsonStatus['algos'][algo]['history'][month]['count'] = 0
        jsonStatus['algos'][algo]['history'][month]['assignments'] = 0
        jsonStatus['algos'][algo]['history'][month]['profit'] = 0.0    
    }

    jsonStatus['algos'][algo]['history'][month]['profit'] += info['profit']
    jsonStatus['algos'][algo]['history'][month]['count'] += 1

    jsonStatus['algos'][algo]['cnt_positions'] += 1
    jsonStatus['algos'][algo]['carried_gains'] += 100.0 * info['contracts'] * info['open_price'] * info['est_roi']
    if (info['profit'] > 0) 
        jsonStatus['algos'][algo]['carried_gains'] -= info['profit']
    
    jsonStatus['algos'][algo]['profit'] += info['profit']

    console.log(jsonStatus)
    console.log(info)
    
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
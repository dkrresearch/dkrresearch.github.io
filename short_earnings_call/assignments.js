
async function loadPositionsData() {

    document.querySelector('#wait_status').innerHTML = "... Downloading Assigned Positions ...";
    let jsonInfo = await fetchPositionsInfo();
    if ((jsonInfo == null) || (jsonInfo.hasOwnProperty("Items") == false)) {      
        return loadError("Unable to load Positions Table")
    }

    let table = jsonInfo.Items;
    let current_value = 0.0

    let divTable = document.getElementById("open_positions_table");
    for (var key in table) {
        uuid = table[key]['id']
        position_info = table[key]['info']
        if (position_info['assigned'] == false)
            continue
        if (('option_type' in position_info) == false)  //  legacy short_put
            continue
        if (position_info['option_type'] != "short_earnings_call")
            continue

        console.log(position_info)

        let template = get_template()

        let symbol = position_info["symbol"]
        let strike_price = position_info["strike_price"]
        let shares = position_info["contracts"] * 100
        
        template = template.replaceAll("{$symbol}",symbol)
        template = template.replaceAll("{$strike}",strike_price.toFixed(2))
        template = template.replaceAll("{$expiration}",position_info["expiration_date"])
        template = template.replaceAll("{$shares}",shares)
        template = template.replaceAll("{$idx}","'" + uuid + "'")
        template = template.replaceAll("{$quote_symbol}",position_info["quote_symbol"])
        
        let jsonOptionInfo = await fetchOptionTable(symbol);

        let profit = 0.0
        if (jsonOptionInfo != null) {
            console.log( jsonOptionInfo )
            let last_price = jsonOptionInfo.Item.info['last_price']

            template = template.replaceAll("{$price}",last_price.toFixed(2))
            template = template.replaceAll("{$close_price}",last_price.toFixed(2))
    
            profit = (last_price - strike_price) * shares
            template = template.replaceAll("{$profit}",printUSD(profit))

            let gain = (100.0 * (last_price - strike_price)) / strike_price
            template = template.replaceAll("{$gain}",gain.toFixed(2))
        }
        current_value += profit

        if (profit < 0) {
            template = template.replaceAll("{$red}","color:rgb(145, 35, 35);")
        } else {
            template = template.replaceAll("{$red}","")
        }

        let ele = htmlToElement(template);
        divTable.appendChild(ele);
    }

    let jsonStatus = await fetchStatus(globalCurrentYear);
    console.log(jsonStatus)
    
    document.getElementById("current_value").innerHTML = printUSD(current_value);

    document.querySelector('#wait').remove();
    document.querySelector('#contents').style.visibility = "visible";
}

function get_template() {
    let block = '\
    <div class="positions_table_row">\
    <div class="positions_table_col_1">\
        <h1><span id="symbol">{$symbol}</span> <span id="expiration">{$expiration}</span> <span id="strike">{$strike}</span></h1>\
    </div>\
    <div class="positions_table_col_2">\
        <h1></h1>\
        <h2><span id="shares">{$shares}</span> Shares</h2>\
    </div>\
    <div class="positions_table_col_3">\
        <div class="details_table_row" style="margin-bottom:12px;"><span class="details_table_col1">Current Price :</span>\
            <span  class="details_table_col2" id="details_price">{$price}</span></div>\
        <div class="details_table_row"  style="margin-bottom:12px;"><span class="details_table_col1">Gain :</span>\
            <span  class="details_table_col2" id="details_gain" style="{$red}">{$gain}%</span></div>    \
        <div class="details_table_row"  style="margin-bottom:12px;"><span class="details_table_col1">Profit :</span>\
            <span  class="details_table_col2" id="details_profit" style="{$red}">{$profit}</span></div>              \
    </div>\
    <div class="positions_table_col_4" style="float:right; width:30%; border:1px solid rgb(0, 141, 129);">\
        <div style="width:100%; background-color:rgb(0, 141, 129); text-align:center; color:white;">Close</div>\
        <div class="details_table_row" style="height:30px; border-bottom:none">\
            <span style="height:20px;" class="details_table_col1">Close Price :</span>\
            <input type="text" id="close_price_{$quote_symbol}" class="input_label" value="{$close_price}"></input></div>\
        <div class="details_table_row" style="height:30px; margin-top:0px; border-bottom:none;">\
            <span style="height:20px;" class="details_table_col1">Commission :</span>\
            <input type="text" id="close_commision_price_{$quote_symbol}" class="input_label" value="0.00"></input></div>\
        <hr style="width:80%; margin-top:10px; margin-left:10%; color:gray"/>\
        <div class="details_table_row" style="height:30px; margin-top:0px; border-bottom:none;">\
            <span style="height:20px;" class="details_table_col1">Profit :</span>\
            <span class="details_table_col2" id="close_profit"  style="{$red}">{$profit}</span>\
        </div>\
        <button class="input_button" id="btn_{$quote_symbol}" onclick="onClosePosition(\'{$quote_symbol}\')">Close Position</button>\
    </div>\
    </div>\
    ';
    return block
}


async function onClosePosition(quote_symbol) {
    console.log(quote_symbol)

    let btn = 'btn_' + quote_symbol
    document.getElementById(btn).style.backgroundColor = "#888";
    document.getElementById(btn).disabled = true;
    document.getElementById(btn).innerHTML = "Closing Position ...";

    jsonPositionInfo = await _fetchPosition(quote_symbol)
    console.log(jsonPositionInfo)    
    return
    
    let info = jsonPositionInfo['info']

    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear();
    let close_date = yyyy+"-"+mm+"-"+dd;

    info['close_price'] = 0.0
    info['close_date'] =  close_date
    info['close_dte'] = 0
    info['close_pol'] = 0

    let sold_price = parseFloat( document.getElementById("close_price_"+quote_symbol).value )
    let commision = parseFloat( document.getElementById("close_commision_price_"+quote_symbol).value )
    info['assigned'] =  true
    info['sold_price'] = sold_price

    info['commisions'] += commision
    info['profit'] = ((sold_price - info['strike_price'] - info['open_price']) * info['contracts'] * 100.0) - info['commisions']
    info['bs_premium'] = 0.0


    let jsonStatus = await fetchStatus(globalCurrentYear);
    if (('short_earnings_call' in jsonStatus) == false) {
        jsonStatus['short_earnings_call'] = {}
        jsonStatus['short_earnings_call']['cnt_positions'] = 0
        jsonStatus['short_earnings_call']['cnt_assignments'] = 0
        jsonStatus['short_earnings_call']['carried_losses'] = 0.0
        jsonStatus['short_earnings_call']['bs_premium'] = 0.0
        jsonStatus['short_earnings_call']['profit'] = 0.0  
    }

    jsonStatus['short_earnings_call']['cnt_positions'] += 1
    jsonStatus['short_earnings_call']['cnt_assignments'] += 1
    jsonStatus['short_earnings_call']['profit'] += info['profit']
    jsonStatus['short_earnings_call']['carried_gains'] += info['open_price'] * (info['est_roi'] - 1.0) * info['contracts'] * 100.0
    if (info['profit'] > 0) 
        jsonStatus['short_earnings_call']['carried_gains'] -= info['profit']

    let payload = {}
    payload['id'] = globalCurrentYear
    payload['status'] = jsonStatus
    console.log(payload)
//  TEST ME :    await putStatus(payload);
    
    payload = {}
    payload['id'] = jsonPositionInfo["id"]
    payload['info'] = info
    payload['opened'] = false
    console.log(payload)
    await putPosition(payload)

//  TEST ME :        document.getElementById(btn).innerHTML = "Closed";
    return
}
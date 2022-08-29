

var jsonInfo;
var jsonOptionInfo;
var jsonOptionTableInfo;
var jsonPositionInfo;

async function loadPositionData() {
    let value;

    await loadOptionData();

    let last_price = jsonOptionInfo.Item.info.last_price
    let strike_price = jsonOptionTableInfo.strike_price
    value = (1.0 - (strike_price / last_price)) * 100.0
    document.querySelector('#details_discount').innerHTML = value.toFixed(2) + '%'  

    value = jsonOptionTableInfo.chance_of_loss * 100.0
    document.querySelector('#details_roa').innerHTML = value.toFixed(2)  + '%'   
    document.querySelector('#details_poa').innerHTML = jsonOptionTableInfo.price_of_loss.toFixed(2)  

    let symbol =  jsonOptionTableInfo.symbol
    jsonPositionInfo = await fetchPosition(symbol)
    console.log(jsonPositionInfo)


    
    document.querySelector('#details_contracts').innerHTML = jsonPositionInfo['info']['contracts'].toFixed(0)  
    document.querySelector('#details_open_price').innerHTML = jsonPositionInfo['info']['open_price'].toFixed(2)


    value = jsonPositionInfo['info']['strike_price'] * jsonPositionInfo['info']['contracts'] / 10.0
    document.querySelector('#details_margin').innerHTML = '$' + value.toFixed(2)  + 'K'  
    value = jsonPositionInfo['info']['open_price']
    document.querySelector('#details_open_price').innerHTML = value.toFixed(2)  

    let margin = jsonPositionInfo['info']['strike_price'] * jsonPositionInfo['info']['contracts'] / 10.0
    let dte = jsonOptionTableInfo['dte']
    let bs_remaining = dte * 0.075 * margin
    document.querySelector('#details_bs_remaining').innerHTML = '$' + bs_remaining.toFixed(2)  

    if ('opened_dte' in jsonPositionInfo['info']) {
        let opened_dte = jsonOptionTableInfo['opened_dte']
        let bs_paid = (opened_dte - dte) * 0.075 * margin
        document.querySelector('#details_bs_paid').innerHTML = bs_paid.toFixed(2)  
    }

    let pop = bs_remaining / (100.0 * jsonPositionInfo['info']['contracts'])
    document.querySelector('#details_pop').innerHTML = pop.toFixed(2)  

    let bid = parseFloat(jsonOptionTableInfo.quote.bid)
    let ask = parseFloat(jsonOptionTableInfo.quote.ask)
    let mark = ((ask - bid) / 2.0) + bid
    
    document.querySelector('#myRange').min = bid  
    document.querySelector('#myRange').max = ask  
    document.querySelector('#myRange').value = mark  

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
}


async function fetchPosition(symbol) {
    let jsonPositions = await fetchPositionTable()
    let table = jsonPositions.Items;

    for (var key in table) {
        if (table[key]['info']['symbol'] == symbol) 
            return table[key]
    }

    return null       
}

async function fetchPositionTable() {
    let my_url = new URL(window.location.href);
    let symbol = my_url.searchParams.get("symbol").toUpperCase();
    let info_url = 'https://efd6n53bol.execute-api.us-west-1.amazonaws.com/positions/opened'
    console.log(info_url)
    try {
        let res = await fetch(info_url);
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}
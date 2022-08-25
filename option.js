
async function loadOptionData() {
    let value
    let jsonInfo = await fetchSymbolInfo();
    let jsonOptionInfo = await fetchOptionTable();
    jsonOptionTableInfo = findOptionInfo(jsonOptionInfo);
    console.log(jsonOptionTableInfo)

    symbol = jsonOptionTableInfo.symbol
    link = "<a href='/symbol.html?symbol="+symbol+"'>"+symbol+"</a>"
    document.querySelector('#symbol').innerHTML = link;
    
    document.querySelector('#expiration').innerHTML = jsonOptionTableInfo.expiration_date;
    document.querySelector('#strike').innerHTML = jsonOptionTableInfo.strike_price.toFixed(2);
    document.querySelector('#dte').innerHTML = jsonOptionTableInfo.dte;

    symbol_name = jsonInfo.Item.info.overview.Name
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
    document.querySelector('#price_of_loss').innerHTML = (100.00 * jsonOptionTableInfo.price_of_loss).toFixed(2)  
    document.querySelector('#target_price').innerHTML = jsonOptionTableInfo.target_price.toFixed(2)  

    

    let last_price = jsonOptionInfo.Item.info.last_price
    let strike_price = jsonOptionTableInfo.strike_price
    console.log( strike_price )
    console.log( last_price )
    value = (1.0 - (strike_price / last_price)) * 100.0
    document.querySelector('#discount').innerHTML = value.toFixed(2)   

    value = parseFloat(jsonOptionTableInfo.quote.bid)
    document.querySelector('#bid').innerHTML = value.toFixed(2)  
    value = parseFloat(jsonOptionTableInfo.quote.ask)
    document.querySelector('#ask').innerHTML = value.toFixed(2)  
    value = parseFloat(jsonOptionTableInfo.quote.vl)
    document.querySelector('#vl').innerHTML = value.toFixed(2)  
    value = parseFloat(jsonOptionTableInfo.quote.openinterest)
    document.querySelector('#openinterest').innerHTML = value.toFixed(2)     
    
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
    let table = my_url.searchParams.get("e").toUpperCase();

//  Find this option in the option table
    option_table = null;
    if (table == 'FAR') 
        option_table = jsonOptionTable.Item.info.option_table_far
    else
        option_table = jsonOptionTable.Item.info.option_table_near
    
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
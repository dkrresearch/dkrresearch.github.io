
async function loadPositionsData() {
    let strike_margin = 0.0
    let total_var = 0.0
    let current_value = 0.0
    let total_roa = 1.0
    let total_prem = 0.0

    document.querySelector('#wait_status').innerHTML = "... Downloading Open Positions ...";
    let jsonInfo = await fetchPositionsInfo();
    if ((jsonInfo == null) || (jsonInfo.hasOwnProperty("Items") == false)) {      
        return loadError("Unable to load Positions Table")
    }

    let table = jsonInfo.Items;

    let divTable = document.getElementById("open_positions_table");
    for (var key in table) {
        uuid = table[key]['id']
        position_info = table[key]['info']
        if  (position_info['assigned'] == true)
            continue

        let template = get_template()
        template = template.replace("{$symbol}",position_info['symbol'])
        template = template.replace("{$symbol_}",position_info['symbol'])
        template = template.replace("{$option_symbol}",position_info['quote_symbol'])
        template = template.replace("{$expiration}",position_info['expiration_date'])
        template = template.replace("{$strike}",position_info['strike_price'])
        template = template.replace("{$contracts}",position_info['contracts'])

        let jsonOptionInfo = await fetchOptionTable(position_info['symbol']);
        let jsonOptionTableInfo = findOptionInfo(jsonOptionInfo,position_info['quote_symbol']);

        template = template.replace("{$dte}",jsonOptionTableInfo['dte'])
        value = (100.0 * jsonOptionTableInfo['chance_of_loss'])
        template = template.replace("{$coa}",value.toFixed(2))
        value = (100.0 * jsonOptionTableInfo['discount'])
        template = template.replace("{$discount}",value.toFixed(0))
        if ( value < 0) 
            template = template.replace("{$red}","color:rgb(145, 35, 35)")
        else
            template = template.replace("{$red}",'')

        if (jsonOptionTableInfo['0'] == 0){
            template = template.replace("{$e}","near")
        } else {
            template = template.replace("{$e}","far")
        }

        total_roa = total_roa * (1.0 - jsonOptionTableInfo['chance_of_loss'])

        value_at_risk = jsonOptionTableInfo['var'] * position_info['contracts']
        total_var += value_at_risk

        let quote = jsonOptionTableInfo['quote']
        let ask = position_info['open_price']
        if (quote != null) 
            ask = quote['ask'] - 0.01
            
        let contracts = position_info['contracts']
        let open_price = position_info['open_price']
        total_prem += contracts * 100.0 * open_price
        let cv = contracts * 100.0 * (open_price -  ask)
        current_value += cv

        if (value_at_risk <= 0){
            template = template.replace("{$var}",0)
        } else if (value_at_risk < 1000) {
            template = template.replace("{$var}","$" + value_at_risk.toFixed(0))
        } else {
            value = value_at_risk / 1000.0
            template = template.replace("{$var}","$" + value.toFixed(0) + "K")
        }

        strike_margin += position_info['contracts'] * 100.0 * position_info['strike_price']

        let ele = htmlToElement(template);
        divTable.appendChild(ele);
    }
    
    
    value = (1.0 - total_roa) * 100.0
    document.querySelector('#total_roa').innerHTML = value.toFixed(0) + "%"
    document.querySelector('#total_var').innerHTML = "$" + (total_var / 1000).toFixed(0) +"K"
    document.querySelector('#total_prem').innerHTML = "$" + (total_prem).toFixed(0)

    

    if (current_value < 0) {
        document.querySelector('#current_value').style.color = "rgb(145, 35, 35)"
    }
    document.querySelector('#current_value').innerHTML = "$" + current_value.toFixed(0)

//    document.querySelector('#strike_margin').innerHTML = "$" + strike_margin.toFixed(0)
    document.querySelector('#wait').remove();
    document.querySelector('#contents').style.visibility = "visible";
}

function get_template() {
    let block = '\
    <div class="positions_table_row">\
        <div class="positions_table_col_1">\
            <h1><a href="/position.html?symbol={$symbol_}&option_symbol={$option_symbol}&e={$e}">\
                <span id="symbol">{$symbol}</span> <span id="expiration">{$expiration}</span> <span id="strike">{$strike}</span> Put\
                </a></h1>\
            <h2><span id="dte">{$dte}</span> Days to expiration</h2>\
            <p></p>\
        </div>\
        <div class="positions_table_col_2">\
            <h1> </h1>\
            <h2><span id="contracts">{$contracts}</span> Contracts</h2>\
        </div>\
        <div class="positions_table_col_3">\
            <div class="coa_box">\
                <div class="coa_header">ROA</div>\
                <h1 class="coa">{$coa}%</h1>\
            </div>\
            <div class="coa_box">\
                <div class="coa_header">VaR</div>\
                <h1 class="coa">{$var}</h1>\
            </div>\
            <div class="coa_box">\
                <div class="coa_header">Discount</div>\
                <h1 class="coa" style="{$red}">{$discount}%</h1>\
            </div>\
        </div>\
    </div>';
    return block
}
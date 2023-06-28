
async function loadPositionsData() {
    let current_value = 0.0
    let total_cop = 1.0
    let total_prem = 0.0
    let total_value = 0.0

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
        if (position_info['assigned'] == true)
            continue
        if (('option_type' in position_info) == false)  //  legacy short_put
            continue
        if (position_info['option_type'] != "long_call")
            continue
            
        let contracts = parseFloat(position_info['contracts'])
        let open_price = parseFloat(position_info['open_price'])
        let commisions = parseFloat(position_info['commisions'])

        total_prem += (contracts * 100.0 * open_price) + commisions
        
        let template = get_template()
        template = template.replace("{$symbol}",position_info['symbol'])
        template = template.replace("{$symbol_}",position_info['symbol'])
        template = template.replace("{$option_symbol}",position_info['quote_symbol'])
        template = template.replace("{$expiration}",position_info['expiration_date'])
        template = template.replace("{$strike}",position_info['strike_price'])
        template = template.replace("{$contracts}",position_info['contracts'])

        let jsonOptionInfo = await fetchOptionTable(position_info['symbol']);
        let jsonOptionTableInfo = findOptionInfo(jsonOptionInfo,position_info['quote_symbol']);
        if (jsonOptionTableInfo != null) {
            template = template.replace("{$dte}",jsonOptionTableInfo['dte'])

            value = parseFloat(jsonOptionTableInfo.chance_of_payout) * 100.0
            template = template.replace("{$cop}",value.toFixed(2))
            total_cop = total_cop * (1.0 - parseFloat(jsonOptionTableInfo.chance_of_payout))

            let discount = ''
            value = (100.0 * jsonOptionTableInfo['discount'])
            if ( value > 0) {
                discount = value.toFixed(1)
                template = template.replace("{$red}","color:rgb(145, 35, 35)")
            } else {
                discount = "+" + (value * -1.0).toFixed(1)
                template = template.replace("{$red}",'')
            }
            template = template.replace("{$discount}",discount)

            if (jsonOptionTableInfo['0'] == 0){
                template = template.replace("{$e}","near")
            } else {
                template = template.replace("{$e}","far")
            }


            let mark = open_price
            let quote = jsonOptionTableInfo['quote']
            if (quote != null) 
                mark = quote['sell_price']
            let cv = contracts * 100.0 * (mark - open_price)

            template = template.replace("{$cv}",printUSD(cv))
            current_value += cv
        } else {
            template = template.replace("{$dte}",'--')
            template = template.replace("{$cop}",'--')
            template = template.replace("{$cv}",'---')
            template = template.replace("{$discount}",'---')
        }

        let ele = htmlToElement(template);
        divTable.appendChild(ele);
    }
    
    value = (1.0 - total_cop) * 100.0
    document.querySelector('#total_cop').innerHTML = value.toFixed(0) + "%"

    if (current_value < 0) 
        document.querySelector('#current_value').style.color = "rgb(145, 35, 35)"
    document.querySelector('#current_value').innerHTML = printUSD(current_value)
 
    document.querySelector('#total_prem').innerHTML = printUSD(total_prem)

//    document.querySelector('#strike_margin').innerHTML = "$" + strike_margin.toFixed(0)
    document.querySelector('#wait').remove();
    document.querySelector('#contents').style.visibility = "visible";
}

function get_template() {
    let block = '\
    <div class="positions_table_row">\
        <div class="positions_table_col_1">\
            <h1><a href="/long_call/position.html?symbol={$symbol_}&option_symbol={$option_symbol}&e={$e}">\
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
                <div class="coa_header">PoP</div>\
                <h1 class="coa">{$cop}%</h1>\
            </div>\
            <div class="coa_box">\
                <div class="coa_header">P/L</div>\
                <h1 class="coa">{$cv}</h1>\
            </div>\
            <div class="coa_box">\
                <div class="coa_header">Discount</div>\
                <h1 class="coa" style="{$red}">{$discount}%</h1>\
            </div>\
        </div>\
    </div>';
    return block
}
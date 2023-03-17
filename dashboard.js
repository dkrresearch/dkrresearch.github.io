
async function loadDashboardData() {
    let jsonStatus = await fetchStatus(2023);

    let total_profit = jsonStatus['profit']
    let bs_reserves = jsonStatus['bs_premium']
    let carried_losses = jsonStatus['carried_losses']

    let total_cnt = jsonStatus['cnt_positions']
    let num_assignments = jsonStatus['cnt_assignments']
    let assignment_rate = (100.0 * num_assignments) / total_cnt

    document.querySelector('#total_profit').innerHTML = "$" + total_profit.toFixed(0)
    if (total_profit < 0) 
        document.querySelector('#total_profit').style.color = "rgb(145, 35, 35)"

    document.querySelector('#carried_losses').innerHTML = "$" + carried_losses.toFixed(0)
    if (carried_losses < 0) 
        document.querySelector('#carried_losses').style.color = "rgb(145, 35, 35)"

    document.querySelector('#bs_reserves').innerHTML = "$" + bs_reserves.toFixed(0)


    let divTable = document.getElementById("open_positions_table");
    let current_value = 0.0
    let total_roa = 1.0
    let total_var = 0.0
    jsonInfo = await fetchPositionsInfo();
    table = jsonInfo.Items
    for (var key in table) {
        let uuid = table[key]['id']
        let position_info = table[key]['info']
        if  (position_info['assigned'] == true)
            continue

        let contracts = position_info['contracts']
        let open_price = position_info['open_price']

        let jsonOptionInfo = await fetchOptionTable(position_info['symbol']);
        let jsonOptionTableInfo = findOptionInfo(jsonOptionInfo,position_info['quote_symbol']);

        let ask = open_price
        if (jsonOptionTableInfo['quote'] != null)
            ask = jsonOptionTableInfo['quote']['ask'] - 0.01
        
        let cv = contracts * 100.0 * (open_price -  ask)
        current_value += cv

        total_roa = total_roa * (1.0 - jsonOptionTableInfo['chance_of_loss'])

        value_at_risk = jsonOptionTableInfo['var'] * contracts
        total_var += value_at_risk

        template = get_template()
        template = template.replace("{$symbol}",position_info['symbol'])
        template = template.replace("{$symbol_}",position_info['symbol'])
        template = template.replace("{$expiration}",position_info['expiration_date'])
        template = template.replace("{$option_symbol}",position_info['quote_symbol'])
        template = template.replace("{$strike}",position_info['strike_price'])
        value = (100.0 * jsonOptionTableInfo['chance_of_loss'])
        template = template.replace("{$coa}",value.toFixed(2))

        value = (100.0 * jsonOptionTableInfo['discount'])
        template = template.replace("{$discount}",value.toFixed(0))
        if ( value < 0) 
            template = template.replace("{$red}","color:rgb(145, 35, 35)")
        else
            template = template.replace("{$red}",'')

        if (value_at_risk <= 0){
            template = template.replace("{$var}",0)
        } else if (value_at_risk < 1000) {
            template = template.replace("{$var}","$" + value_at_risk.toFixed(0))
        } else {
            value = value_at_risk / 1000.0
            template = template.replace("{$var}","$" + value.toFixed(0) + "K")
        }

        ele = htmlToElement(template);
        divTable.appendChild(ele);    
    }

    value = (1.0 - total_roa) * 100.0
    document.querySelector('#total_roa').innerHTML = value.toFixed(0) + "%"

    console.log(total_var)
    document.querySelector('#total_var').innerHTML = "$" + (total_var / 1000.0).toFixed(0) + "K"

    if (current_value < 0) {
        document.querySelector('#current_value').style.color = "rgb(145, 35, 35)"
    }
    document.querySelector('#current_value').innerHTML = "$" + current_value.toFixed(0)

    document.querySelector('#wait').remove();
    document.querySelector('#contents').style.visibility = "visible";
}
 

function get_template() {
    block = '\
    <div class="positions_table_row">\
        <div class="positions_table_col_1">\
            <h1><a href="/position.html?symbol={$symbol_}&option_symbol={$option_symbol}">\
                <span id="symbol">{$symbol}</span> <span id="expiration">{$expiration}</span> <span id="strike">{$strike}</span> Put\
                </a></h1>\
            <p></p>\
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
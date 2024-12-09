
async function loadDashboardData() {
    let jsonStatus = await fetchStatus(globalCurrentYear);
    jsonAlgos = jsonStatus['algos']
    console.log(jsonStatus)
    
    let current_value = 0.0
    let total_profit = 0
    let total_bs_reserves = 0.0
    let total_carried_risk = 0.0
    let total_var = 0.0
    let total_roa = 1.0

//  Short Put Stats
    let short_put_current_profit = 0.0
    total_profit += jsonAlgos['short_put']['profit']
    total_bs_reserves += jsonAlgos['short_put']['bs_premium']
    total_carried_risk += jsonAlgos['short_put']['carried_losses']

    document.querySelector('#short_put_ytd_profit').innerHTML = printUSD( jsonAlgos['short_put']['profit'] )
    document.querySelector('#short_put_carried_risk').innerHTML = printUSD( jsonAlgos['short_put']['carried_losses'] )
    
    let total_cnt = jsonAlgos['short_put']['cnt_positions'] + 1e-6
    let num_assignments = jsonAlgos['short_put']['cnt_assignments']
    let assignment_rate = (100.0 * num_assignments) / total_cnt
    document.querySelector('#short_put_assignment_rate').innerHTML = assignment_rate.toFixed(2) + '%'

//  Short Call Stats
    let short_call_current_profit = 0.0
    total_profit += jsonAlgos['short_call']['profit']
    total_bs_reserves += jsonAlgos['short_call']['bs_premium']
    total_carried_risk += jsonAlgos['short_call']['carried_losses']

    document.querySelector('#short_call_ytd_profit').innerHTML = printUSD( jsonAlgos['short_call']['profit'] )
    document.querySelector('#short_call_carried_risk').innerHTML = printUSD( jsonAlgos['short_call']['carried_losses'] )
    
    total_cnt = jsonAlgos['short_call']['cnt_positions'] + 1e-3
    num_assignments = jsonAlgos['short_call']['cnt_assignments']
    assignment_rate = (100.0 * num_assignments) / total_cnt
    document.querySelector('#short_call_assignment_rate').innerHTML = assignment_rate.toFixed(2) + '%'

//  Long Put Stats
    let long_put_current_profit = 0.0
    total_profit += jsonAlgos['long_put']['profit']
    total_carried_risk -= jsonAlgos['long_put']['carried_gains']

    document.querySelector('#long_put_ytd_profit').innerHTML = printUSD( jsonAlgos['long_put']['profit'] )

    total_cnt = jsonAlgos['long_put']['cnt_positions'] + 1e-6
    num_assignments = jsonAlgos['long_put']['cnt_assignments']
    assignment_rate = (100.0 * num_assignments) / total_cnt
    document.querySelector('#long_put_assignment_rate').innerHTML = assignment_rate.toFixed(2) + '%'

//  Long Call Stats
    let long_call_current_profit = 0.0
    total_profit += jsonAlgos['long_call']['profit']
    total_carried_risk -= jsonAlgos['long_call']['carried_gains']

    document.querySelector('#long_call_ytd_profit').innerHTML = printUSD( jsonAlgos['long_call']['profit'] )
    
    total_cnt = jsonAlgos['long_call']['cnt_positions'] + 1e-6
    num_assignments = jsonAlgos['long_call']['cnt_assignments']
    assignment_rate = (100.0 * num_assignments) / total_cnt
    document.querySelector('#long_call_assignment_rate').innerHTML = assignment_rate.toFixed(2) + '%'




//  Earnings Put Stats
    let short_earnings_put_current_profit = 0.0
    total_profit += jsonAlgos['short_earnings_put']['profit']
    total_bs_reserves += jsonAlgos['short_earnings_put']['bs_premium']
    total_carried_risk += jsonAlgos['short_earnings_put']['carried_losses']

    document.querySelector('#short_earnings_put_ytd_profit').innerHTML = printUSD( jsonAlgos['short_earnings_put']['profit'] )
    document.querySelector('#short_earnings_put_carried_risk').innerHTML = printUSD( jsonAlgos['short_earnings_put']['carried_losses'] )

    total_cnt = jsonAlgos['short_earnings_put']['cnt_positions'] + 1e-6
    num_assignments = jsonAlgos['short_earnings_put']['cnt_assignments']
    assignment_rate = (100.0 * num_assignments) / total_cnt
    document.querySelector('#short_earnings_put_assignment_rate').innerHTML = assignment_rate.toFixed(2) + '%'


//  Short Call Stats
    let short_earnings_call_current_profit = 0.0
    total_profit += jsonAlgos['short_earnings_call']['profit']
    total_bs_reserves += jsonAlgos['short_earnings_call']['bs_premium']
    total_carried_risk += jsonAlgos['short_earnings_call']['carried_losses']

    document.querySelector('#short_earnings_call_ytd_profit').innerHTML = printUSD( jsonAlgos['short_earnings_call']['profit'] )
    document.querySelector('#short_earnings_call_carried_risk').innerHTML = printUSD( jsonAlgos['short_earnings_call']['carried_losses'] )

    total_cnt = jsonAlgos['short_earnings_call']['cnt_positions'] + 1e-3
    num_assignments = jsonAlgos['short_earnings_call']['cnt_assignments']
    assignment_rate = (100.0 * num_assignments) / total_cnt
    document.querySelector('#short_earnings_call_assignment_rate').innerHTML = assignment_rate.toFixed(2) + '%'


//  Totals
    document.querySelector('#total_profit').innerHTML = "$" + total_profit.toFixed(0)
    if (total_profit < 0) 
        document.querySelector('#total_profit').style.color = "rgb(145, 35, 35)"

    document.querySelector('#carried_losses').innerHTML = "$" + total_carried_risk.toFixed(0)
    if (carried_losses < 0) 
        document.querySelector('#carried_losses').style.color = "rgb(145, 35, 35)"

    document.querySelector('#bs_reserves').innerHTML = "$" + total_bs_reserves.toFixed(0)

    document.querySelector('#wait').remove();
    document.querySelector('#contents').style.visibility = "visible";
    return

//  Opened Positions
    jsonInfo = await fetchPositionsInfo();
    table = jsonInfo.Items
    for (var key in table) {
        let uuid = table[key]['id']
        let position_info = table[key]['info']
        if  (position_info['assigned'] == true)
            continue

        console.log( position_info )
        let jsonOptionInfo = await fetchOptionTable(position_info['symbol']);
        let jsonOptionTableInfo = findOptionInfo(jsonOptionInfo,position_info['quote_symbol']);
        if (jsonOptionTableInfo != null) {
            console.log( jsonOptionTableInfo )
            let quote = jsonOptionTableInfo['quote']
            let buy_price = position_info['open_price']
            if (quote != null) 
                buy_price = quote['buy_price']
            let sell_price = position_info['open_price']
            if (quote != null) 
                sell_price = quote['sell_price']
    
            if  (('option_type' in position_info) && (position_info['option_type'] == "short_put")) {
                let contracts = position_info['contracts']
                let open_price = position_info['open_price']
                let cv = contracts * 100.0 * (open_price - buy_price)
                current_value += cv
                short_put_current_profit += cv

                let value_at_risk = jsonOptionTableInfo['var'] * position_info['contracts']
                total_var += value_at_risk

                total_roa = total_roa * (1.0 - jsonOptionTableInfo['chance_of_loss'])
            }

            if  (('option_type' in position_info) && (position_info['option_type'] == "short_call")) {
                let contracts = position_info['contracts']
                let open_price = position_info['open_price']
                let cv = contracts * 100.0 * (open_price - buy_price)
                current_value += cv
                short_call_current_profit += cv

                total_roa = total_roa * (1.0 - jsonOptionTableInfo['chance_of_loss'])
            }

            if  (('option_type' in position_info) && (position_info['option_type'] == "long_call")) {
                let contracts = position_info['contracts']
                let open_price = position_info['open_price']
                let cv = contracts * 100.0 * (sell_price - open_price)
                current_value += cv
                long_call_current_profit += cv
            }
        }
    }

    document.querySelector('#short_put_current_profit').innerHTML = printUSD( short_put_current_profit )
    document.querySelector('#long_call_current_profit').innerHTML = printUSD( long_call_current_profit )
    document.querySelector('#short_call_current_profit').innerHTML = printUSD( short_call_current_profit )


    let divTable = document.getElementById("open_positions_table");
    let current_value_ex = 0.0
    let total_roa_ex = 1.0
    let total_var_ex = 0.0
    jsonInfo = await fetchPositionsInfo();
    table = jsonInfo.Items
    for (var key in table) {
        let uuid = table[key]['id']
        let position_info = table[key]['info']
        if  (position_info['assigned'] == true)
            continue
        if  (('option_type' in position_info) && (position_info['option_type'] != "short_put"))
            continue

        let contracts = position_info['contracts']
        let open_price = position_info['open_price']

        template = get_template()
        template = template.replace("{$symbol}",position_info['symbol'])
        template = template.replace("{$symbol_}",position_info['symbol'])
        template = template.replace("{$expiration}",position_info['expiration_date'])
        template = template.replace("{$option_symbol}",position_info['quote_symbol'])
        template = template.replace("{$strike}",position_info['strike_price'])

        let jsonOptionInfo = await fetchOptionTable(position_info['symbol']);
        let jsonOptionTableInfo = findOptionInfo(jsonOptionInfo,position_info['option_type'],position_info['quote_symbol']);
        if (jsonOptionTableInfo != null) {
            let ask = open_price
            if (jsonOptionTableInfo['quote'] != null)
                ask = jsonOptionTableInfo['quote']['ask'] - 0.01
            
            let cv = contracts * 100.0 * (open_price -  ask)
            current_value += cv

            total_roa = total_roa * (1.0 - jsonOptionTableInfo['chance_of_loss'])

            value_at_risk = jsonOptionTableInfo['var'] * contracts
            total_var += value_at_risk

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
            } else {
                template = template.replace("{$var}",printUSD(value_at_risk))
            }
        } else {
            template = template.replace("{$var}","---")
            template = template.replace("{$coa}","---")
            template = template.replace("{$discount}","---")

        }

        ele = htmlToElement(template);
        divTable.appendChild(ele);    
    }

    value = (1.0 - total_roa) * 100.0
    document.querySelector('#total_roa').innerHTML = value.toFixed(0) + "%"

    console.log(total_var)
    document.querySelector('#total_var').innerHTML = printUSD(total_var)

    document.querySelector('#current_value').innerHTML = printUSD(current_value)

    document.querySelector('#wait').remove();
    document.querySelector('#contents').style.visibility = "visible";
}
 

function get_template() {
    block = '\
    <div class="positions_table_row">\
        <div class="positions_table_col_1">\
            <h1><a href="position.html?symbol={$symbol_}&option_symbol={$option_symbol}">\
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
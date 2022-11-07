
async function loadDashboardData() {
    let bs_reserves = 0.0
    let num_assignments = 0
    let total_profit = 0.0
    let total_cnt = 0
    let jsonInfo = await fetchHistoryInfo();
    let table = jsonInfo.Items;
    
    for (var key in table) {
        uuid = table[key]['id']
        position_info = table[key]['info']

        total_cnt += 1

        profit = position_info['profit']
        total_profit += profit

        let assigned = ''
        if (position_info['assigned'] == true) {
            num_assignments += 1
            assigned = 'Assigned'
        }

        bs_reserves += position_info["bs_premium"]
    }

    let assignment_rate = (100.0 * num_assignments) / total_cnt

    document.querySelector('#total_profit').innerHTML = "$" + total_profit.toFixed(0)
//   document.querySelector('#assignment_rate').innerHTML = assignment_rate.toFixed(2) + "%"
    document.querySelector('#bs_reserves').innerHTML = "$" + bs_reserves.toFixed(0)


    let divTable = document.getElementById("open_positions_table");
    let current_value = 0.0
    let total_roa = 1.0
    jsonInfo = await fetchPositionsInfo();
    table = jsonInfo.Items
    for (var key in table) {
        let uuid = table[key]['id']
        let position_info = table[key]['info']
        let contracts = position_info['contracts']
        let open_price = position_info['open_price']

        let jsonOptionInfo = await fetchOptionTable(position_info['symbol']);
        let jsonOptionTableInfo = findOptionInfo(jsonOptionInfo,position_info['quote_symbol']);
        let ask = jsonOptionTableInfo['quote']['ask'] - 0.01
        
        let cv = contracts * 100.0 * (open_price -  ask)
        current_value += cv

        console.log(jsonOptionTableInfo['chance_of_loss'])
        total_roa = total_roa * (1.0 - jsonOptionTableInfo['chance_of_loss'])
        console.log(total_roa)

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

        ele = htmlToElement(template);
        divTable.appendChild(ele);    
    }

    value = (1.0 - total_roa) * 100.0
    document.querySelector('#total_roa').innerHTML = value.toFixed(0) + "%"


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
                <div class="coa_header">Discount</div>\
                <h1 class="coa">{$discount}%</h1>\
            </div>\
        </div>\
    </div>';
    return block
}
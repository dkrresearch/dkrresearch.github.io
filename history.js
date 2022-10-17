
async function loadHistoryData() {
    let bs_reserves = 0.0
    let num_assignments = 0
    let total_profit = 0.0
    let total_cnt = 0
    let jsonInfo = await fetchHistoryInfo();
    let table = jsonInfo.Items;
    
    let divTable = document.getElementById("closed_positions_table");
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

        let contracts = position_info["contracts"]

        let template = get_template()
        template = template.replace("{$symbol}",position_info['symbol'])
        template = template.replace("{$expiration}",position_info['expiration_date'])
        template = template.replace("{$strike}",position_info['strike_price'])
        value = position_info['open_price'] * contracts * 100.0
        template = template.replace("{$open}",value.toFixed(2))
        value = position_info['close_price'] * contracts * 100.0
        template = template.replace("{$close}",value.toFixed(2))

        value =  position_info['open_dte'] - position_info['close_dte']
        template = template.replace("{$days_held}",value.toFixed(0))

        template = template.replace("{$assigned}",assigned)
        
        value = position_info['profit']
        template = template.replace("{$profit}",value.toFixed(2))

        ele = htmlToElement(template);
        divTable.appendChild(ele);
    }

    let assignment_rate = (100.0 * num_assignments) / total_cnt

    document.querySelector('#num_positions').innerHTML = total_cnt.toFixed(0)
    document.querySelector('#total_profit').innerHTML = "$" + total_profit.toFixed(0)
    document.querySelector('#num_assignments').innerHTML = num_assignments.toFixed(0)
    document.querySelector('#assignment_rate').innerHTML = assignment_rate.toFixed(2) + "%"
    document.querySelector('#bs_reserves').innerHTML = "$" + bs_reserves.toFixed(0)
   
    current_value = 0.0
    cnt_opened_positions = 0
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
    }
    document.querySelector('#current_value').innerHTML = "$" + current_value.toFixed(0)

    document.querySelector('#wait').remove();
    document.querySelector('#contents').style.visibility = "visible";
}


function get_template() {
    block = '\
    <div class="cp_table_row">\
    <div class="cp_table_col_1">\
        <h2>\
            <span>{$symbol}</span> <span>{$expiration}</span> <span>{$strike}</span> Put\
        </h2>\
    </div>\
    <div class="cp_table_col_2">\
        <h2><span>{$open}</span></h2>\
    </div>\
    <div class="cp_table_col_3">\
        <h2><span>{$close}</span></h2>\
    </div>\
    <div class="cp_table_col_4">\
        <h2><span>{$assigned}</span></h2>\
    </div>    \
    <div class="cp_table_col_5">\
        <h2><span>{$days_held}</span></h2>\
    </div>              \
    <div class="cp_table_col_6">\
        <h2><span>{$profit}</span></h2>\
    </div>                 \
    </div>';
    return block
}
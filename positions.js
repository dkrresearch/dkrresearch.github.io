
async function loadPositionsData() {
    let strike_margin = 0.0
    let jsonInfo = await fetchPositionsInfo();
    let table = jsonInfo.Items;

    let divTable = document.getElementById("open_positions_table");
    for (var key in table) {
        uuid = table[key]['id']
        position_info = table[key]['info']

        template = get_template()
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

        if (jsonOptionTableInfo['0'] == 0){
            template = template.replace("{$e}","near")
        } else {
            template = template.replace("{$e}","far")
        }

        strike_margin += position_info['contracts'] * 100.0 * position_info['strike_price']

        ele = htmlToElement(template);
        divTable.appendChild(ele);
    }

    document.querySelector('#strike_margin').innerHTML = "$" + strike_margin.toFixed(0)
    document.querySelector('#wait').remove();
    document.querySelector('#contents').style.visibility = "visible";
}

function get_template() {
    block = '\
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
                <div class="coa_header">Discount</div>\
                <h1 class="coa">{$discount}%</h1>\
            </div>\
        </div>\
    </div>';
    return block
}
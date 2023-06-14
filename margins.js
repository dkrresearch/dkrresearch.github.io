
var regt_values = {}
var am_values = {}
var quote_ids = {}
var selection_checkboxes = {}

async function loadPositionsData() {
    let value_at_risk
    let total_var
    let am
    let regT_value

    total_var = 0.0

    document.querySelector('#wait_status').innerHTML = "... Downloading Open Positions ...";
    jsonInfo = await fetchPositionsInfo();
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
        template = template.replace("{$key}",key)
        
        let jsonOptionInfo = await fetchOptionTable(position_info['symbol']);
        let jsonOptionTableInfo = findOptionInfo(jsonOptionInfo,position_info['quote_symbol']);
        
        template = template.replace("{$dte}",jsonOptionTableInfo['dte'])

        quote_ids[key] = jsonOptionTableInfo['quote_symbol']
        let used_margin = getCookie(quote_ids[key])
        if (used_margin == 'regt') 
            template = template.replace("{$checked}","checked")
        else
            template = template.replace("{$checked}","")

        value_at_risk = jsonOptionTableInfo['var'] * position_info['contracts']
        total_var += value_at_risk
        if (value_at_risk <= 0){
            template = template.replace("{$var}",0)
        } else if (value_at_risk < 1000) {
            template = template.replace("{$var}","$" + value_at_risk.toFixed(0))
        } else {
            let value = value_at_risk / 1000.0
            template = template.replace("{$var}","$" + value.toFixed(0) + "K")
        }
        
        am = 100 * jsonOptionTableInfo['strike_price'] * position_info['contracts']
        am_values[key] = am
        if (am <= 0){
            template = template.replace("{$am}",0)
        } else if (am < 1000) {
            template = template.replace("{$am}","$" + am.toFixed(0))
        } else {
            let value = am / 1000.0
            template = template.replace("{$am}","$" + value.toFixed(0) + "K")
        }

        regT_value = regT(jsonOptionTableInfo,position_info)
        regt_values[key] = regT_value
        if (regT_value <= 0){
            template = template.replace("{$regt}",0)
        } else if (regT_value < 1000) {
            template = template.replace("{$regt}","$" + regT_value.toFixed(0))
        } else {
            let value = regT_value / 1000.0
            template = template.replace("{$regt}","$" + value.toFixed(0) + "K")
        }

        selection_checkboxes[key] = 'use_regt_' + key

        let ele = htmlToElement(template);
        divTable.appendChild(ele);
    }
    
    document.querySelector('#total_var').innerHTML = "$" + (total_var / 1000).toFixed(0) +"K"

    recalcMargin(null)

//    document.querySelector('#strike_margin').innerHTML = "$" + strike_margin.toFixed(0)
    document.querySelector('#wait').remove();
    document.querySelector('#contents').style.visibility = "visible";
}

function regT(jsonOptionTableInfo,position_info) {
    let otm = jsonOptionTableInfo['last_price'] - position_info['strike_price']

    let margin_1 = (0.20 * jsonOptionTableInfo['last_price']) - otm
    let margin_2 = (0.10 * position_info['strike_price'])
    let ib_margin = jsonOptionTableInfo['quote']['buy_price'] + Math.max(margin_1,margin_2)

    let margin = ib_margin * position_info['contracts'] * 100.0
    return margin
}

function recalcMargin(e) {
    let total_am = 0.0
    let total_regT = 0.0

    for (var key in selection_checkboxes) {
        checkbox_id = selection_checkboxes[key]
        let am = am_values[key]
        let regT = regt_values[key]
        let quote_id = quote_ids[key]

        if (document.getElementById(checkbox_id).checked) {
            setCookie(quote_id,"regt",60)
            total_regT += regT
        } else {
            setCookie(quote_id,"am",60)
            total_am += am
        }
    }

    document.querySelector('#total_am').innerHTML = "$" + (total_am / 1000).toFixed(0) +"K"
    document.querySelector('#total_regt').innerHTML = "$" + (total_regT / 1000).toFixed(0) +"K"
}

function get_template() {
    let block = '\
    <div class="positions_table_row">\
        <div class="positions_table_col_1">\
            <h1><a href="/position.html?symbol={$symbol_}&option_symbol={$option_symbol}&e={$e}">\
                <span id="symbol">{$symbol}</span> <span id="expiration">{$expiration}</span> <span id="strike">{$strike}</span> Put\
                </a></h1>\
            <h2><span id="dte">{$dte}</span> Days to expiration</h2>\
        </div>\
        <div class="positions_table_col_2">\
            <h1> </h1>\
            <input type="checkbox" style="accent-color: rgb(0, 141, 129);" id="use_regt_{$key}" onchange="recalcMargin(event)" {$checked}>\
        </div>\
        <div class="positions_table_col_3">\
            <div class="coa_box">\
                <h1 class="coa">{$var}</h1>\
            </div>\
            <div class="coa_box">\
                <h1 class="coa">{$regt}</h1>\
            </div>\
            <div class="coa_box">\
                <h1 class="coa">{$am}</h1>\
            </div>\
        </div>\
    </div>';
    return block
}
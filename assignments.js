
async function loadPositionsData() {
    let divTable = document.getElementById("open_positions_table");


    let template = get_template()

    template = template.replaceAll("{$symbol}","SYM")
    template = template.replaceAll("{$strike}","888")
    template = template.replaceAll("{$expiration}","2023-3-17")
    template = template.replaceAll("{$shares}","600")
    template = template.replaceAll("{$price}","$1888.88")
    template = template.replaceAll("{$close_price}","1888.88")
    template = template.replaceAll("{$discount}","-88.8%")
    template = template.replaceAll("{$profit}","$-28,888")
    
    let profit = -28888.00
    if (profit < 0) {
        template = template.replaceAll("{$red}","color:rgb(145, 35, 35);")
    } else {
        template = template.replaceAll("{$red}","")
    }


    let ele = htmlToElement(template);
    divTable.appendChild(ele);

    document.querySelector('#wait').remove();
    document.querySelector('#contents').style.visibility = "visible";
}

function get_template() {
    let block = '\
    <div class="positions_table_row">\
    <div class="positions_table_col_1">\
        <h1><span id="symbol">{$symbol}</span> <span id="expiration">{$expiration}</span> <span id="strike">{$strike}</span></h1>\
    </div>\
    <div class="positions_table_col_2">\
        <h1></h1>\
        <h2><span id="shares">{$shares}</span> Shares</h2>\
    </div>\
    <div class="positions_table_col_3">\
        <div class="details_table_row" style="margin-bottom:12px;"><span class="details_table_col1">Current Price :</span>\
            <span  class="details_table_col2" id="details_price">{$price}</span></div>\
        <div class="details_table_row"  style="margin-bottom:12px;"><span class="details_table_col1">Discount :</span>\
            <span  class="details_table_col2" id="details_discount" style="{$red}">{$discount}</span></div>    \
        <div class="details_table_row"  style="margin-bottom:12px;"><span class="details_table_col1">Profit :</span>\
            <span  class="details_table_col2" id="details_profit" style="{$red}">{$profit}</span></div>              \
    </div>\
    <div class="positions_table_col_4" style="float:right; width:30%; border:1px solid rgb(0, 141, 129);">\
        <div style="width:100%; background-color:rgb(0, 141, 129); text-align:center; color:white;">Close</div>\
        <div class="details_table_row" style="height:30px; border-bottom:none">\
            <span style="height:20px;" class="details_table_col1">Close Price :</span>\
            <input type="text" id="close_price" class="input_label" value="{$close_price}"></input></div>\
        <div class="details_table_row" style="height:30px; margin-top:0px; border-bottom:none;">\
            <span style="height:20px;" class="details_table_col1">Commission :</span>\
            <input type="text" id="close_commision_price" class="input_label" value="0.00"></input></div>\
        <hr style="width:80%; margin-top:10px; margin-left:10%; color:gray"/>\
        <div class="details_table_row" style="height:30px; margin-top:0px; border-bottom:none;">\
            <span style="height:20px;" class="details_table_col1">Profit :</span>\
            <span class="details_table_col2" id="close_profit"  style="{$red}">{$profit}</span>\
        </div>\
        <button class="input_button" id="close_button" onclick="onClosePosition()">Close Position</button>\
    </div>\
    </div>\
    ';
    return block
}
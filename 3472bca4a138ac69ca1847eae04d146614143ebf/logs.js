
async function loadLogData() {
    let ele
    let template
    
    document.querySelector('#wait_status').innerHTML = "... Downloading Logs Table ...";

    let expirations = await fetchLogs()
    expirations.Items.sort((a,b) => a.expiration - b.expiration);
    let len = expirations.Items.length

    let my_url = new URL(window.location.href);
    let idx_param = my_url.searchParams.get("idx");
    if (idx_param == null)
        idx_param = len - 2

    let divHistory = document.getElementById("history_table");;
    for (let i = len-1; i>=0; i--) {
        let expiration = expirations.Items[i].expiration
        let yr = expiration.toString().substring(0, 4)
        let month = expiration.toString().substring(4, 6)

        template = getHistoryTableRow()
        template = template.replace("{$idx}",i)
        template = template.replace("{$strike}", yr + '-' + month)

        if (i == idx_param) 
            template = template.replace("&#x2022;", '&#9654;')
             
        ele = htmlToElement(template);
        divHistory.appendChild(ele);
    }

    let divTable = null;
    let log_table = await fetchLogTable( expirations.Items[idx_param].expiration )

    let year = log_table.Item.info.year
    let month = log_table.Item.info.month
    let day = log_table.Item.info.day
    let expiration_date = year + "-" + month + "-" + day

    document.querySelector('#prediction_logs_near').innerHTML = "Prediction logs for " + expiration_date
    divTable = document.getElementById("log_table_near");

    console.log( log_table )

    //  Legacy support everything before 2023-06 uses log_table.Item.info.symbols
    short_puts = []
    if (log_table.Item.info.hasOwnProperty('short_puts') == true)
        short_puts = log_table.Item.info.short_puts
    else if (log_table.Item.info.hasOwnProperty('symbols') == true)
        short_puts = log_table.Item.info.symbols
    
    for (let s=0; s<short_puts.length; s++) {
        console.log(short_puts)
        symbolInfo = short_puts[s]

        template = getSymbolTable()
        template = template.replace("{$symbol}",symbolInfo['entry']['symbol'])
        template = template.replace("{$table_name}","table_" + symbolInfo['entry']['symbol'])
        
        let last_price = symbolInfo['entry']['last_price']
        template = template.replace("{$price}",last_price.toFixed(2))

        let assignments_rows = '';
        for (let a=0; a<symbolInfo.assignments.length; a++) {
            let assignment = symbolInfo.assignments[a]

            row = getAssignmentRow()
            row = row.replace("{$strike}",assignment['strike'].toFixed(2))
            row = row.replace("{$dte}",assignment['dte'])
            row = row.replace("{$depth}",'')
            row = row.replace("{$roa}",assignment['roa'].toFixed(3))
            row = row.replace("{$discnt}",assignment['discount'].toFixed(2))
            row = row.replace("{$pov}",assignment['prem_over_var'].toFixed(2))
            row = row.replace("{$por}",assignment['price_over_risk'].toFixed(2))
            row = row.replace("{$g1}",(assignment['g1']).toFixed(2))

            let loss = 100.0 * (last_price - assignment['strike']) / assignment['strike']
            let szLoss = loss.toFixed(2)
            if (loss < 0)
                szLoss = "<span style='color:red;'>" + loss.toFixed(2) + "</span>"
            row = row.replace("{$loss}",szLoss)

            assignments_rows += row
        }
        template = template.replace("{$assignments}",assignments_rows)

        ele = htmlToElement(template);
        divTable.appendChild(ele);
    }

    document.querySelector('#wait').remove();
    document.querySelector('#contents').style.visibility = "visible";
}

function getHistoryTableRow() {
    let template = "<div class='history_entry'><span style='display:inline-block; width:13px;'>&#x2022; </span><a href='logs.html?idx={$idx}'>{$strike}</a></div>"
    return template
}

function getSymbolTable() {
    let template = "<div style='width:100%; float:left; margin-bottom:25px;'>\
            <div style='width:100%; float:left;'>\
                <h1 style='width:75px; float:left; color:rgb(0,160,147); margin-left:0px;'>{$symbol}</h1><br/><div style='width:25%; float:left;'>Current Price : {$price}</div>\
            </div>\
            <div style='width:100%; float:left; margin-top:10px;'>\
                <div style='width:75px; float:left;'>Strike</div>\
                <div style='width:75px; float:left; text-align:right;'>DTE</div>\
                <div style='width:75px; float:left; text-align:right;'>Loss (%)</div>\
                <div style='width:75px; float:left; text-align:right;'>ROA (%)</div>\
                <div style='width:75px; float:left; text-align:right;'>Discnt (%)</div>\
                <div style='width:75px; float:left; text-align:right;'>Prem/VaR</div>\
                <div style='width:75px; float:left; text-align:right;'>Price/Risk</div>\
                <div style='width:75px; float:left; text-align:right;'>g1 (%)</div>\
            </div>\
            <hr style='width:675px; float:left;'/>\
            <div id='{$table_name}' class='symbol_table'>\
                {$assignments}\
            </div>\
        </div>"
    return template;
}


function getAssignmentRow() {
    let template = "\
            <div style='width:100%; float:left; margin-top:5px;'>\
                <div style='width:75px; float:left;'>{$strike}</div>\
                <div style='width:75px; float:left; text-align:right;'>{$dte}</div>\
                <div style='width:75px; float:left; text-align:right;'>{$depth}</div>\
                <div style='width:75px; float:left; text-align:right;'>{$loss}</div>\
                <div style='width:75px; float:left; text-align:right;'>{$roa}</div>\
                <div style='width:75px; float:left; text-align:right;'>{$discnt}</div>\
                <div style='width:75px; float:left; text-align:right;'>{$pov}</div>\
                <div style='width:75px; float:left; text-align:right;'>{$por}</div>\
                <div style='width:75px; float:left; text-align:right;'>{$g1}</div>\
            </div>"
    return template;
}


async function fetchLogs() {
    let info_url = 'https://efd6n53bol.execute-api.us-west-1.amazonaws.com/log-results'

    console.log(info_url)
    try {
        let res = await fetch(info_url);
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

async function fetchLogTable(expiration) {
    let my_url = new URL(window.location.href);
    let info_url = 'https://efd6n53bol.execute-api.us-west-1.amazonaws.com/log-results/' + expiration

    console.log(info_url)
    try {
        let res = await fetch(info_url);
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

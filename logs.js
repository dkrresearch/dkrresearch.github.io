
async function loadLogData() {
    document.querySelector('#wait_status').innerHTML = "... Downloading Logs Table ...";

    expirations = await fetchLogs()
    expirations.Items.sort((a,b) => a.expiration - b.expiration);

    let len = expirations.Items.length
    for (let i = 0; i<2; i++) {
        let divTable = null;
        let log_table = await fetchLogTable( expirations.Items[len - 1 - i].expiration )
        console.log(log_table)

        let year = log_table.Item.info.year
        let month = log_table.Item.info.month
        let day = log_table.Item.info.day
        let expiration_date = year + "-" + month + "-" + day

        if (i == 0) {
            document.querySelector('#prediction_logs_far').innerHTML = "Prediction logs for " + expiration_date
            divTable = document.getElementById("log_table_far");
        }
        if (i == 1) {
            document.querySelector('#prediction_logs_near').innerHTML = "Prediction logs for "  + expiration_date
            divTable = document.getElementById("log_table_near");
        }

        console.log(log_table)
        for (let s=0; s<log_table.Item.info.symbols.length; s++) {
            symbolInfo = log_table.Item.info.symbols[s]
            console.log(symbolInfo)

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
                row = row.replace("{$depth}",assignment['depth'])
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
    }

    document.querySelector('#wait').remove();
    document.querySelector('#contents').style.visibility = "visible";
}


function getSymbolTable() {
    let template = "<div style='width:100%; float:left; margin-bottom:25px;'>\
            <div style='width:100%; float:left;'>\
                <h1 style='width:75px; float:left; color:rgb(0,160,147); margin-left:0px;'>{$symbol}</h1><br/><div style='width:15%; float:left;'>Current Price : {$price}</div>\
            </div>\
            <div style='width:100%; float:left; margin-top:10px;'>\
                <div style='width:75px; float:left;'>Strike</div>\
                <div style='width:75px; float:left; text-align:right;'>DTE</div>\
                <div style='width:75px; float:left; text-align:right;'>Depth</div>\
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
    let my_url = new URL(window.location.href);
    let info_url = 'https://efd6n53bol.execute-api.us-west-1.amazonaws.com/log-results'
    try {
        let res = await fetch(info_url);
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

async function fetchLogTable(expiration) {
    console.log(expiration)

    let my_url = new URL(window.location.href);
    let info_url = 'https://efd6n53bol.execute-api.us-west-1.amazonaws.com/log-results/' + expiration
    try {
        let res = await fetch(info_url);
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

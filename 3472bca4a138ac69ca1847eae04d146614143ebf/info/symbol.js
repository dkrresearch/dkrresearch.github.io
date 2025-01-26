var jsonInfo = null;
var jsonEarnings = null;

function find_verified_earnings_data(reported) {
    let verified_earnings_data = jsonEarnings.Item.info.verified_earnings_data
    let cnt = verified_earnings_data.length
    for (let i = 0; i < cnt; i++) {
        if (verified_earnings_data[i]['reportedDate'] == reported['reportedDate']) {
            return verified_earnings_data[i];
        }
    }

    verified_earnings_data[cnt] = {}
    verified_earnings_data[cnt]['reportedDate'] = reported['reportedDate'];
    verified_earnings_data[cnt]['actualDate'] = reported['reportedDate'];
    verified_earnings_data[cnt]['actualTime'] = reported['reportTime'];
    verified_earnings_data[cnt]['verifed'] = false;

    return verified_earnings_data[cnt]
}

async function loadSymbolData() {
    jsonInfo = await fetchSymbolInfo();
    if ((jsonInfo == null) || (jsonInfo.hasOwnProperty("Item") == false)) {
        let my_url = new URL(window.location.href);
        let symbol = my_url.searchParams.get("symbol").toUpperCase();        
        return loadError(symbol + " - Symbol Not Found")
    }
    console.log(jsonInfo)

    symbol = jsonInfo.Item.symbol
    document.querySelector('#title').innerHTML = "DKR Research : " + symbol 
    document.querySelector('#symbol').innerHTML = symbol;
 
    symbol_name = jsonInfo.Item.info.overview.Name
    link = "<a href='https://www.marketwatch.com/investing/stock/"+symbol+"' target='_blank' rel='noopener noreferrer'>"+symbol_name+"</a>"
    document.querySelector('#Name').innerHTML = " : " + link;
    document.querySelector('#Industry').innerHTML = jsonInfo.Item.info.overview.Industry;
    document.querySelector('#Description').innerHTML = jsonInfo.Item.info.overview.Description;
    document.querySelector('#next_earnings_date').innerHTML = jsonInfo.Item.info.next_earnings_date;
    document.querySelector('#details_earnings_date').value = jsonInfo.Item.info.next_earnings_date;

    //  Retrieve verified earnings data from aws
    jsonEarnings = await fetchEarningsInfo();
    if ((jsonEarnings == null) || (jsonEarnings.hasOwnProperty("Item") == false)) {
        jsonEarnings = {}
        jsonEarnings.Item = {}
        jsonEarnings.Item.symbol = symbol
        jsonEarnings.Item.info = {}
        jsonEarnings.Item.info.verified_earnings_data = []
    }
    console.log(jsonEarnings)



    let earnings_data = jsonEarnings.Item.info
    let divTable = document.getElementById("earnings_report_table");

    line = '<div class="put_table_row">'
    let last_yr = earnings_data[0].year
    for (let i = earnings_data.length-1; i >= 0; i--) {
        let info = earnings_data[i]

        template = get_template()

        template = template.replace("{$idx}",i)

        if (info.year != last_yr) 
            template = template.replace("{$lineBreak}",'<div class="put_table_row"><br/></div>')
        else
            template = template.replace("{$lineBreak}",'')
        last_yr = info.year

        let qtr = info.year + ' - Q' + (info.qtr+1)
        template = template.replace("{$qtr}",qtr)

        template = template.replace("{$marketDate}",info.marketDates[1])
 
        if (info.yahoo.hasOwnProperty('reportedDate')) {
            let yahoo = info.yahoo.reportedDate + " " + info.yahoo.reportTime
            template = template.replace("{$yahoo}",yahoo)
        } else 
            template = template.replace("{$yahoo}",'&nbsp;')

        if (info.alphavantage.hasOwnProperty('reportedDate')) {
            let alpha = info.alphavantage.reportedDate  + " " + info.alphavantage.reportTime
            template = template.replace("{$alpha}",alpha)
        } else 
            template = template.replace("{$alpha}",'&nbsp;')

        if (info.zacks.hasOwnProperty('reportedDate')) {
            let zacks = info.zacks.reportedDate  + " " + info.zacks.reportTime
            template = template.replace("{$zacks}",zacks)
        } else 
            template = template.replace("{$zacks}",'&nbsp;')

        line += template
    }

      
    line += '</div>'

    ele = htmlToElement(line)
    divTable.appendChild(ele);

    document.querySelector('#wait').remove();
    document.querySelector('#contents').style.visibility = "visible";
}

function get_template() {
    block = '\
        {$lineBreak}\
        <div class="put_table_row">\
        <span class="put_table_col_1"><a href="#" onclick="return selectRow(this)">{$qtr}</a></span>\
        <span class="put_table_col_2"><a href="#" onclick="return updateDate(this,{$idx})">{$marketDate}</a></span>\
        <span class="put_table_col_3">{$zacks}</span>\
        <span class="put_table_col_4">{$yahoo}</span>\
        <span class="put_table_col_5">{$alpha}</span>\
        </div>'
    return block
}
   
var selectedRow = null;
function selectRow(clickedElement){
    if (selectedRow != null) {
        selectedRow.classList.remove('selectedRow');
    }

    let parentElement = clickedElement.parentElement.parentElement;
    parentElement.classList.add('selectedRow');
    selectedRow = parentElement

    return false;
}

var selectedRow = null;
function updateDate(clickedElement,idx){
    console.log( jsonEarnings.Item.info[idx] )
    return false;
} 

async function fetchSymbolInfo() {
    let my_url = new URL(window.location.href);
    let symbol = my_url.searchParams.get("symbol").toUpperCase();
    let info_url = 'https://efd6n53bol.execute-api.us-west-1.amazonaws.com/items/' + symbol
    console.log(info_url)

    document.querySelector('#wait_status').innerHTML = "... Downloading "+symbol+" Data ...";

    try {
        let res = await fetch(info_url);
        return await res.json();
    } catch (error) {
        console.log(error);
        return null
    }
}
async function fetchEarningsInfo() {
    let my_url = new URL(window.location.href);
    let symbol = my_url.searchParams.get("symbol").toUpperCase();
    let info_url = 'https://efd6n53bol.execute-api.us-west-1.amazonaws.com/earnings/' + symbol
    console.log(info_url)

    document.querySelector('#wait_status').innerHTML = "... Downloading "+symbol+" Earnigns Data ...";

    try {
        let res = await fetch(info_url);
        return await res.json();
    } catch (error) {
        console.log(error);
        return null
    }
}

function editEarningsDate() {
    document.querySelector('#edit_symbol').style.visibility = "visible";
    return false;
}

async function onSaveDates() {
    console.log("OnSave()")

    earnings_data = jsonInfo.Item.info.earnings_data
    console.log(earnings_data)

    verified_earnings_data = jsonEarnings.Item.info.verified_earnings_data
    console.log(verified_earnings_data)

//  Build verified earnings_data
    earnings_data = jsonInfo.Item.info.earnings_data
    for (let i = earnings_data.length - 1; i >= 0; i--) {
        reported = earnings_data[i]
        verified = find_verified_earnings_data(reported)

        verified['actualDate'] = document.querySelector('#actual_date_'+i).value
        let e = document.getElementById('actual_time_'+i);
        verified['actualTime'] = e.options[e.selectedIndex].text;
        verified['verifed'] = document.querySelector('#verified_'+i).checked
    }
    console.log(jsonEarnings)

    let payload = {};
    payload['symbol'] = jsonEarnings.Item.symbol;
    payload['info'] = jsonEarnings.Item.info;
    let aws_url = 'https://efd6n53bol.execute-api.us-west-1.amazonaws.com/earnings'
    await putInfo(aws_url,payload)
    return false;
}

async function onSave() {
    edited_date = document.querySelector('#details_earnings_date').value
    document.querySelector('#next_earnings_date').innerHTML = edited_date.trim()
    jsonInfo.Item.info.next_earnings_date = edited_date.trim()

    let payload = {};
    payload['symbol'] = jsonInfo.Item.symbol;
    payload['info'] = jsonInfo.Item.info;
    let aws_url = 'https://efd6n53bol.execute-api.us-west-1.amazonaws.com/items'
    await putInfo(aws_url,payload)

    document.querySelector('#edit_symbol').style.visibility = "hidden";
    return false;
}

async function putInfo(url,data) {
    // Awaiting fetch which contains method,
    // headers and content-type and body
    console.log(url)
    console.log(data)
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify(data)
    });
           
    // Awaiting response.json()
    const resData = await response.json();
    console.log(resData.text)
    return resData;
}
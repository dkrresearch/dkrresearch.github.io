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


    symbol_name = jsonInfo.Item.info.overview.Name
    link = "<a href='https://www.marketwatch.com/investing/stock/"+symbol+"' target='_blank' rel='noopener noreferrer'>"+symbol_name+"</a>"
    document.querySelector('#Name').innerHTML = " : " + link;
    document.querySelector('#Industry').innerHTML = jsonInfo.Item.info.overview.Industry;
    document.querySelector('#Description').innerHTML = jsonInfo.Item.info.overview.Description;
    document.querySelector('#next_earnings_date').innerHTML = jsonInfo.Item.info.next_earnings_date;
    document.querySelector('#details_earnings_date').value = jsonInfo.Item.info.next_earnings_date;

    earnings_data = jsonInfo.Item.info.earnings_data



    let divTable = document.getElementById("earnings_report_table");

    line = '<div class="put_table_row">'

    for (let i = earnings_data.length-1; i >= 0; i--) {
        reported = earnings_data[i]

        verified = find_verified_earnings_data(reported)
        console.log(verified) 

        template = get_template()
        template = template.replace("{$reportedDate}",reported['reportedDate'])
        template = template.replace("{$reportedTime}",reported['reportTime'])
        template = template.replaceAll("{$idx}",i)
        template = template.replace("{$actualDate}",verified.actualDate)

        
        if (verified.actualTime == "pre-market") {
            template = template.replace("{$actualPreMarket}","selected")
            template = template.replace("{$actualPostMarket}","")
        } else {
            console.log('post-market')
            template = template.replace("{$actualPreMarket}","")
            template = template.replace("{$actualPostMarket}","selected")
        }
    
        if (verified.verifed == true)
            template = template.replace("{$actualVerified}","checked")
        else
            template = template.replace("{$actualVerified}","")

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
        <div class="put_table_row">\
        <span class="put_table_col_1">{$reportedDate}</span>\
        <span class="put_table_col_2">{$reportedTime}</span>\
        <span class="put_table_col_3"><input type="text" id="actual_date_{$idx}" value="{$actualDate}" required minlength="10" maxlength="10" size="10" /></span>\
        <span class="put_table_col_4"><select id="actual_time_{$idx}">\
            <option {$actualPreMarket} value="pre-market">pre-market</option><option {$actualPostMarket} value="post-market">post-market</option>\
        </select></span>\
        <span class="put_table_col_5"><input {$actualVerified} id="verified_{$idx}" type="checkbox" /></span>\
        </div>'
    return block
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
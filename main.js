
var globalDefaultValue = 121;  //  $121,000
var prem_per_day_per_1K = 0.100
var globalCurrentYear = 2024

async function loadBodyElements() {
    let header = await fetchHeader();
    let container = document.querySelector('#header');
    container.innerHTML = header;

    //  Search box code
    const search = document.getElementById('symbolSearch');
    search.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            symbol = search.value;
            symbolSearch(symbol.trim());
        }
    });
}

async function fetchHeader() {
    let url = 'header.html';

    try {
        let res = await fetch(url);
        return await res.text();
    } catch (error) {
        console.log(error);
    }
}

async function symbolSearch(symbol) {
    window.location.href = 'symbol.html?symbol='+symbol;
}

function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}

function unixToReadable(unix_timestamp) {
    let dt = new Date(unix_timestamp * 1000).toLocaleString()
    console.log(dt);
    return dt
}

function printUSD(value) {
    let minus = ''
    let red = false
    let fValue = parseFloat(value)

    if (fValue < 0) {
        fValue = fValue * -1.0
        minus = '-'
        red = true
    }

    printable = minus + "$" + fValue.toFixed(0)
    if (fValue >= 10000) {
        fValue = fValue / 1000.0
        printable = minus + "$" + fValue.toFixed(0) + "K"
    }
    else if (fValue > 1000) {
        fValue = fValue / 1000.0
        printable = minus + "$" + fValue.toFixed(1) + "K"
    }
    if (red == true)
        printable = "<span style='color:rgb(145, 35, 35)'>" + printable + "</span>"

    return printable
}

function loadError(errMesg) {
    document.querySelector('#err_status').innerHTML = errMesg;
    document.querySelector('#err_status').style.display = "block";
    document.querySelector('#wait_status').remove();
    document.querySelector('#wait_gif').remove();
    return
}

function overFairValue(jsonOptionTableInfo) {
    console.log(jsonOptionTableInfo)

    if (jsonOptionTableInfo.hasOwnProperty('quote') != true) 
        return 0.0

//  assuming an Assignment margin of 100000, and jsonOptionTableInfo.price_of_loss is per share
//   and jsonOptionTableInfo.est_commisions is for an assignment margin of 100000

    let dte = jsonOptionTableInfo.fdte
    let shares = (100000.0 / jsonOptionTableInfo.strike_price)
    let contracts = shares / 100.0
    let current_price = jsonOptionTableInfo.quote.buy_price

    let bs_remaining = dte * prem_per_day_per_1K * 100.0
    let price_of_risk = jsonOptionTableInfo.price_of_loss * shares
    
    let fair_value = price_of_risk + bs_remaining + jsonOptionTableInfo.est_commisions
    let market_value = current_price * shares

    console.log('fair value : ' + fair_value)
    console.log('market_value : ' + market_value)
    console.log('contracts : ' + contracts)

    let over_fair_value = (market_value - fair_value)

    console.log(over_fair_value)

    return over_fair_value 
}

async function fetchScannerInfo(algotype) {
    let my_url = new URL(window.location.href);
    let info_url = 'https://efd6n53bol.execute-api.us-west-1.amazonaws.com/scanner/'+ algotype
    try {
        let res = await fetch(info_url);
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

async function putStatus(payload) {
    let aws_url = 'https://efd6n53bol.execute-api.us-west-1.amazonaws.com/status'

    // Awaiting fetch which contains method,
    // headers and content-type and body
    console.log(aws_url)
    console.log(payload)
    const response = await fetch(aws_url, {
        method: 'PUT',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
           
    // Awaiting response.json()
    const resData = await response.json();
    return resData;
}

async function fetchStatus(year) {
    let info_url = 'https://efd6n53bol.execute-api.us-west-1.amazonaws.com/status'
    console.log(info_url)
    try {
        let res = await fetch(info_url);
        let jsonStatus =  await res.json();

        for (idx=0; idx< jsonStatus['Items'].length; idx++) {
            let id = jsonStatus.Items[idx]['id'];
            if (id == year) 
                return jsonStatus.Items[idx]['status']
        }

        return null
    } catch (error) {
        console.log(error);
    }
}

async function fetchPositionsInfo() {
    let info_url = 'https://efd6n53bol.execute-api.us-west-1.amazonaws.com/positions/opened'
    console.log(info_url)
    try {
        let res = await fetch(info_url);
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}


async function putPosition(data) {
    let aws_url = 'https://efd6n53bol.execute-api.us-west-1.amazonaws.com/positions'
    console.log(aws_url)

    // Awaiting fetch which contains method,
    // headers and content-type and body
    const response = await fetch(aws_url, {
        method: 'PUT',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify(data)
    });
           
    // Awaiting response.json()
    const resData = await response.json();
    return resData;
}


async function _fetchPosition(quote_symbol) {
    let jsonPositions = await fetchPositionsInfo()
    let table = jsonPositions.Items;

    for (var key in table) {
        if (table[key]['info']['quote_symbol'] == quote_symbol) 
            return table[key]
    }

    return null       
}


async function fetchOptionTable(symbol) {
    let info_url = 'https://efd6n53bol.execute-api.us-west-1.amazonaws.com/options/' + symbol
    console.log(info_url)

    document.querySelector('#wait_status').innerHTML = "... Downloading "+symbol+" Option Data ...";

    try {
        let res = await fetch(info_url);
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

function findOptionInfo(jsonOptionTable,option_type,option_symbol) {
//  Find this option in the option table
    let option_table = jsonOptionTable.Item.info.option_table_near
    for(var key in option_table) {        
        if ((option_table[key]['type'] == option_type) && (option_table[key]['quote_symbol'] == option_symbol))
            return option_table[key]
    }

    option_table = jsonOptionTable.Item.info.option_table_far
    for(var key in option_table) {
        if ((option_table[key]['type'] == option_type) && (option_table[key]['quote_symbol'] == option_symbol))
            return option_table[key]
    }

    
    option_table = jsonOptionTable.Item.info.option_table_weekly
    for(var key in option_table) {
        if ((option_table[key]['type'] == option_type) && (option_table[key]['quote_symbol'] == option_symbol))
            return option_table[key]
    }
    return null
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function toggle_dropdown() {
    document.getElementById("myDropdown").classList.toggle("show");
}

// Close the dropdown if the user clicks outside of it
window.onclick = function(e) {
    if (!e.target.matches('.dropbtn') && !e.target.matches('.fa')) {
        var myDropdown = document.getElementById("myDropdown");
        if (myDropdown.classList.contains('show')) {
            myDropdown.classList.remove('show');
        }
    }
  }
  

function setCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}
function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

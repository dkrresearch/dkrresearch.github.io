var jsonInfo = null;
var jsonEarnings = null;
var selectedDate = null;
var selectedDateString = '';

function dateToString(thisDate) {
    let yr = thisDate.getFullYear();
    let mn = thisDate.getMonth() + 1;
    let day = thisDate.getDate();
    let date_str = yr.toString().padStart(4, '0') +"-"+ mn.toString().padStart(2, '0') +"-"+ day.toString().padStart(2, '0');
    return date_str;
}

function calcDates() {
    const msec_per_day = (24*60*60*1000)
    const day_of_the_week = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    let my_url = new URL(window.location.href);
    let date = my_url.searchParams.get("date");   

    if ((date == null) || (date == '')) {
        selectedDate = new Date()
    } else {
        selectedDate = new Date(date + "T12:00:00.000"); 
    }
    selectedDateString = dateToString(selectedDate)
    console.log(selectedDateString) 

    let dayOfMonth = selectedDate.getDate();  
    let dayOfWeek = selectedDate.getDay();  

    let thisDate = new Date();
    for (let delta_day = 1; delta_day <= 5; delta_day++) {
        console.log(dayOfWeek + delta_day)
        thisDate = new Date( selectedDate.getTime() - (dayOfWeek * msec_per_day) + (delta_day * msec_per_day) )

        let day = thisDate.getDate();
        let date_str = dateToString(thisDate)

        let html_id = '#dow_' + delta_day

        let span_html = "<a href='ecal.html?date="+date_str+"'>"+day_of_the_week[delta_day]+"<br/>"+date_str+"</a>"
        document.querySelector(html_id).innerHTML = span_html;
        
        if (dayOfMonth == day) {
            span_html = day_of_the_week[delta_day]+"<br/>"+date_str
            document.querySelector(html_id).innerHTML = span_html;
            document.querySelector(html_id).className = "cal_table_col_selected";
        } else {
            span_html = "<a href='ecal.html?date="+date_str+"'>"+day_of_the_week[delta_day]+"<br/>"+date_str+"</a>"
            document.querySelector(html_id).innerHTML = span_html;
        }
    }

    thisDate = new Date( selectedDate.getTime() - (dayOfWeek * msec_per_day) - (6 * msec_per_day) )
    let date_str = dateToString(thisDate)

    let span_html = "<a href='ecal.html?date="+date_str+"'>Prev Week</a>"
    document.querySelector('#dow_prev').innerHTML = span_html;

    thisDate = new Date( selectedDate.getTime() - (dayOfWeek * msec_per_day) + (8 * msec_per_day) )
    date_str = dateToString(thisDate)

    span_html = "<a href='ecal.html?date="+date_str+"'>Next Week</a>"
    document.querySelector('#dow_next').innerHTML = span_html;
}


async function loadCalendarData() {
    calcDates()

    jsonSymbols = await fetchSymbols();
    if ((jsonSymbols == null) || (jsonSymbols.hasOwnProperty("Items") == false)) {
        console.log(jsonSymbols)
        return loadError("Symbols not found")
    }
    jsonSymbols = jsonSymbols['Items']
    jsonSymbols.sort((a, b) => a.symbol.localeCompare(b.symbol))

    console.log(jsonSymbols)
    let earnings_today = []
    for (const symbolInfo of jsonSymbols) {
        symbol = symbolInfo['symbol']
        let earnings_date = symbolInfo['earnings_date']
        let name = symbolInfo['name']

        if (earnings_date == selectedDateString) {
            item = {}
            item['symbol'] = symbol
            item['next_earnings_date'] = earnings_date
            item['name'] = name
            
            earnings_today.push(item) 
        }
    }

    let divTable = document.getElementById("earnings_table");
    for (const item of earnings_today) {
        template = get_template()

        template = template.replaceAll("{$symbol}",item['symbol'])
        template = template.replaceAll("{$earnings_date}",item['next_earnings_date'])
        template = template.replaceAll("{$name}",item['name'])

        let ele = htmlToElement(template);
        divTable.appendChild(ele);
    }

    document.querySelector('#wait').remove();
    document.querySelector('#contents').style.visibility = "visible";
}

function get_template() {
    let block = '\
    <div class="symbol_table_row">\
    <span class="symbol_table_col_1"><a href="symbol.html?symbol={$symbol}" style="font-weight:750;">{$symbol}</a></span>\
    <span class="symbol_table_col_2">{$name}</span>\
    <span class="symbol_table_col_3">{$earnings_date}</span>\
    </div>\
    ';
    return block
}

async function fetchSymbols() {
    let info_url = 'https://efd6n53bol.execute-api.us-west-1.amazonaws.com/items'
    console.log(info_url)

    document.querySelector('#wait_status').innerHTML = "... Downloading Symbols ...";

    try {
        let res = await fetch(info_url);
       ret =  await res.json();
       return ret
    } catch (error) {
        console.log(error);
        return null
    }
}


async function fetchSymbolInfo(symbol) {
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
 

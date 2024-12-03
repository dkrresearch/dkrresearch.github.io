

async function loadReportData() {
    this_algo = 'long_call'

    document.querySelector('#wait_status').innerHTML = "... Downloading Status ...";
    let jsonStatus = await fetchHistory();
    if (jsonStatus == null)  {      
        return loadError("Unable to load current status")
    }

    for (idx in jsonStatus) {
        if (jsonStatus[idx]['id'] == globalCurrentYear){
            jsonAlgo = jsonStatus[idx]['status']['algos'][this_algo]
            console.log(jsonAlgo)

            document.querySelector('#ytd_profit').innerHTML = printUSD( jsonAlgo['profit'] )
            
            let total_cnt = jsonAlgo['cnt_positions'] + 1e-6
            let num_assignments = jsonAlgo['cnt_assignments']
            let assignment_rate = (100.0 * num_assignments) / total_cnt
            document.querySelector('#assignment_rate').innerHTML = assignment_rate.toFixed(2) + '%' 
            break;       
        }
    }
    
    divT = document.getElementById("report_table");
    
    jsonStatus.reverse()
    for (var idx in jsonStatus) {
        year = jsonStatus[idx]['id']
        yearly_results = jsonStatus[idx]

        line = '<div class="report_table_row">'
        line = line + '<span class="report_table_year">'+ year +'</span>'

        if (this_algo in yearly_results['status']['algos']) {
            algo_results = yearly_results['status']['algos'][this_algo]
            algo_history = algo_results['history']        
            
            let yr_assignements = 0
            let yr_contracts = 0
            let yr_profit = 0.0

            for (var key in algo_history) {
                yr_assignements += algo_history[key]['assignments']
                yr_contracts += algo_history[key]['count']
                yr_profit += algo_history[key]['profit']
            }

            line = line + '<span class="report_table_year_col_2">' + yr_assignements + '</span>'
            line = line + '<span class="report_table_year_col_3">' + yr_contracts + '</span>'
            let profit = printUSD(yr_profit)
            line = line + '<span class="report_table_year_col_4">' + profit + '</span>'
        }

        line = line + '</div>'
        ele = htmlToElement(line)
        divT.appendChild(ele);

        if (this_algo in yearly_results['status']['algos']) {
            algo_results = yearly_results['status']['algos'][this_algo]
            algo_history = algo_results['history']

            const keys = Object.keys(algo_history).sort().reverse()
            console.log(keys)
            for (var key in keys) {
                month = keys[key]
                printable_month = printableMonth[ parseInt(month) - 1]
                monthly_results = algo_history[month]

                line = '<div class="report_table_row">'
                line = line + '<span class="report_table_col_1">'+ printable_month +'</span>'
                line = line + '<span class="report_table_col_2">' + monthly_results['assignments'] + '</span>'
                line = line + '<span class="report_table_col_3">' + monthly_results['count'] + '</span>'

                let profit = printUSD(monthly_results['profit'])
                line = line + '<span class="report_table_col_4">' + profit + '</span>'

                line = line + '</div>'
                ele = htmlToElement(line)
                divT.appendChild(ele);
            }
        }
    }

    document.querySelector('#wait').remove();
    document.querySelector('#contents').style.visibility = "visible";

    return
}

 


async function loadReportData() {

    document.querySelector('#wait_status').innerHTML = "... Downloading Status ...";
    let jsonStatus = await fetchHistory();
    if (jsonStatus == null)  {      
        return loadError("Unable to load current status")
    }
    jsonStatus.sort(function(a,b) {
        return a.id - b.id
    });
    
    //  Find the headline stats, Y-T-D profit and assignment rate....
    for (idx in jsonStatus) {
        if (jsonStatus[idx]['id'] == globalCurrentYear){
            let total_long_profit = 0.0
            let total_long_assignments = 0
            let total_long_count = 0

            let total_short_profit = 0.0
            let total_short_assignments = 0
            let total_short_count = 0
            let carried_losses = 0.0

            for (algo in jsonStatus[idx]['status']['algos']) {
                jsonAlgo = jsonStatus[idx]['status']['algos'][algo]

                if ((algo == 'long_put') || (algo == 'long_call')) {
                    total_long_assignments += jsonAlgo['cnt_assignments']
                    total_long_count += jsonAlgo['cnt_positions']
                    total_long_profit += jsonAlgo['profit']
                } else {
                    if ('cnt_assignments' in jsonAlgo)
                        total_short_assignments += jsonAlgo['cnt_assignments']
                    total_short_count += jsonAlgo['cnt_positions']
                    total_short_profit += jsonAlgo['profit']
                    if ('carried_losses' in jsonAlgo)
                        carried_losses += jsonAlgo['carried_losses']
                }
            }

            //  Update the HTML
            let profit =  printUSD( total_short_profit +  total_long_profit)
            document.querySelector('#ytd_profit').innerHTML = profit

            let assignment_rate = (100.0 * total_long_assignments) / (total_long_count + 0.001)
            document.querySelector('#long_assignment_rate').innerHTML = assignment_rate.toFixed(2) + '%' 
            
            console.log(total_short_assignments)
            console.log(total_short_count)
            assignment_rate = (100.0 * total_short_assignments) / (total_short_count + 0.001)
            document.querySelector('#short_assignment_rate').innerHTML = assignment_rate.toFixed(2) + '%' 
            
            break
        }
    }
    
    let divT = document.getElementById("report_table");
    

    //  Find the yearly/monthly stats, profit and assignment rate....
    jsonStatus.reverse()
    for (var idx in jsonStatus) {
        year = jsonStatus[idx]['id']
        yearly_results = jsonStatus[idx]

        let yearly_profit = 0.0
        let yearly_long_assignments = 0;
        let yearly_long_count = 0;
        let yearly_short_assignments = 0;
        let yearly_short_count = 0;
    
        let monthly_profit = new Array(12).fill(0.0);
        let monthly_long_assignments = new Array(12).fill(0);
        let monthly_long_count = new Array(12).fill(0);
        let monthly_short_assignments = new Array(12).fill(0);
        let monthly_short_count = new Array(12).fill(0);

        for (this_algo in yearly_results['status']['algos']) {
            algo_results = yearly_results['status']['algos'][this_algo]
            algo_history = algo_results['history']        
            
            for (var key in algo_history) {
                idx = parseInt(key) - 1
                monthly_profit[idx] += algo_history[key]['profit']
                yearly_profit += algo_history[key]['profit']
                
                if ((this_algo == 'long_put') || (this_algo == 'long_call')) {
                    monthly_long_assignments[idx] += algo_history[key]['assignments']
                    monthly_long_count[idx] += algo_history[key]['count']

                    yearly_long_assignments += algo_history[key]['assignments']
                    yearly_long_count += algo_history[key]['count']
                } else {
                    monthly_short_assignments[idx] += algo_history[key]['assignments']
                    monthly_short_count[idx] += algo_history[key]['count']

                    yearly_short_assignments += algo_history[key]['assignments']
                    yearly_short_count += algo_history[key]['count']
                }
            }
        }

        //  Update the HTML for this year
        line = '<div class="report_table_row">'
        line = line + '<span class="report_table_year">'+ year +'</span>'
        line = line + '<span class="report_table_year_col_2">' + yearly_long_assignments + '</span>'
        line = line + '<span class="report_table_year_col_3">' + yearly_long_count + '</span>'
        line = line + '<span class="report_table_year_col_4">' + yearly_short_assignments + '</span>'
        line = line + '<span class="report_table_year_col_5">' + yearly_short_count + '</span>'
        let profit = printUSD(yearly_profit)
        line = line + '<span class="report_table_year_col_6">' + profit + '</span>'
        line = line + '</div>'
        ele = htmlToElement(line)
        divT.appendChild(ele);

//  Do each month in the year
        for (let idx = 11; idx >= 0; idx--) {
            if (monthly_long_count[idx] + monthly_short_count[idx] <= 0)
                continue
            printable_month = printableMonth[ idx ]

            line = '<div class="report_table_row">'
            line = line + '<span class="report_table_col_1">'+ printable_month +'</span>'
            line = line + '<span class="report_table_col_2">' + monthly_long_assignments[idx] + '</span>'
            line = line + '<span class="report_table_col_3">' + monthly_long_count[idx] + '</span>'
            line = line + '<span class="report_table_col_4">' + monthly_short_assignments[idx] + '</span>'
            line = line + '<span class="report_table_col_5">' + monthly_short_count[idx] + '</span>'

            let profit = printUSD(monthly_profit[idx])
            line = line + '<span class="report_table_col_6">' + profit + '</span>'

            line = line + '</div>'
            ele = htmlToElement(line)
            divT.appendChild(ele);
        }
    }

    document.querySelector('#wait').remove();
    document.querySelector('#contents').style.visibility = "visible";

    return
 }

 
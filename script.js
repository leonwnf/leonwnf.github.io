
    let srcBase
    let destBase

    // Form elements
    let src_baseIdElem = 'input#src_baseId'
    let src_tableNameElem = 'select#select_srcTable'
    let viewSelectElementId = 'select_srcView'
    let ignoreFieldsElementId = 'select_srcIgnoredFields'

    let dest_baseIdElem = 'input#dest_baseId'
    let dest_tableNameElem = 'select#select_destTable'

    
    $(function() {
    
        // Hide all progress indicators
        $(".progress").toggleClass("toggleVisible");
    
        // Initialize selects
        let elems = $('select');
        elems.attr('disabled', 'disabled');
    
        let dropdownOptions = $('option');
        let instances = M.FormSelect.init(elems, dropdownOptions);
    
        // Setup listener for custom event to re-initialize on change
        $('.materialSelect').on('contentChanged', function(e) {
            console.log('contentChanged: ' +e.currentTarget.id)
            M.FormSelect.init($(this), dropdownOptions);
            
            // let inst = M.FormSelect.getInstance($(this))
            //  let selectElem = inst.wrapper
            
            // Look for helper text to update
            // $(selectElem).siblings('span.helper-text:first').html(inst.getSelectedValues()[0])
    
            
        })
    
    
        $('.materialSelect').on('change', function(e) {
    
            //console.log(e.currentTarget.id)
            let inst = M.FormSelect.getInstance($(this))
            let selectElem = inst.wrapper
    
            // Look for helper text to update
            $(selectElem).siblings('span.helper-text:first').html(inst.getSelectedValues()[0])

            if(e.currentTarget.id === 'select_srcTable') {
                refreshSourceViewAndFieldSelect(inst.getSelectedValues()[0])
            }
                
        })
        
        // Button listeners
        $('#btn_loadSrcBase').bind('click', clickLoadBase);
        $('#btn_loadDestBase').bind('click', clickLoadBase);
    
    })
    /*
    function loadRoutingBase() {

        // Form elements
        src_baseIdElem = $('input#src_baseId')
        src_tableNameElem = $('select#select_srcTable')
        src_tableIdElem =  $('span#src_tableId')

        dest_baseIdElem = $('input#dest_baseId')
        dest_tableNameElem = $('select#select_destTable')
        dest_tableIdElem =  $('span#dest_tableId')

        google.script.run.withSuccessHandler(function(res) { 

            Airtable = require('airtable')
            routingBase = new Airtable({ apiKey: res }).base('app7exotZriyOgBrN')

            //if()
            console.log(src_tableIdElem.text())
            console.log(dest_tableIdElem.text())

            routingBase('Fields').select({
                filterByFormula: `{Table ID}`,
                maxRecords: 10,
            }).all()

            console.log(routingBase)

        }).getApiKey(); // Runs GScript first and process response in callback function above
    }
*/
    
    function clickLoadBase(e) {

        if(e.target.id === 'btn_loadSrcBase')
            fetchBase('src')
        else if(e.target.id === 'btn_loadDestBase')
            fetchBase('dest')

    }

    
    
    function fetchBase(basePrefix) {
        
        let baseIdElemId = basePrefix +'_baseId'
        let baseNameElemId = basePrefix +'_baseName'
        
        let tableSelectElementId = 'select_' +basePrefix +'Table'
        let tableIdElemId = basePrefix +'_tableId'

        let progressElementId = basePrefix +'_baseId_progress'
        
        let baseId = document.getElementById(baseIdElemId).value
    
        let progressElem = $('#' +progressElementId)
        progressElem.toggleClass("toggleVisible")
        
        // Retrieve base meta and update options
        google.script.run.withSuccessHandler(function(res) { 
        
            console.log(res)
    
            // Hide progress
            progressElem.toggleClass("toggleVisible");
    
            // If all ok...
            if(!res.error && res.name && res.id && res.tables) {
    
                let baseRecord = res
    
                // store json obj
                if(basePrefix === 'src') srcBase = baseRecord
                if(basePrefix === 'dest') destBase = baseRecord
    
                // Update base name helper text
                $('span#' +baseNameElemId).html(baseRecord.name)
    

                // Refresh Table Select options
                let selectedTableId = refreshSelectOptions(tableSelectElementId, baseRecord.tables)[0]

                // Refresh view select options for selected source table
                //if(basePrefix === 'src') {
                    //   refreshSourceViewAndFieldSelect(selectedTableId)
                //}

    
            } else { // if error
                
                $('#' +baseNameElemId).val(res.error)
                $('#' +baseIdElemId).removeClass('valid').addClass('invalid')
            }
    
    
        }).fetchBaseMeta(baseId, basePrefix); // Runs GScript first and process response in callback function above
    
    }
    
    
    
    function refreshSourceViewAndFieldSelect(selectedTableId) {

        if(srcBase.tables) {

            let selectedTableId = M.FormSelect.getInstance($('select#select_srcTable')).getSelectedValues()[0]

            let views = srcBase.tables.find(i => i.id === selectedTableId).views
            let fields = srcBase.tables.find(i => i.id === selectedTableId).fields

            refreshSelectOptions(viewSelectElementId, views)
            refreshSelectOptions(ignoreFieldsElementId, fields)
        }

    }

    // Refresh select options and return default selected value
    function refreshSelectOptions(selectElemId, optionsArr) {
        
        // Clear current options
        $('#' +selectElemId).children('option').remove()

        for(const i of optionsArr) {
            let newOpt = $("<option>").attr("value",i.id).text(i.name)
            $('#' +selectElemId).append(newOpt)
        }
    
        // Re-enable select
        $('#' +selectElemId).removeAttr('disabled')
    
        // Fire custom event anytime you've updated select
        $("#" +selectElemId).trigger('contentChanged')
        $("#" +selectElemId).trigger('change')

        return M.FormSelect.getInstance($("#" +selectElemId)).getSelectedValues()
    
    }

    function getSelectedSourceTableId() {
        return M.FormSelect.getInstance($('select#select_srcTable')).getSelectedValues()[0]
    }

    
    
    /** HELPER JSON LOOKUP FUNCTIONS */
    /*
    function getTableNameFromId(tableId) {
        return getAllTables().find(r => r.id === tableId)
    }
    
    function getTableIdFromNameAndBaseId(tableName, baseId) {
        return getAllTables().find(r => (r.name === tableName && r.baseId === baseId))
    }
    
    
    // Returns all tables from both src and dest bases
    // as array of table objects [{id, name, baseId}, ...]
    function getAllTables() {
        
        let srcBaseTables = []
        let destBaseTables = []
    
    
        if(srcBase) {
            if(srcBase && srcBase.tables && srcBase.id) {
                for(const rec of srcBase.tables) {
                    srcBaseTables.push({id: rec.id, name: rec.name, baseId: srcBase.id})            
                }       
            }
        }
        
    
        if(destBase) {
            if(destBase.tables && destBase.id) {
                for(const rec of destBase.tables) {
                    destBaseTables.push({id: rec.id, name: rec.name, baseId: destBase.id})            
                }
            }
        }
        
        
        // Should be combined tables arr [{id, name, baseId}]
        return srcBaseTables.concat(destBaseTables)
    
    }
    */
    
    /** Misc functions */
    function logThis(txt) {
        
        console.log(txt)
    
        let oldVal = $('#debug').html()
        $('#debug').html(oldVal+ '<br/>' +txt)
    }
    

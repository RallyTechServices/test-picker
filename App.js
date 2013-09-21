

Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    defaults: {padding: 10 },
    items: [
        {xtype:'container',itemId:'selector_box',layout:{type:'hbox'},items:[
            {xtype:'container',itemId:'iteration_selector_box'},
            {xtype:'container',itemId:'test_set_add_box'}
        ]},
        {xtype:'container',html:'Use button above to create a new Test Set.  Double-click a Test Set row in the table to add Test Cases', margin: 10},
        {xtype:'container',itemId:'grid_box'}
    ],
    launch: function() {
        this._addSelectors();
    },
    _addSelectors: function() {
        var me = this;
        this.iteration_selector = this.down('#iteration_selector_box').add({
            xtype:'rallyiterationcombobox',
            listeners: {
                scope: this,
                change: function(ib,new_value,old_value) {
                    this._getTestSets(ib.getValue());
                },
                ready: function(ib) {
                    this._getTestSets(ib.getValue());
                }
            }
        });
        
        this.down('#test_set_add_box').add({
            xtype:'rallyaddnew',
            recordTypes:['Test Set'],
            ignoredRequiredFields: ['Iteration','Project','ScheduleState','Name'],
            listeners: {
                beforecreate: function(adder, record) {
                    record.set('Iteration',me.iteration_selector.getValue());
                },
                create: function(adder, record) {
                    me._log(record);
                    me._getTestSets(me.iteration_selector.getValue());
                }
            }
        });
    },
    _getTestSets: function(iteration_ref) {
        this._log("loading test sets for iteration " + iteration_ref);
        if ( this.grid ) { this.grid.destroy(); }
        Ext.create('Rally.data.WsapiDataStore',{
            model:'TestSet',
            autoLoad: true,
            filters: [{property:'Iteration',value:iteration_ref}],
            fetch: ['FormattedID','ObjectID','TestCases','Name'],
            listeners: {
                scope: this,
                load: function(store,records,success){
                    this._makeTwoLevelStore(records);
                }
            }
        });
    },
    _makeTwoLevelStore: function(records) {
        var me = this;
        var interim_array = [];
        var callback_counter = 0;
        if ( records.length == 0 ) {
            me._unflattenArray([]);
        }
        /*
         * Since the change for collections, have to go and get all the child
         * items with callbacks.  ugh.
         */
        Ext.Array.each( records, function(record){
            var test_set = record.getData();
            test_set.Children = [];
            interim_array.push(test_set);
            callback_counter += 1;
            me._log(["callback counter: ", callback_counter]);
            record.getCollection('TestCases').load({
                fetch: ['FormattedID','ObjectID','Name'],
                callback: function(records,operation,success){
                    callback_counter -= 1;
                    Ext.Array.each(records,function(tc){
                        test_set.Children.push(tc.getData());
                    });
                    me._log(["callback counter: ", callback_counter]);
                    if ( callback_counter <= 0 ) {
                        me._unflattenArray(interim_array);
                    }
                }
            });
        });
    },
    _unflattenArray: function(interim_array) {
        var me = this;
        var table_records = [];
        Ext.Array.each(interim_array,function(item){
            table_records.push(item);
            Ext.Array.each(item.Children,function(child){
                table_records.push(child);
            });
        });
        var store = Ext.create('Rally.data.custom.Store',{
            data: table_records
        });
        me._makeGrid(store);
    },
    _renderIndent: function(value, metaData, record, rowIndex, colIndex, store, view) {
        var display_value = value;
        if ( record.get('_type') && record.get('_type') == "testcase" ) {
            display_value = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + display_value;
        }
        return display_value;
    },
    _renderObjectByName: function(value,metaData,record,rowIndex,colIndex,store,view){
        var display_value = "";
        if ( value ) {
            display_value = value._type;
            if ( value._refObjectName ) {
                display_value = value._refObjectName;
            }
        }
        return display_value;
    },
    _makeGrid: function(store) {
        var me = this;
        if (this.grid){this.grid.destroy();}
        this.grid = Ext.create('Rally.ui.grid.Grid',{
            store: store,
            width: 800,
            columnCfgs: [
                {text:'id',dataIndex:'FormattedID',renderer:me._renderIndent,sortable: false},
                {text:'name',dataIndex:'Name',renderer:me._renderIndent,sortable: false, flex:1}
            ],
            listeners: {
                scope: this,
                celldblclick: function( grid, td, cell_index, record, tr, row_index ) {
                    if ( record.get('_type') == "testset" ){
                        this._launchTestCaseSearch(record);
                    }
                }
            }
        });
        this.down('#grid_box').add(this.grid);
    },
    _launchTestCaseSearch:function(record){
        var me = this;
        var height = isNaN(this.getHeight()) ? 500 : this.getHeight()-50;
        if ( height > 700 ) { height = 700; }
        
        var width = isNaN(this.getWidth()) ? 800: this.getWidth()-50;
        if ( width > 800 ) { width = 800; }
        
        this._log([width, height]);
        
        me.dialog = Ext.create('Rally.ui.dialog.ChooserDialog',{
            artifactTypes: ['testcase'],
            xtype: 'panel',
            border: false,
            autoShow: true,
            height: height,
            width: width,
            title: 'Choose Test Cases',
            items: {
                xtype: 'panel',
                border: false,
                items: [
                    {
                        xtype: 'container',
                        itemId: 'gridContainer',
                        layout: 'fit',
                        height: height-100,
                        width: width-20
                    }
                ]
            },
            filterableFields: [
                {displayName: 'ID', attributeName:"FormattedID"},
                {displayName: 'Name', attributeName:"Name"},
                {displayName: 'TestFolder', attributeName:"TestFolder.Name"},
                {displayName: 'Tags', attributeName:"Tags"},
                {displayName: 'Type',attributeName:"Type"}
            ],
            columns: [
                {text:'id',dataIndex:'FormattedID'},
                {text:'Name',dataIndex:'Name',flex: 1},
                {text:'Type',dataIndex:'Type'},
                {text:'Folder',dataIndex:'TestFolder',renderer:me._renderObjectByName}
            ],
            storeConfig: {
                fetch:['FormattedID','Name','Tags','TestFolder','ObjectID'],
                context: { project: null }
            },
            multiple: true,
            listeners: {
                scope: this,
                artifactChosen: function(items){
                    Ext.create('Rally.data.WsapiDataStore',{
                        model:'TestSet',
                        pageSize: 1,
                        autoLoad: true,
                        filters: [{property:'ObjectID',value:record.get('ObjectID')}],
                        listeners: {
                            load: function(store,records){
                                var ts = records[0];
                                me._log(["Selected items:",items]);
                                var tc_store = ts.getCollection('TestCases');
                                
                                me._log(["Got store:",tc_store]);
                                tc_store.add(items);
                                
                                tc_store.proxy.setModel("TestCase",true);
                                //                              
                                me._log("Added items.");
                                tc_store.sync({
//                                    callback: function(){
//                                        me._log("inside callback");
//                                        me._getTestSets(me.iteration_selector.getValue());
//                                    }
                                    success: function(batch,options) {
                                        me._getTestSets(me.iteration_selector.getValue());
                                    },
                                    failure: function(batch,options) {
                                        me._getTestSets(me.iteration_selector.getValue());
                                    }
                                });
                            }
                        }
                    });
                }
            }
        });
    },
    _log: function(msg) {
        window.console && console.log( msg );  
    }
});

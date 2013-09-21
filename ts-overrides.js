//
Ext.override(Rally.ui.dialog.ChooserDialog,{

    /**
     * @private
     */
    _buildSearchBar: function() {

        var filterTypeComboBox = Ext.create('Ext.form.field.ComboBox', {
            itemId: 'filterTypeComboBox',
            queryMode: 'local',
            store: Ext.create('Ext.data.Store', {
                fields: ['attributeName', 'displayName'],
                data: this.filterableFields
            }),
            displayField: 'displayName',
            valueField: 'attributeName',
            editable: false,
            listeners: {
                change: function(cb) {
                    if ( this.down('#searchTerms') ) {
                        this.down('#searchTerms').destroy();
                        this.down('#searchTermParent').add(this._getSearchTermsBox(cb.getValue()));
                    } 
                },
                scope: this
            }
        });

        filterTypeComboBox.select(filterTypeComboBox.getStore().getAt(1));

        var searchTermBox = this._getSearchTermsBox();
        
        this.addDocked({
            xtype: 'toolbar',
            itemId: 'searchBar',
            dock: 'top',
            items: [
                { xtype: 'container', items: [filterTypeComboBox]},
                { xtype:'container',itemId:'searchTermParent', items:[searchTermBox]},
                { xtype:'container', items: [{
                        xtype: 'button',
                        text: 'Search',
                        handler: this._search,
                        scope: this
                    }]
                }
            ]
        });
    },
    
    _getSearchTermsBox: function(fieldname) {
        var field = null;
        
        if ( fieldname === "Tags" ) {
            field = Ext.create('Rally.ui.picker.TagPicker',{
                autoExpand: false,
                itemId: 'searchTerms'
            });
            
        } else {
            field = Ext.create('Ext.form.field.Text',{
                itemId: 'searchTerms',
                emptyText: 'enter search terms',
                flex: 1,
                enableKeyEvents: true,
                listeners: {
                    keyup: function(textField, event) {
                        if (event.getKey() === Ext.EventObject.ENTER) {
                            this._search();
                        }
                    },
                    scope: this
                }
            });
        }
                        
        return field;
    },
    
    _search: function() {

        var terms = this.down('#searchTerms').getValue();
        var filterBy = this.down('#filterTypeComboBox').getValue();
        
        var filter;
        
        if (!Ext.isEmpty(terms)) {
            if ( typeof terms === "string" ) {
                filter = Ext.create('Rally.data.QueryFilter', {
                    property: filterBy,
                    value: terms,
                    operator: 'Contains'
                });
            } else {
                // we think it's an array
                Ext.Array.each( terms, function(term) {
                    var filter_part = Ext.create('Rally.data.QueryFilter', {
                        property: filterBy,
                        value: term.get('_ref'),
                        operator: 'Contains'
                    });
                
                    if ( filter ) {
                            filter = filter.and(filter_part);
                    } else {
                        filter = filter_part;
                    }
                });
            }
        }
        
        this.grid.filter(filter, true);
    }
});
//
Ext.override(Rally.data.WsapiCollectionProxy,{
    _getProject: function() {
        if(Ext.isDefined(this.model) && Ext.isDefined(this.model.context) && Ext.isDefined(this.model.context.project)) {
            return this.model.context.project;
        } else {
            return Rally.data.Proxy.getGlobalProject();
        }
    },

    _getProjectScopeUp: function() {
        if(Ext.isDefined(this.model) && Ext.isDefined(this.model.context) && Ext.isDefined(this.model.context.projectScopeUp)) {
            return this.model.context.projectScopeUp;
        } else {
            return Rally.data.Proxy.getGlobalProjectScopeUp();
        }
    },

    _getProjectScopeDown: function() {
        if(Ext.isDefined(this.model) && Ext.isDefined(this.model.context) && Ext.isDefined(this.model.context.projectScopeDown)) {
            return this.model.context.projectScopeDown;
        } else {
            return Rally.data.Proxy.getGlobalProjectScopeDown();
        }
    },

    _getWorkspace: function() {
        if(Ext.isDefined(this.model) && Ext.isDefined(this.model.context) && Ext.isDefined(this.model.context.workspace)) {
            return this.model.context.workspace;
        } else {
            return Rally.data.Proxy.getGlobalWorkspace();
        }
    }
});

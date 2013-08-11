//
Ext.override(Rally.ui.dialog.ChooserDialog,{

    _search: function() {

        var terms = this.down('#searchTerms').getValue();
        var filterBy = this.down('#filterTypeComboBox').getValue();
        var filter;
        
        if (!Ext.isEmpty(terms)) {
            filter = Ext.create('Rally.data.QueryFilter', {
                property: filterBy,
                value: terms,
                operator: 'Contains'
            });
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

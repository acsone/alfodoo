/*---------------------------------------------------------
 + * Odoo web_cmis_viewer
 + * Author  Laurent Mignon 2015 Acsone SA/NV
 + * License in __openerp__.py at root level of the module
 + *---------------------------------------------------------
 +*/

 odoo.define('web_cmis_viewer.cmis_viewer_widgets', function( require) {
 
 var core = require('web.core');
 var formWidget = require('web.form_widgets');
 var formats = require('web.formats');
 var ProgressBar = require('web.ProgressBar');
 var pyeval = require('web.pyeval');
 var Registry = require('web.Registry');
 var session = require('web.session');
 var QWeb = core.qweb;

 var CmisViewer = formWidget.FieldChar.extend({
    template: "CmisViewer",

    widget_class: 'cmis_viewer',
    datatable: null,


    init: function (field_manager, node) {
        this._super(field_manager, node);
        this.id_for_table = _.uniqueId('cmis_viewer_widgets_table');
    },

    start: function () {
        var self = this;
        this.states = [];
        this._super.apply(this, arguments);
        // hook on form view content changed: recompute the states, because it may be related to the current stage
        this.getParent().on('view_content_has_changed', self, function () {
            self.render_value();
        });
        // add a listener on parent tab if it exists in order to display the dataTable
        core.bus.on('DOM_updated', self.view.ViewManager.is_in_DOM, function () {
            self.add_tab_listener();
        });
        if (self.$el.is(':visible')){
            self.render_datatable();
        }
    },
    
    add_tab_listener: function() {
        var self = this;
        $('a[data-toggle="tab"]').on('shown.bs.tab', function(e) {
            var tab_id = self.id_for_table;
            var active_tab = $(e.target.hash);
            if (active_tab.find('#' + tab_id).length == 1) {
                  self.render_datatable();
                  return;
            }
        });
    },

    render_datatable: function() {
        if (_.isNull(this.datatable)){
            this.datatable = $('#' + this.id_for_table).DataTable({
                searching:      false,
                scrollY:        '40vh',
                scrollCollapse: true,
                pageLength:     25,
            });
        }
    },

    prepare_dropdown_selection: function() {
        var self = this;
        var _data = [];
        var current_stage_id = self.view.datarecord.stage_id[0];
        var stage_data = {
            id: current_stage_id,
            legend_normal: self.view.datarecord.legend_normal || undefined,
            legend_blocked : self.view.datarecord.legend_blocked || undefined,
            legend_done: self.view.datarecord.legend_done || undefined,
        };
        _.map(self.field.selection || [], function(selection_item) {
            var value = {
                'name': selection_item[0],
                'tooltip': selection_item[1],
            };
            if (selection_item[0] === 'normal') {
                value.state_name = stage_data.legend_normal ? stage_data.legend_normal : selection_item[1];
            } else if (selection_item[0] === 'done') {
                value.state_class = 'oe_kanban_status_green';
                value.state_name = stage_data.legend_done ? stage_data.legend_done : selection_item[1];
            } else {
                value.state_class = 'oe_kanban_status_red';
                value.state_name = stage_data.legend_blocked ? stage_data.legend_blocked : selection_item[1];
            }
            _data.push(value);
        });
        return _data;
    },
    render_value: function() {
        this._super();
        $('#' + this.id_for_table).DataTable();
        return;
        this.states = this.prepare_dropdown_selection();
        var self = this;
        // Adapt "FormSelection"
        var current_state = _.find(this.states, function(state) {
            return state.name === self.get('value');
        });
        this.$('.oe_kanban_status')
            .removeClass('oe_kanban_status_red oe_kanban_status_green')
            .addClass(current_state.state_class);

        // Render "FormSelection.Items" and move it into "FormSelection"
        var $items = $(QWeb.render('FormSelection.items', {
            states: _.without(this.states, current_state)
        }));
        var $dropdown = this.$el.find('.dropdown-menu');
        $dropdown.children().remove(); // remove old items
        $items.appendTo($dropdown);
        this.$el.find('a').on('click', this.set_kanban_selection.bind(this));
    },
    /* setting the value: in view mode, perform an asynchronous call and reload
    the form view; in edit mode, use set_value to save the new value that will
    be written when saving the record. */
    __set_kanban_selection: function (ev) {
        var self = this;
        ev.preventDefault();
        var li = $(ev.target).closest('li');
        if (li.length) {
            var value = String(li.data('value'));
            if (this.view.get('actual_mode') == 'view') {
                var write_values = {};
                write_values[self.name] = value;
                return this.view.dataset._model.call(
                    'write', [
                        [this.view.datarecord.id],
                        write_values,
                        self.view.dataset.get_context()
                    ]).done(self.reload_record.bind(self));
            }
            else {
                return this.set_value(value);
            }
        }
    },
    reload_record: function() {
        this.view.reload();
    },
});

core.form_widget_registry
    .add('cmis_viewer', CmisViewer);
});
 
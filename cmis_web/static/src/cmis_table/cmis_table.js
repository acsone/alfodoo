/** @odoo-module **/

/**
 * Most of the code copied from odoo's list_renderer component from 'web'
 */

/* ---------------------------------------------------------
+ * Odoo cmis_web
+ * Authors Laurent Mignon 2016, Quentin Groulard 2023 Acsone SA/NV
+ * License in __openerp__.py at root level of the module
+ *---------------------------------------------------------
+*/

import { CheckBox } from "@web/core/checkbox/checkbox";
import { Dropdown } from "@web/core/dropdown/dropdown";
import { DropdownItem } from "@web/core/dropdown/dropdown_item";
import { Widget } from "@web/views/widgets/widget";

const { Component, useState } = owl;

export class CmisTable extends Component {
    setup() {
        this.allColumns = this.getAllColumns();
        this.state = useState({
            columns: this.getActiveColumns(),
        });
        this.preventReorder = false;
    }

    getAllColumns() {
        return [
            //{id: 1, type: "other", name: "details", label: "", hasLabel: false, active: true, optional: false},   Not implemented: Colum for view details button
            {id: 2, type: "field", name: "name", label: "Name", hasLabel: true, active: true, optional: true},
            {id: 3, type: "field", name: "title", label: "Title", hasLabel: true, active: false, optional: true},
            {id: 4, type: "field", name: "description", label: "Description", hasLabel: true, active: true, optional: true},
            {id: 5, type: "field", name: "lastModificationDate", label: "Modified", hasLabel: true, active: true, optional: true},
            {id: 6, type: "field", name: "creationDate", label: "Created", hasLabel: true, active: false, optional: true},
            {id: 7, type: "field", name: "lastModifiedBy", label: "Modifier", hasLabel: true, active: true, optional: true},
            {id: 8, type: "widget", name: "actions", label: "", hasLabel: false, active: true, optional: false, props: {
                name: "cmis_actions"
            }},
        ];
    }

    getActiveColumns() {
        return this.allColumns.filter((col) => col.active)
    }

    getColumnClass(column) {
        const classNames = ["align-middle"];
        if (this.isSortable(column)) {
            classNames.push("o_column_sortable", "position-relative", "cursor-pointer");
        } else {
            classNames.push("cursor-default");
        }
        if (!this.props.list.orderBy) {
            classNames.join(" ");
        }
        const orderBy = this.props.list.orderBy;
        if (
            orderBy &&
            orderBy.length &&
            //column.widget !== "handle" &&
            orderBy[0].name === column.name &&
            column.hasLabel
        ) {
            classNames.push("table-active");
        }
        if (this.isNumericColumn(column)) {
            classNames.push("o_list_number_th");
        }
        if (column.type === "button_group") {
            classNames.push("o_list_button");
        }
        /* if (column.widget) {
            classNames.push(`o_${column.widget}_cell`);
        } */

        return classNames.join(" ");
    }

    onHoverSortColumn(ev, column) {
        if (!this.props.list.orderBy) {
            return;
        }
        if (this.props.list.orderBy.length && this.props.list.orderBy[0].name === column.name) {
            return;
        } else if (this.isSortable(column)) { //&& column.widget !== "handle") {
            ev.target.classList.toggle("table-active", ev.type == "mouseenter");
        }
    }

    isSortable(column) {
        /* const { hasLabel, name } = column;
        const { sortable } = this.fields[name];
        const { options } = this.props.list.activeFields[name];
        return (sortable || options.allow_order) && hasLabel; */
        return column.hasLabel
    }

    getSortableIconClass(column) {
        if (!this.props.list.cmisObjects) {
            return;
        }
        const { orderBy } = this.props.list;
        const classNames = this.isSortable(column) ? ["fa", "fa-lg", "px-2"] : ["d-none"];
        if (orderBy.length && orderBy[0].name === column.name) {
            classNames.push(orderBy[0].asc ? "fa-angle-up" : "fa-angle-down");
        } else {
            classNames.push("fa-angle-down", "opacity-0", "opacity-75-hover");
        }

        return classNames.join(" ");
    }

    onClickSortColumn(column) {
        if (this.preventReorder) {
            this.preventReorder = false;
            return;
        }
        /* if (this.props.list.editedRecord || this.props.list.model.useSampleModel) {
            return;
        } */
        const fieldName = column.name;
        const list = this.props.list;
        if (this.isSortable(column)) {
            list.sortBy(fieldName);
        }
    }

    isNumericColumn(column) {
        /* const { type } = this.fields[column.name];
        return ["float", "integer", "monetary"].includes(type); */
        return false
    }

    getRowClass(record) {
        // classnames coming from decorations
        /* const classNames = this.props.archInfo.decorations
            .filter((decoration) => evaluateExpr(decoration.condition, record.evalContext))
            .map((decoration) => decoration.class); */
        /* if (record.selected) {
            classNames.push("table-info");
        } */
        // "o_selected_row" classname for the potential row in edition
        /* if (record.isInEdition) {
            classNames.push("o_selected_row");
        }
        if (record.selected) {
            classNames.push("o_data_row_selected");
        }
        if (this.canResequenceRows) {
            classNames.push("o_row_draggable");
        }
        return classNames.join(" "); */
        return ""
    }

    getColumns(record) {
        return this.state.columns;
    }

    getCellClass(column, cmisObject) {
        /* if (!this.cellClassByColumn[column.id]) {
            const classNames = ["o_data_cell"];
            if (column.type === "button_group") {
                classNames.push("o_list_button");
            } else if (column.type === "field") {
                classNames.push("o_field_cell");
                if (
                    column.rawAttrs &&
                    column.rawAttrs.class &&
                    this.canUseFormatter(column, record)
                ) {
                    classNames.push(column.rawAttrs.class);
                }
                const typeClass = FIELD_CLASSES[this.fields[column.name].type];
                if (typeClass) {
                    classNames.push(typeClass);
                }
                if (column.widget) {
                    classNames.push(`o_${column.widget}_cell`);
                }
            }
            this.cellClassByColumn[column.id] = classNames;
        }
        const classNames = [...this.cellClassByColumn[column.id]];
        if (column.type === "field") {
            if (record.isRequired(column.name)) {
                classNames.push("o_required_modifier");
            }
            if (record.isInvalid(column.name)) {
                classNames.push("o_invalid_cell");
            }
            if (record.isReadonly(column.name)) {
                classNames.push("o_readonly_modifier");
            }
            if (this.canUseFormatter(column, record)) {
                // generate field decorations classNames (only if field-specific decorations
                // have been defined in an attribute, e.g. decoration-danger="other_field = 5")
                // only handle the text-decoration.
                const { decorations } = record.activeFields[column.name];
                for (const decoName in decorations) {
                    if (evaluateExpr(decorations[decoName], record.evalContext)) {
                        classNames.push(getClassNameFromDecoration(decoName));
                    }
                }
            }
            if (
                record.isInEdition &&
                this.props.list.editedRecord &&
                this.props.list.editedRecord.isReadonly(column.name)
            ) {
                classNames.push("text-muted");
            } else {
                classNames.push("cursor-pointer");
            }
        }
        return classNames.join(" "); */
        const value = cmisObject.classMapper[column.name]
        return value ? value : ""
    }

    get nbCols() {
        let nbCols = this.state.columns.length;
        /* if (this.hasSelectors) {
            nbCols++;
        }
        if (this.activeActions.onDelete || this.displayOptionalFields) {
            nbCols++;
        } */
        nbCols++;   //Column selector
        return nbCols;
    }

    get getEmptyRowIds() {
        const length = this.props.list.cmisObjects ? this.props.list.cmisObjects.length : 0;
        let nbEmptyRow = Math.max(0, 4 - length);
        /* if (nbEmptyRow > 0 && this.displayRowCreates) {
            nbEmptyRow -= 1;
        } */
        return Array.from(Array(nbEmptyRow).keys());
    }

    canUseFormatter(column, record) {
        return true
    }

    getFormattedValue(column, cmisObject) {
        /* const fieldName = column.name;
        const field = this.fields[fieldName];
        const formatter = formatters.get(field.type, (val) => val);
        const formatOptions = {
            escape: false,
            data: record.data,
            isPassword: "password" in column.rawAttrs,
            digits: column.rawAttrs.digits ? JSON.parse(column.rawAttrs.digits) : field.digits,
            field: record.fields[fieldName],
        };
        return formatter(record.data[fieldName], formatOptions); */
        const value = cmisObject.columnMapper[column.name]
        return value ? value : ""
    }

    toggleOptionalColumn(columnId) {
        let index = this.allColumns.findIndex((col) => col.id === columnId);
        this.allColumns[index].active = !this.allColumns[index].active;
        this.state.columns = this.getActiveColumns();
    }

    get getOptionalColumns() {
        return this.allColumns
            .filter((col) => col.optional)
            .map((col) => ({
                id: col.id,
                label: col.label,
                name: col.name,
                value: col.active,
            }));
    }

    onClickRow(cmisObject) {
        if (cmisObject.baseTypeId === "cmis:folder") {
            this.props.displayFolder({name: cmisObject.name, id: cmisObject.objectId})
        }
    }
}

CmisTable.template = "cmis_web.CmisTable";
CmisTable.rowsTemplate = "cmis_web.CmisTable.Rows";
CmisTable.recordRowTemplate = "cmis_web.CmisTable.RecordRow";

CmisTable.components = { DropdownItem, CheckBox, Dropdown, Widget };

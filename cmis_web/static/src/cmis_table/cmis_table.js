/** @odoo-module **/

/* ---------------------------------------------------------
+ * Odoo cmis_web
+ * Authors Laurent Mignon 2016, Quentin Groulard 2023 Acsone SA/NV
+ * License in __openerp__.py at root level of the module
+ *---------------------------------------------------------
+*/

import { CheckBox } from "@web/core/checkbox/checkbox";
import { Dropdown } from "@web/core/dropdown/dropdown";
import { DropdownItem } from "@web/core/dropdown/dropdown_item";

const { Component, useState } = owl;

export class CmisTable extends Component {
    setup() {
        this.allColumns = this.getAllColumns();
        this.state = useState({
            columns: this.getActiveColumns(),
        });
    }

    getAllColumns() {
        return [
            {id: 1, type: "button_group", name: "details", label: "", active: true, optional: false},
            {id: 2, type: "field", name: "name", label: "Name", active: true, optional: true},
            {id: 3, type: "field", name: "title", label: "Title", active: false, optional: true},
            {id: 4, type: "field", name: "description", label: "Description", active: true, optional: true},
            {id: 5, type: "field", name: "modified", label: "Modified", active: true, optional: true},
            {id: 6, type: "field", name: "modifier", label: "Modifier", active: false, optional: true},
            {id: 7, type: "button_group", name: "actions", label: "", active: true, optional: false},
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
        /* const orderBy = this.props.list.orderBy;
        if (
            orderBy.length &&
            column.widget !== "handle" &&
            orderBy[0].name === column.name &&
            column.hasLabel
        ) {
            classNames.push("table-active");
        } */
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

    isSortable(column) {
        /* const { hasLabel, name } = column;
        const { sortable } = this.fields[name];
        const { options } = this.props.list.activeFields[name];
        return (sortable || options.allow_order) && hasLabel; */
        return false
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

    getCellClass(column, record) {
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
        return ""
    }

    canUseFormatter(column, record) {
        return true
    }

    getFormattedValue(column, record) {
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
        return record[column.name]
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
}

CmisTable.template = "cmis_web.CmisTable";
CmisTable.rowsTemplate = "cmis_web.CmisTable.Rows";
CmisTable.recordRowTemplate = "cmis_web.CmisTable.RecordRow";

CmisTable.components = { DropdownItem, CheckBox, Dropdown };

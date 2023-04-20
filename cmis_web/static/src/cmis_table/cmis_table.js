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

import {CheckBox} from "@web/core/checkbox/checkbox";
import {CmisObjectCollection} from "../cmis_object_wrapper_service";
import {Dropdown} from "@web/core/dropdown/dropdown";
import {DropdownItem} from "@web/core/dropdown/dropdown_item";
import {Widget} from "@web/views/widgets/widget";

const {Component, useState} = owl;

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
            {
                id: 1,
                type: "field",
                name: "name",
                label: "Name",
                hasLabel: true,
                active: true,
                optional: true,
            },
            {
                id: 2,
                type: "field",
                name: "title",
                label: "Title",
                hasLabel: true,
                active: false,
                optional: true,
            },
            {
                id: 3,
                type: "field",
                name: "description",
                label: "Description",
                hasLabel: true,
                active: true,
                optional: true,
            },
            {
                id: 4,
                type: "field",
                name: "lastModificationDate",
                label: "Modified",
                hasLabel: true,
                active: true,
                optional: true,
            },
            {
                id: 5,
                type: "field",
                name: "creationDate",
                label: "Created",
                hasLabel: true,
                active: false,
                optional: true,
            },
            {
                id: 6,
                type: "field",
                name: "lastModifiedBy",
                label: "Modifier",
                hasLabel: true,
                active: true,
                optional: true,
            },
            {
                id: 7,
                type: "widget",
                name: "actions",
                label: "",
                hasLabel: false,
                active: true,
                optional: false,
                props: {name: "cmis_actions"},
            },
        ];
    }

    getActiveColumns() {
        return this.allColumns.filter((col) => col.active);
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

        return classNames.join(" ");
    }

    onHoverSortColumn(ev, column) {
        if (!this.props.list.orderBy) {
            return;
        }
        if (
            this.props.list.orderBy.length &&
            this.props.list.orderBy[0].name === column.name
        ) {
            return;
        } else if (this.isSortable(column)) {
            ev.target.classList.toggle("table-active", ev.type === "mouseenter");
        }
    }

    isSortable(column) {
        return column.hasLabel;
    }

    getSortableIconClass(column) {
        if (!this.props.list.cmisObjects) {
            return;
        }
        const {orderBy} = this.props.list;
        const classNames = this.isSortable(column)
            ? ["fa", "fa-lg", "px-2"]
            : ["d-none"];
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
        const fieldName = column.name;
        const list = this.props.list;
        if (this.isSortable(column)) {
            list.sortBy(fieldName);
        }
    }

    isNumericColumn() {
        return false;
    }

    getRowClass() {
        return "";
    }

    getColumns() {
        return this.state.columns;
    }

    getCellClass(column, cmisObject) {
        const value = cmisObject.classMapper[column.name];
        return value ? value : "";
    }

    get nbCols() {
        let nbCols = this.state.columns.length;
        // Column selector
        nbCols++;
        return nbCols;
    }

    get getEmptyRowIds() {
        const length = this.props.list.cmisObjects
            ? this.props.list.cmisObjects.length
            : 0;
        const nbEmptyRow = Math.max(0, 4 - length);
        return Array.from(Array(nbEmptyRow).keys());
    }

    canUseFormatter() {
        return true;
    }

    getFormattedValue(column, cmisObject) {
        const value = cmisObject.columnMapper[column.name];
        return value ? value : "";
    }

    toggleOptionalColumn(columnId) {
        const index = this.allColumns.findIndex((col) => col.id === columnId);
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
            this.props.displayFolder({name: cmisObject.name, id: cmisObject.objectId});
        }
    }
}

CmisTable.template = "cmis_web.CmisTable";
CmisTable.rowsTemplate = "cmis_web.CmisTable.Rows";
CmisTable.recordRowTemplate = "cmis_web.CmisTable.RecordRow";

CmisTable.components = {DropdownItem, CheckBox, Dropdown, Widget};

export const cmisTableProps = {
    list: [CmisObjectCollection, Array],
    displayFolder: Function,
    renameObject: Function,
    updateDocumentContent: Function,
    deleteObject: Function,
};
CmisTable.props = cmisTableProps;

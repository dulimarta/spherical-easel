import {ActionMode, ToolButtonType} from "@/types";

export const toolDictionary: Map<ActionMode, ToolButtonType> = new Map()
toolDictionary.set("select", {
    id: 0,
    actionModeValue: "select",
    displayedName: "SelectDisplayedName",
    icon: "$vuetify.icons.value.select",
    toolTipMessage: "SelectToolTipMessage",
    toolUseMessage: "SelectToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})
toolDictionary.set("delete", {
    id: 5,
    actionModeValue: "delete",
    displayedName: "DeleteDisplayedName",
    icon: "$vuetify.icons.value.delete",
    toolTipMessage: "DeleteToolTipMessage",
    toolUseMessage: "DeleteToolUseMessage",
    displayToolUseMessage: false,
    disabledIcon: "$vuetify.icons.value.blank" // doesn't work yet - see ToolButton.vue comment in HTML
})




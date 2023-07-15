// import {ref} from "vue"
import { DialogAction } from "@/components/Dialog.vue";
const dialogQueue: Array<DialogAction> = []
export function useDialogSequencer() {

  function showDialog(d: DialogAction) {
    console.debug("showDialog: queue length", dialogQueue.length)
    const pos = dialogQueue.findIndex((z: DialogAction) => z == d)
    if (pos < 0) {
      dialogQueue.push(d)
      if (dialogQueue.length == 1) {
        d.show()
      }
    } else
      console.debug("Attempt to show duplicate dialog")

  }

  function hideDialog(d: DialogAction) {
    console.debug("hideDialog: queue length", dialogQueue.length)
    const pos = dialogQueue.findIndex((z: DialogAction) => z == d)
    if (pos >= 0) {
      dialogQueue[pos].hide()
      dialogQueue.splice(pos, 1)
    }
    if (dialogQueue.length > 0) {
      dialogQueue[0].show()
    }
  }

  function hideLastDialog():boolean {
    console.debug("hideLastDialog: queue length", dialogQueue.length)
    if (dialogQueue.length === 0) return false
    const d = dialogQueue.shift()
    d?.hide()
    if (dialogQueue.length > 0) {
      dialogQueue[0].show()
    }
    return true
  }

  return {showDialog,hideDialog, hideLastDialog}
}
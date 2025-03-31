<template>
  <v-dialog
    :modelValue="modelValue"
    @update:modelValue="handleUpdateModelValue"
    max-width="500px"
  >
    <v-card color="#E8F5F1" theme="light" style="overflow: hidden;">
      <v-card-title class="text-mint-dark">
        Construction Organization
      </v-card-title>

      <!-- Increased padding with direct style -->
      <div style="padding: 16px;">
        <FolderActions
          :newFolderName="newFolderName"
          :parentFolder="parentFolder"
          @move="moveConstruction"
        />
      </div>

      <!-- Direct padding style -->
      <v-card-text style="
        padding: 24px !important;
        max-height: 800px;
        overflow-y: auto; /* Vertical scrollbar */
        max-width: 100%; 
        overflow-x: auto; /* Horizontal scrollbar */
        white-space: nowrap; 
      ">
        <v-treeview
          v-model:selected="checkedConstructions"
          :items="treeItems"
          hoverable
          activatable
          item-title="title"
          class="mt-4"
          color="#40A082"
          @update:active="handleNodeSelection"
          return-object
          :select-strategy="'leaf'"
        />
      </v-card-text>

      <!-- Direct padding for card actions -->
      <v-card-actions style="padding: 16px 24px !important;">
        <v-spacer></v-spacer>
        <v-btn color="#40A082" @click="emit('update:modelValue', false)">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { defineProps, defineEmits, ref, onMounted } from 'vue';
import FolderActions from '@/components/FolderActions.vue';
import { VTreeview } from 'vuetify/labs/VTreeview';


const props = defineProps({
  modelValue: Boolean, // Prop for dialog visibility
  treeItems: Array, // Prop for tree data
});

const emit = defineEmits<{
  (e: 'move', checked: any, newFolderName: string): void;
  (e: 'close'): void;
  (e: 'update:modelValue', newValue: boolean): void; // Explicitly define this event
}>();
const checkedConstructions = ref([]); // Holds selected nodes
const newFolderName = ref(''); // For new folder name
const parentFolder = ref(''); // For parent folder selection

// Handle selection of tree nodes
function handleNodeSelection(value: string[]) {
  console.log('Selected node(s):', value);
}

// Handle move construction
function moveConstruction() {
  emit('move', checkedConstructions.value, newFolderName.value);
  newFolderName.value = '';
}

// Emit update to parent when dialog visibility changes
function handleUpdateModelValue(newValue: boolean) {
  emit('update:modelValue', newValue);
}
onMounted(() => {
  console.log('Tree items:', props.treeItems);
});

</script>

<style scoped>
/* More specific and forceful styles */
:deep(.v-card-text) {
  padding: 24px !important;
}

:deep(.v-card-actions) {
  padding: 16px 24px !important;
}

:deep(.v-text-field) {
  margin-bottom: 16px !important;
}
</style>
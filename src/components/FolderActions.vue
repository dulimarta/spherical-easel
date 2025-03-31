<template>
    <v-row>
      <v-col cols="12">
        <v-btn-group variant="outlined" class="w-100">
          <v-btn
            color="#40A082"
            prepend-icon="mdi-folder-move"
            size="small"
            @click="$emit('move')"
          >
            Move
          </v-btn>
        </v-btn-group>
      </v-col>
    </v-row>
    <v-row class="mt-4">
      <v-col cols="12">
        <!-- Use :value and emit update event for two-way binding -->
        <v-text-field
          :value="newFolderName"
          @input="$emit('update:newFolderName', $event)"
          label="New Folder Name"
          variant="outlined"
          dense
        />
        <v-text-field
          :value="parentFolder"
          @input="$emit('update:parentFolder', $event)"
          label="New Folder Location"
          variant="outlined"
          dense
        />
      </v-col>
    </v-row>
  </template>

  <script lang="ts" setup>
  import { defineProps, defineEmits } from "vue";

  // Define the props that will be passed from the parent
  const props = defineProps({
    newFolderName: String,
    parentFolder: String,
  });

  // Define the emit events that the component will use to communicate with the parent
  const emit = defineEmits<{
    (e: 'move'): void;
    (e: 'update:newFolderName', value: string): void;
    (e: 'update:parentFolder', value: string): void;
  }>();
  </script>

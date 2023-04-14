<template>
    <v-card class = "cards">
        <v-card-title
        style="justify-content:center
        flex-wrap:nowrap
        white-space: nowrap
        overflow: hidden
        text-overflow: ellipsis">
            <v-col style="flex-grow:2">
                <v-btn style="font-size:2rem;" @click="addToolToFavorites(mainListIndex)">
                    +
                </v-btn>
            </v-col>
            <v-col style="flex-grow:8;">
                <div style="text-align:center; align-self:center;">
                    {{ listTitle }}
                </div>
            </v-col>
            <v-col style="flex-grow:2">
                <v-btn style="font-size:2rem;" @click="removeToolFromFavorites(selectedIndex)">
                        -
                </v-btn>
            </v-col>
        </v-card-title>
        <v-card-text style="height:100%">
            <v-list class="secondaryList">
                <v-list-item-group v-model="selectedIndex">
                    <v-list-item v-for="item in itemList" :key="item.icon"
                    :disabled="item.disabled">
                        <v-list-item-icon>
                            <v-icon v-text="item.icon"></v-icon>
                        </v-list-item-icon>
                    <v-list-item-content
                    v-html="$t('buttons.' + item.displayedName)">
                    </v-list-item-content>
                    </v-list-item>
                </v-list-item-group>
            </v-list>
        </v-card-text>
    </v-card>
</template>

<style lang="scss" scoped>
    .cards {
        min-width: 235px;
    }

    .secondaryList {
        height: 362px;
        overflow-y: auto;
    }
</style>

<script lang="ts">
import { FavoriteTool } from '@/types'
import { Vue, Prop, Component } from 'vue-property-decorator';

@Component({
    computed: {}
})

    export default class FavoriteToolsCard extends Vue{
       @Prop()
       itemList!: FavoriteTool[];
       @Prop()
       itemListBackend!: FavoriteTool[];
       @Prop()
       mainList!: FavoriteTool[];
       @Prop()
       listTitle: string | undefined;
       @Prop()
       mainListIndex!: number | null;
       @Prop()
       maxFavoriteToolsLimit!: number;

       selectedIndex: number | null = null;

       addToolToFavorites(index: number | null): void{
            if (index === null) return;
            if (this.itemList.length >= this.maxFavoriteToolsLimit) return;

            let toolName = this.mainList[index].actionModeValue;


            this.itemList.push(Object.assign({}, this.mainList[index]));
            this.itemListBackend.push(Object.assign({}, this.mainList[index]));

            this.mainList[index].disabled = true;
            this.itemList[this.itemList.length - 1].disabled = false;

            this.mainListIndex = null;


       }

        removeToolFromFavorites(index: number | null): void {
            if (index === null) return

            let toolName = this.itemList[index].actionModeValue;

            let indexDelta = this.itemList.length - this.itemListBackend.length;
            let userFavoriteToolsIndex = index - indexDelta;

            this.itemList.splice(index, 1)
            this.itemListBackend.splice(userFavoriteToolsIndex, 1)

            let allToolsListIndex = this.mainList.findIndex(tool => tool.actionModeValue === toolName);
            this.mainList[allToolsListIndex].disabled = false;

            this.selectedIndex = null;
        }
    }


</script>
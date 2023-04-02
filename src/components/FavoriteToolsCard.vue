<template>
    <v-card class = "cards">
        <v-card-title
        style="justify-content:center;
        flex-wrap:nowrap;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;">
            <v-col style="flex-grow:2">
                <v-btn style="font-size:2rem;">
                    +
                </v-btn>
            </v-col>
            <v-col style="flex-grow:8;">
                <div style="text-align:center; align-self:center;">
                    {{ listTitle }} Test
                </div>
            </v-col>
            <v-col style="flex-grow:2">
                <v-btn style="font-size:2rem;">
                        -
                </v-btn>
            </v-col>
        </v-card-title>
        <v-card-text style="height:100%">
            <v-list class="secondaryList">
                <v-list-item-group>
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
import { Vue, Prop } from 'vue-property-decorator';

    export default class FavoriteToolsCard extends Vue{
       @Prop({ type: Array, required: true}) itemList!: FavoriteTool[]
       @Prop({ type: String, required: true}) listTitle!: string

       created(){
        console.log(this.listTitle);
        console.log("FavoriteToolsCard created");
       }
    }
</script>
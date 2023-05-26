<script setup>
  import { onMounted } from 'vue';

  defineProps({
    prompts: Array,
    send_prompt: Function,
    delete_prompt: Function,
  })

  onMounted(() => 
  {
  })
</script>

<template>
  <div class="prompts">
    <div class="prompt" v-for="prompt in prompts" :class="{clickable: !prompt.edit}">
      <div class="prompt_show" v-if="!prompt.edit">
        <div class="prompt_data" @click="send_prompt(prompt.contents)">
          <div class="prompt_title">{{prompt.name}}</div>
          <div class="prompt_contents">{{prompt.contents}}</div>
        </div>
        <div class="prompt_buttons">
          <button class="btn btn-primary" @click="prompt.edit=true">Edit</button>              
          <button class="btn btn-primary" @click="delete_prompt(prompt)">Delete</button>
          <button class="btn btn-primary" @click="prompt.is_quick=!prompt.is_quick">
            {{ prompt.is_quick ? "Unquick" : "Quick" }}
          </button>
        </div>
      </div>

      <div class="prompt_edit" v-if="prompt.edit">
        <div class="prompt_data">
          <label>Name</label>
          <input type="text" v-model="prompt.name">
          <label>Contents</label>
          <textarea v-model="prompt.contents"></textarea>
        </div>
        <div class="prompt_buttons">
          <button class="btn btn-primary" @click="prompt.edit=false">Done</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
  .prompts 
  {
    margin-top: 15px;
    margin-bottom: 15px;
    display: flex;
    flex-direction: column;
    row-gap: 10px;

    .prompt 
    {
      background-color: #343541;
      padding-left: 10px;
      padding-right: 10px;
      padding-top: 5px;
      padding-bottom: 10px;
      transition: box-shadow 0.1s ease-in-out, transform 0.05s ease-in-out;;

      &.clickable:hover
      {
        box-shadow: 0 0 3px 1px #6bbcffb2;
      }

      &.clickable:active {
        transform: scale(0.99);
      }

      .prompt_show
      {
        display: flex;
        column-gap: 10px;

        .prompt_data
        {
          flex-grow: 1;

          .prompt_title
          {
            font-size: 18px;
            font-weight: bold
          }
        }
      }

      .prompt_edit
      {
        display: flex;
        column-gap: 10px;

        .prompt_data
        {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          row-gap: 5px;

          input, textarea {
            background-color: #40414f;
          }
        }
      }

      .prompt_buttons
      {
        top: 10px;
        right: 10px;     
        display: flex;
        flex-direction: column;    
        row-gap: 10px;
        align-items: center;
        justify-content: center;
      }
    }
  }
</style>

<script setup>
  import { onMounted, reactive, computed, ref, toRaw, watch } from 'vue';

  import PromptsList from "./PromptsList.vue"

  import Papa from "papaparse"

  // State and Computed
  // ==========================================================================
  const state = reactive(
  {
    history_visible: true,
    container_centered: false,

    main_title: "FoxPrompt",
    mode: "helper",
    move_data: null,

    prompts: [],
  });

  const history_action = computed(() => state.history_visible ? "Hide" : "Show")
  const quick_prompts = computed(() => state.prompts.filter(x => x.is_quick))
  const other_prompts = computed(() => state.prompts.filter(x => !x.is_quick))

  // Control Toggling of Chat GPT History and Accounts panel
  // ==========================================================================
  async function toggle_history()
  {
    const histories_element = document.querySelector("div#__next > div:nth-child(3) > div:first-child");

    if (state.history_visible)
      histories_element.style.display = "none";
    else
      histories_element.style.display = "flex";

      state.history_visible = !state.history_visible;   
  }

  // Manage Prompt Data
  // ==========================================================================
  async function get_prompts()
  {
    const response = await browser.runtime.sendMessage({
      command: "retrieve",
      key: "prompts"
    });

    if (response.success)
    {
      const prompts = response.data;

      prompts.sort((a, b) => b.id - a.id);

      for (const prompt of prompts)
        prompt.edit = false;

      state.prompts = prompts;
    }
    else
    {
      state.prompts = []
    }
  }

  async function store_prompts(prompts)
  {
    const data = toRaw(prompts).map(x =>
    {
      const {id, name, contents, is_quick} = x;
      return {id, name, contents, is_quick};
    })

    const response = await browser.runtime.sendMessage({
      command: "store",
      key: "prompts",
      data: data
    });
  }

  async function delete_prompt(prompt)
  {    
    state.prompts = state.prompts.filter(x => x.id != prompt.id);
  }

  async function new_prompt()
  {
    const prompt = {id: state.prompts.length, name: "", contents: "", edit: true, is_quick: false};
    state.prompts.unshift(prompt);
  }

  // Before we tried to watch the page for changes to the submit button but there were race
  // conditions, now we check the page if the user tries to send a prompt
  function check_if_chat_thinking()
  {
    const send_button = document.querySelector('textarea + button');
    if (send_button) 
    {
      const child = send_button.firstChild;
      if (child && child.tagName.toLowerCase() === 'div') 
        return true;
    }

    return false;
  }

  async function send_prompt(prompt)
  {
    if (check_if_chat_thinking())
    {
      alert("Chat is currently thinking, please wait!")
      return
    }

    const prompt_text_element = document.querySelector("textarea");
    prompt_text_element.value = prompt;

    var event = new Event('input', { bubbles: true }); // bubble important!
    prompt_text_element.dispatchEvent(event);

    document.querySelector("textarea + button").click();

    if (state.mode == "prompt library")
      close_prompt_library()
  }

  function export_prompts()
  {
    const prepared_data = state.prompts.map(({ name, contents }) => ({ name, contents }));
    const csv = Papa.unparse(prepared_data);
    const csv_file = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const blob_url = URL.createObjectURL(csv_file);

    const link = document.createElement('a');
    link.href = blob_url;
    link.download = 'prompts.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function import_prompts() 
  {
    // Create a hidden file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.style.display = 'none';
    document.body.appendChild(input);

    // Process the file and destroy the input
    input.addEventListener('change', function(e)
    {
      const file = e.target.files[0];

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: results => 
        {   
          if (!(results.meta.fields.includes("name") && results.meta.fields.includes("contents")))
          {
            alert("Invalid headers in file: " + results.meta.fields);
            return;
          }

          for (const row of results.data)
          {            
            row.id = state.prompts.length;
            row.edit = false;
            row.is_quick = false
            state.prompts.unshift(row);
          }
        },
        error: error => alert("Problems importing file: " + error.message)
      });

      document.body.removeChild(input);
    });

    input.click();
  }

  // Container Morphing Animation Code 
  // ==========================================================================
  const main_element = ref(null);

  const moveDivToCenter = (targetWidth, speed=0.01, resolve=null, data=null) => 
  {
    if (data == null)
    {
      const rect = main_element.value.getBoundingClientRect();

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const windowCenterX = window.innerWidth / 2;
      const windowCenterY = window.innerHeight / 2;

      const target_right = windowCenterX - (targetWidth / 2)

      const style = window.getComputedStyle(main_element.value);
      const right = parseInt(style.getPropertyValue('right'), 10);

      data = {
        x_step: (windowCenterX - centerX) * speed,
        y_step: (windowCenterY - centerY) * speed,
        width_step: (targetWidth - main_element.value.offsetWidth) * speed,
        right_step: (target_right - right) * speed,        
        delta_x: 0,
        delta_y: 0,
        width: main_element.value.offsetWidth,
        right: right,
        ticks_remaining: 1 / speed,
      }
    }

    data.delta_y += data.y_step;   
    data.width += data.width_step;
    data.right += data.right_step;
    data.ticks_remaining -= 1;    

    main_element.value.style.transform = `translate(${data.delta_x}px, ${data.delta_y}px)`;
    main_element.value.style.width = `${data.width}px`;
    main_element.value.style.right = `${data.right}px`;

    if (data.ticks_remaining > 0) {
      requestAnimationFrame(() => moveDivToCenter(targetWidth, speed, resolve, data));
    }
    else
    {
      if (resolve != null)
      {        
        data.ticks_remaining = 1 / speed; // reset for later
        resolve(data);
      }
    }
  };

  // We just go backwards here, don't be fancy
  const moveDivToTopRight = (data, resolve=null) => 
  {
    data.delta_y -= data.y_step;
    data.width -= data.width_step; 
    data.right -= data.right_step;
    data.ticks_remaining -= 1;

    main_element.value.style.transform = `translate(${data.delta_x}px, ${data.delta_y}px)`;
    main_element.value.style.width = `${data.width}px`;
    main_element.value.style.right = `${data.right}px`;

    if (data.ticks_remaining > 0)
      requestAnimationFrame(() => moveDivToTopRight(data, resolve));
    else
    {
      if (resolve != null)
        resolve();
    }
  };

  async function show_prompt_library()
  {
    if (state.mode == "helper")
    {
      // Triggers the fade away of the helper and the @after-leave
      // will call this function again
      state.mode = "";    
      return // we'll be back
    }

    state.move_data = await new Promise(resolve => moveDivToCenter(800, 0.09, resolve))
    state.container_centered = true;
    main_element.value.style.transform = "";
    main_element.value.style.width = "";
    main_element.value.style.right = "";    
    state.main_title = "Prompt Library"
    state.mode = "prompt library"
  }

  async function close_prompt_library()
  {
    if (state.mode == "prompt library")
    {
      // Triggers the fade away of the prompt library and the @after-leave
      // will call this function again
      state.mode = "";
      return // we'll be back
    }

    main_element.value.style.transform = `translate(${state.move_data.delta_x}px, ${state.move_data.delta_y}px)`;
    main_element.value.style.width = `${state.move_data.width}px`;
    main_element.value.style.right = `${state.move_data.right}px`;
    state.container_centered = false;

    await new Promise(resolve => moveDivToTopRight(state.move_data, resolve))
    state.main_title = "FoxPrompt"
    state.mode = "helper"
  }

  // Startup
  // ==========================================================================
  async function startup()
  {
    await get_prompts();

    watch(
      () => state.prompts,     
      () => store_prompts(state.prompts),
      { deep: true }
    )
  }

  onMounted(() => 
  {
    startup();
  })
</script>

<template>
  <Transition name="basic_fade">
    <div id="modal_blur" v-if="state.container_centered"></div>    
  </Transition>

  <div id="extension_main_container" ref="main_element" :class="{centered: state.container_centered}">
    <div class="heading">
      <h2>{{state.main_title}}</h2>
      <div v-if="state.mode=='prompt library'" class="spacer"></div>
      <button v-if="state.mode=='prompt library'" @click="import_prompts()" class="btn btn-primary">
        Import
      </button>      
      <button v-if="state.mode=='prompt library'" @click="export_prompts()" class="btn btn-primary">
        Export
      </button>
      <button v-if="state.mode=='prompt library'" @click="new_prompt()" class="btn btn-primary">
        Add Prompt
      </button>
      <button v-if="state.mode=='prompt library'" @click="close_prompt_library()" class="btn btn-primary">
        Close
      </button>
    </div>

    <Transition name="basic_fade" @after-leave="show_prompt_library()">
      <div class="helper" v-if="state.mode == 'helper'">
        <button @click="show_prompt_library()" class="btn btn-primary">Prompt Library</button>
        <div class="quick_prompts">
          <label>Quick Prompts</label>
          <button v-for="prompt in quick_prompts" class="btn btn-primary" 
                  @click="send_prompt(prompt.contents)">
            {{prompt.name}}
          </button>
        </div>
        <label>Other Tools</label>
        <button @click="toggle_history()" class="btn btn-primary">{{history_action}} Histories</button>
      </div>
    </Transition>

    <Transition name="basic_fade" @after-leave="close_prompt_library()">    
    <div class="prompt_library" v-if="state.mode == 'prompt library'">
      <label>Quick Prompts</label>
      <PromptsList :prompts="quick_prompts" :send_prompt="send_prompt" :delete_prompt="delete_prompt">        
      </PromptsList>

      <label>Other Prompts</label>
      <PromptsList :prompts="other_prompts" :send_prompt="send_prompt" :delete_prompt="delete_prompt">        
      </PromptsList>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss">

  #modal_blur
  {
    position: fixed;
    top: 0px;
    left: 0px;
    z-index: 1000;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(5px);
  }

  .basic_fade-enter-active, .basic_fade-leave-active {
      Transition: opacity 0.25s;
  }

  .basic_fade-enter-from, .basic_fade-leave-to {
      opacity: 0;
  }

  #extension_main_container
  {
    position: fixed;
    top: 20px;
    right: 30px;
    padding: 10px;
    border: 1px solid silver;
    // background-color: rgba(32,33,35,var(--tw-bg-opacity));
    background-color: #202123;
    width: 160px;
    z-index: 1001;
    color: white;

    &.centered 
    {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 800px;
      max-height: 600px;
      overflow: auto;

      @media only screen and (max-width: 850px)
      {
        & { 
          width: 95%;
          max-height: 95%;
        }
      }
    }

    .heading
    {
      display: flex;
      flex-direction: row;
      column-gap: 10px;
      align-items: center;
      justify-content: center;

      .spacer { flex-grow: 1}

      h2 {
        border-bottom: 1px solid silver;
        padding-bottom: 5px;
      }
    }
  }

  label { font-weight: 700 }

  .helper
  {
    padding-top: 10px;
    display: flex;
    flex-direction: column;
    row-gap: 10px;

    .quick_prompts 
    {
      display: flex;
      flex-direction: column;
      row-gap: 10px;
      align-items: stretch;
    }

    .btn { 
      justify-content: center;
    }
  }
</style>

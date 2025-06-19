<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import "$lib/style.css";
   import { request, gql } from 'graphql-request';
  const dispatch = createEventDispatcher();

  let title = '';
  let category = '';
  let date = '';
  let inputText = ""; 
    let suggestions: Array<{ id: string; name: string; district: string; state: string }> = [];

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api`;
    const GRAPHQL_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/graphql`;

  async function fetchSuggestionsCity(text: string) {
        if (text.length === 0) {
            suggestions = [];
            return;
        }

        const query = gql`
            query GetCities($nameLike: String) {
                getCities(nameLike: $nameLike) {
                    id
                    name
                    district
                    state
                }
            }
        `;

        try {
            const response = await request(GRAPHQL_URL, query, { nameLike: text });
            suggestions = response.getCities || [];
        } catch (error) {
            console.error("Fehler beim Abrufen der Vorschläge:", error);
        }
    }
          function selectSuggestionCity(suggestion: { id: string; name: string }) {
        inputText = suggestion.name;
        suggestions = []; 
          }

</script>



<div class="sosp-container">
  <h1 class="sosp-header"> Filter </h1>
  <label>
    City:
     <input id="ort" type="text" class="sosp-input" placeholder="Enter city location" bind:value={inputText} on:input={(e) => fetchSuggestionsCity(e.target.value)} />
      {#if suggestions.length > 0}
        <div class="dropdown">
            {#each suggestions as suggestion}
                <div
                    class="dropdown-item"
                    on:click={() => selectSuggestionCity(suggestion)}>
                    {suggestion.name} ({suggestion.district}, {suggestion.state})
                </div>
            {/each}
        </div>
    {/if}
  </label>

  <label>
  Event name:
  <input type="text" class="sosp-input" bind:value={title} placeholder="Enter event name" />
</label>

  <label>
    Date:
    <input type="date" bind:value={date} />
  </label>

  <button class="sosp-button" on:click={() => dispatch('filter', { title, category, date, city: inputText })}>
    Apply
  </button>
</div>

<style>
.sosp-container {
        max-width: 600px;
        width: 100%;
    }
    </style>
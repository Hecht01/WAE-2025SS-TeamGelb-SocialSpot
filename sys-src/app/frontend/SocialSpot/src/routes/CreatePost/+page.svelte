<style>
    .sosp-container {
        max-width: 600px;
        width: 100%;
    }
    .file-upload-label {
        display: inline-block;
        padding: 0.75rem 1.5rem;
        background: #fff;
        color: #D7264E;
        border: 2px solid #231942;
        border-radius: 0.5rem;
        font-size: 1rem;
        font-weight: bold;
        cursor: pointer;
        transition: background 0.2s, color 0.2s;
        margin-top: 1rem;
        margin-bottom: 0.5rem;
        text-align: center;
    }
    .file-upload-label:hover {
        background: #D7264E;
        color: #fff;
    }
    .file-upload-input {
        display: none;
    }

    .dropdown {
        position: absolute;
        background-color: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        max-height: 200px;
        overflow-y: auto;
        width: 100%;
        z-index: 1000;
    }

    .dropdown-item {
        padding: 8px;
        cursor: pointer;
    }

    .dropdown-item:hover {
        background-color: #f0f0f0;
    }
  
</style>


<!--==========================================================================================================================================-->
<!-- create event components -->
<script lang="ts">
    import "$lib/style.css";
    import { onMount } from "svelte";
    import { gql, request } from "graphql-request";

    const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api`;
    const GRAPHQL_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/graphql`;

    let title = '';
    let description = '';
    let date = '';
    let time = '';
    let cityId = 1; 
    let filename = '';
    let imageUrl = '';
    let selectedFile: File | null | undefined = null;
    let uploadedImageFilename = '';

    let inputText = ""; 
    let suggestions: Array<{ id: string; name: string; district: string; state: string }> = []; 
    let selectedCityId: string | null = null; 
  
    
    async function fetchSuggestions(text: string) {
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

        console.log("GraphQL Query:", query);
        console.log("Variables:", { nameLike: text });
        console.log("API URL:", GRAPHQL_URL);
    }

    
    function selectSuggestion(suggestion: { id: string; name: string }) {
        inputText = `${suggestion.name}, ${suggestion.district}, ${suggestion.state}`;
        cityId = parseInt(suggestion.id, 10); 
        suggestions = []; 
        console.log("Ausgewählte Stadt-ID:", cityId); 
    }

    

    function handleFileChange(e: Event) {
        const file = (e.target as HTMLInputElement).files?.[0];
        selectedFile = file;
        filename = file?.name || '';
        uploadedImageFilename = filename;
        if (file) {
            imageUrl = URL.createObjectURL(file);
        } else {
            imageUrl = '';
        }
    }

    async function uploadImage() {
        if (!selectedFile) {
            return null;
        }

        const formData = new FormData();
        formData.append('image', selectedFile);

        try {
            const response = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Image uploaded successfully:', result);
            return result.filename;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }

    async function createEvent() {
        try {
            console.log('selectedFile:', selectedFile);
            console.log('uploadedImageFilename:', uploadedImageFilename);
            if (selectedFile !== null && uploadedImageFilename !== '') 
            {
                uploadedImageFilename = await uploadImage();
                console.log('Image uploaded:', uploadedImageFilename);
            }
            const query = `
                mutation Mutation(
                    $title: String!,
                    $description: String!,
                    $date: String!,
                    $time: String!,
                    $cityId: Int!,
                    $imageUrl: String
                ) {
                    createEvent(
                        title: $title,
                        description: $description,
                        date: $date,
                        time: $time,
                        cityId: $cityId,
                        imageUrl: $imageUrl
                    )
                }
            `;

            const variables = {
                title,
                description,
                date,
                time,
                cityId,
                imageUrl: uploadedImageFilename || null
            };

            const response = await fetch(GRAPHQL_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: "include",
                body: JSON.stringify({
                    query,
                    variables
                })
            });

            const result = await response.json();

            if (result.errors) {
                console.error('GraphQL errors:', result.errors);
                alert('Error creating event: ' + result.errors[0].message);
                return;
            }

            console.log('Event created:', result.data.createEvent);

            // Reset form
            title = '';
            description = '';
            date = '';
            time = '';
            filename = '';
            imageUrl = '';
            selectedFile = null;
            uploadedImageFilename = '';
        } catch (error) {
            console.error('Error creating event:', error);
        }
    }

    async function handleSubmit(event: SubmitEvent) {
        event.preventDefault();
        await createEvent();
    }
</script>


<!--==========================================================================================================================================-->
<!-- Content of Page -->
<form on:submit={handleSubmit}>
<div class="sosp-container">
    <label for="titel">Titel</label>
    <input id="titel" type="text" class="sosp-input" placeholder="Titel des Events" bind:value={title} required/>

    <label for="ort" style="margin-top:1rem;">Ort</label>
    <input id="ort" type="text" class="sosp-input" placeholder="Ort an dem das Event stattfindet" bind:value={inputText} on:input={(e) => fetchSuggestions(e.target.value)} />

    <!-- Dropdown für Vorschläge -->
    {#if suggestions.length > 0}
        <div class="dropdown">
            {#each suggestions as suggestion}
                <div
                    class="dropdown-item"
                    on:click={() => selectSuggestion(suggestion)}>
                    {suggestion.name} ({suggestion.district}, {suggestion.state})
                </div>
            {/each}
        </div>
    {/if}

    <label for="beschreibung" style="margin-top:1rem;">Beschreibung</label>
    <input id="beschreibung" type="text" class="sosp-input" placeholder="Beschreibung des Events" bind:value={description} required/>

    <label for="startdatum" style="margin-top:1rem;">Startdatum</label>
    <input id="startdatum" type="date" class="sosp-input" placeholder="Startdatum" bind:value={date} required/>

    <label for="dauer" style="margin-top:1rem;">Dauer des Events (in Tagen)</label>
    <input id="dauer" type="number" class="sosp-input" placeholder="Dauer des Events in Tagen" min="1" />
    
    <label for="startzeit" style="margin-top:1rem;">Startzeit</label>
    <input id="startzeit" type="time" class="sosp-input" placeholder="Startzeit" bind:value={time} required/>

    <label for="bild" style="margin-top:1rem;">Bild hochladen</label>
    {#if imageUrl}
        <img src={imageUrl} alt="Vorschau" style="max-width: 100%; margin-top: 1rem; border-radius: 0.5rem;" />
    {:else}
        <label class="file-upload-label" for="bild">
            Bild auswählen
            <input
                id="bild"
                type="file"
                class="file-upload-input"
                accept="image/*"
                on:change={handleFileChange}
            />
        </label>
    {/if}


    
    <!-- Distance between buttons -->
    <div style="height: 2rem;"></div>

    <button type="submit" class="sosp-button">Event Anlegen</button>
</div>
</form>
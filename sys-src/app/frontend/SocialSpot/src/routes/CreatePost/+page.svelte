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
  
    .error {
        border: 2px solid red;
        border-radius: 4px;
    }

    .dialog {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: white;
        border: 1px solid #ccc;
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        z-index: 1000;
    }

    .dialog button {
        margin-top: 16px;
        padding: 8px 16px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    .dialog button:hover {
        background-color: #0056b3;
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
    let eventAddress = '';
    let errors = { date: false }; 
    let dialogMessage = ""; 
    let showDialog = false;

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
            console.error("Error fetchSuggestions:", error);
        }

        console.log("GraphQL Query:", query);
        console.log("Variables:", { nameLike: text });
        console.log("API URL:", GRAPHQL_URL);
    }

    
    function selectSuggestion(suggestion: { id: string; name: string }) {
        inputText = `${suggestion.name}, ${suggestion.district}, ${suggestion.state}`;
        cityId = parseInt(suggestion.id, 10); 
        selectedCityId = suggestion.id;
        suggestions = []; 
        console.log("selected city-ID:", cityId); 
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
            console.log('Event Address:', eventAddress);
            if (selectedFile !== null && uploadedImageFilename !== '') {
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
                    $address: String,
                    $imageUrl: String
                ) {
                    createEvent(
                        title: $title,
                        description: $description,
                        date: $date,
                        time: $time,
                        cityId: $cityId,
                        address: $address,
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
                address: eventAddress,
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

            dialogMessage = `Event "${title}" created successfully!`;
            showDialog = true;

            // Reset form
            title = '';
            description = '';
            date = '';
            time = '';
            filename = '';
            imageUrl = '';
            selectedFile = null;
            uploadedImageFilename = '';
            eventAddress = ''; // **eventAddress wird zurückgesetzt**
        } catch (error) {
            console.error('Error creating event:', error);
            dialogMessage = "An error occurred while creating the event.";
            showDialog = true;
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
    <label for="titel">Title</label>
    <input id="titel" type="text" class="sosp-input" placeholder="Title of the event" bind:value={title} required/>

    <label for="location" style="margin-top:1rem;">City</label>
    <input id="location" type="text" class="sosp-input" placeholder="City where the event takes place" bind:value={inputText} on:input={(e) => fetchSuggestions(e.target.value)} />

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

    <label for="event-address" style="margin-top:1rem;">Address</label>
    <input
        id="event-address"
        type="text"
        class="sosp-input"
        placeholder="Enter street and house number"
        bind:value={eventAddress} />    
        
    <label for="description" style="margin-top:1rem;">Description</label>
    <input id="description" type="text" class="sosp-input" placeholder="Event description" bind:value={description} required/>

    <label for="startdate" style="margin-top:1rem;">Start Date</label>
    <input id="startdate" type="date" class="sosp-input" placeholder="Start date" bind:value={date} class:error={errors.date} required/>


    
    <label for="starttime" style="margin-top:1rem;">Start Time</label>
    <input id="starttime" type="time" class="sosp-input" placeholder="Start time" bind:value={time} required/>

    <label for="bild" style="margin-top:1rem;">Upload Image</label>
    {#if imageUrl}
        <img src={imageUrl} alt="Preview" style="max-width: 100%; margin-top: 1rem; border-radius: 0.5rem;" />
    {:else}
        <label class="file-upload-label" for="bild">
            Choose Image
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

    <button type="submit" class="sosp-button">Create Event</button>
</div>
</form>

{#if showDialog}
    <div class="dialog">
        <p>{dialogMessage}</p>
        <button type="button" on:click={() => (showDialog = false)}>OK</button>
    </div>
{/if}
<style>
    .sosp-container {
        max-width: 600px;
        width: 100%;
    }


    /* Style Datei-Upload */
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
    .file-upload-filename {
        font-size: 0.95rem;
        color: #231942;
        margin-bottom: 1rem;
        margin-left: 0.5rem;
    }
</style>

<script>
    import "$lib/style.css";

    let filename = '';
    let imageUrl = '';

    function handleFileChange(e) {
        const file = e.target.files[0];
        filename = file?.name || '';
        if (file) {
            imageUrl = URL.createObjectURL(file);
        } else {
            imageUrl = '';
        }
    }
</script>

<div class="sosp-container">
    <label for="titel">Titel</label>
    <input id="titel" type="text" class="sosp-input" placeholder="Titel des Events" />

    <label for="ort" style="margin-top:1rem;">Ort</label>
    <input id="ort" type="text" class="sosp-input" placeholder="Ort an dem das Event stattfindet" />

    <label for="beschreibung" style="margin-top:1rem;">Beschreibung</label>
    <input id="beschreibung" type="text" class="sosp-input" placeholder="Beschreibung des Events" />

    <label for="startdatum" style="margin-top:1rem;">Startdatum</label>
    <input id="startdatum" type="date" class="sosp-input" placeholder="Startdatum" />

    <label for="startzeit" style="margin-top:1rem;">Startzeit</label>
    <input id="startzeit" type="time" class="sosp-input" placeholder="Startzeit" />

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


    
    <!-- Abstand vor den Buttons -->
    <div style="height: 2rem;"></div>

    <button class="sosp-button">Abbruch</button>
    <button class="sosp-button">OK</button>

</div>
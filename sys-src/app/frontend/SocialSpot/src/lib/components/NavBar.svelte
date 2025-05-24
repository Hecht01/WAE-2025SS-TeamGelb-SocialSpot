<script>

</script>

<style>
    header{
        position: sticky;
        z-index: 1;
        top: 0;
        left: 0;
        display: flex;
        flex-direction: row;
        justify-content: left;
        align-items: center;
        width: 100%;
        border-bottom: gainsboro solid 2px;
        font-family: "Montserrat", sans-serif;
        margin-top: 0;
        padding: 20px;
        box-shadow: gainsboro 0 0 10px;
        background-color: #fcfcfc;
        font-size: larger;
    }

    .title{
        padding-right: 50px;
        padding-left: 50px;
        font-weight: bold;
    }

    nav a{
        text-decoration: none;
        color: #1f1246;
        font-weight: bold;
        padding: 10px;
    }

    nav a:hover{
        background-color: #fcecee;
        color: #bf2b47;
        border-radius: 5px;
        padding: 10px;
    }

    img{
        max-height: 45px;
    }
</style>

<header>
    <div class = "title">
        <img src ="/logo_no_background.png" alt = "Social Spot Logo"/>
    </div>
    <nav>
        <a href = "/sys-src/app/frontend/SocialSpot/static">Home</a>
        <a href = "/map">Map</a>
        <a href = "/CreatePost">Create New Event</a>
        <a href = "/userProfile">My Profile</a>
    </nav>
</header>

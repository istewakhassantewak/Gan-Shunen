let currentsong = new Audio();
let songs;
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}
async function getsongs() {
    let a = await fetch("http://127.0.0.1:3000/songs/");
    let response = await a.text();

    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    let songs = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split("songs%5Cbensound-")[1]);

        }
    }
    return songs;


}
const playMusic = (track, pause = false) => {

    currentsong.src = "songs%5Cbensound-" + track
    if (!pause) {

        currentsong.play();
        play.src = "images/pause.svg"
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track)
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00"

}
async function main() {

    songs = await getsongs();
    playMusic(songs[0], true)
    let songul = document.querySelector(".songlist").getElementsByTagName("ul")[0];
    for (const song of songs) {
        songul.innerHTML = songul.innerHTML + ` <li><img src="images/music.svg" alt="images/music.svg" class="invert">
                            <div class="info">
                                <div>${song.replaceAll("%20", " ")}</div>
                                <div>Istewak</div>
                            </div>
                            <div class="playnow">
                                <span>Play Now</span>
                                <img class="invert" src="images/play.svg" alt="">
                            </div>

                        </li>`;
    }


    Array.from(document.querySelector(".songlist").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            console.log(e.querySelector(".info").firstElementChild.innerHTML)
            playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim())
        })

    })


    play.addEventListener("click", () => {
        if (currentsong.paused) {
            currentsong.play()
            play.src = "images/pause.svg"
        } else {
            currentsong.pause()
            play.src = "images/play.svg"
        }
    })
    currentsong.addEventListener("timeupdate", () => {

        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentsong.currentTime)} / ${secondsToMinutesSeconds(currentsong.duration)}`
        document.querySelector(".circle").style.left = (currentsong.currentTime / currentsong.duration) * 100 + "%";
    })
    document.querySelector(".seekbar").addEventListener("click", (e) => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100
        document.querySelector(".circle").style.left = percent + "%";
        currentsong.currentTime = ((currentsong.duration) * percent) / 100;
    })

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0"
    })

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%"
    })



    previous.addEventListener("click", () => {
        let index = songs.indexOf(currentsong.src.split("d-").slice(-1)[0])
        if ((index - 1) >= 0) {

            playMusic(songs[index - 1])
        }
    })



    next.addEventListener("click", () => {


        let index = songs.indexOf(currentsong.src.split("d-").slice(-1)[0])
        if ((index + 1) < songs.length) {

            playMusic(songs[index + 1])
        }
    })

}
main();
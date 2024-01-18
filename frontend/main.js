import {Events} from "@wailsio/runtime";

const resultElement = document.getElementById('result');
const timeElement = document.getElementById('time');

Events.On('time', (time) => {
    timeElement.innerText = time.data;
});
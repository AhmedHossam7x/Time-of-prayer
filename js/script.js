window.onload = function() {
    // Fetch country data from the RestCountries API
    fetch('https://restcountries.com/v3.1/all')
        .then(response => response.json())
        .then(data => {
            const countrySelect = document.getElementById('countries');
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Select a country';
            countrySelect.appendChild(defaultOption);

            data.forEach(country => {
                const option = document.createElement('option');
                option.value = country.cca2.toLowerCase(); // Country code
                option.textContent = country.name.common; // Country name
                countrySelect.appendChild(option);
            });
    })
    .catch(error => console.error('Error fetching country data:', error));

    // Event listener for when the country changes
    document.getElementById('countries').addEventListener('change', function() {
        const selectedCountry = this.value;
        if (selectedCountry) {
            fetchCities(selectedCountry);
        }
    });

    getPayrerRequist();

};

function convertTo12HourFormat(time24) {
    let [hour, minute] = time24.split(":").map(Number);
    let suffix = hour >= 12 ? 'م' : 'ص';
    hour = hour % 12; 
    if (hour === 0) hour = 12; // Handle midnight (0) as 12
    let formattedHour = hour < 10 ? `0${hour}` : `${hour}`;
    minute = minute < 10 ? `0${minute}`:`${minute}`;
    let formattedTime = `${formattedHour}:${minute} ${suffix}`;

    return formattedTime;
}
function inputTime(id, time){
    document.getElementById(id).textContent = convertTo12HourFormat(time);
}
async function getPayrerRequist(countryCode = null, cityName = null){

    countryCode = countryCode === null ? "eg" : countryCode;
    cityName = cityName === null ? "zefta" : cityName;

    console.log(countryCode + "====================");
    console.log(cityName + "====================");

    let country;
    const selectCountryElement = document.getElementById("countries");
    const selectCitiesElement = document.getElementById("cities");

    selectCountryElement.addEventListener("change", function(){
        country = this.value;
    });
    selectCitiesElement.addEventListener("change", function(){
        getPayrerRequist(country, this.value, this.value);
    });

    document.getElementById("city-name").innerHTML = cityName;



    await axios.get(`http://api.aladhan.com/v1/timingsByCity?country=${countryCode}&city=${cityName}`)
    .then(function (response) {
        // console.log(response.data);
        // console.log("================");
        inputTime("fajer_time", response.data.data.timings.Fajr);
        inputTime("shoruk_time", response.data.data.timings.Sunrise);
        inputTime("eldoher_time", response.data.data.timings.Dhuhr);
        inputTime("aser_time", response.data.data.timings.Asr);
        inputTime("mgrap_time", response.data.data.timings.Maghrib);
        inputTime("asha_time", response.data.data.timings.Isha);

        showRemainingTime(response.data.data.timings);

        const readableData = response.data.data.date.readable;
        const readableArab = response.data.data.date.hijri.weekday.ar;
        
        document.getElementById("data").textContent = `${readableArab} - ${readableData}`;

        showRemainingTime(response.data.data.timings);
    })
    .catch(function (error) {
        console.log(error);
    }); 
}
async function fetchCities(countryCode) {
    const citySelect = document.getElementById('cities');
    citySelect.innerHTML = '<option value="">Loading cities...</option>'; // Temporary text

    const options = {
        method: 'GET',
        headers: {
            Authorization: 'Bearer c8c7aef9f0msha2ef944fbff9b0dp1a926fjsn38fbaafe38d6',
                'x-rapidapi-key': 'c8c7aef9f0msha2ef944fbff9b0dp1a926fjsn38fbaafe38d6',
                'x-rapidapi-host': 'country-state-city-search-rest-api.p.rapidapi.com'
        }
    };
    await fetch(`https://country-state-city-search-rest-api.p.rapidapi.com/cities-by-countrycode?countrycode=${countryCode}`, options)
    .then(response => response.json())
    .then(response =>
        response.forEach(data =>{
            // console.log(data.name);
            const option = document.createElement('option');
            option.value = data.name; // City name
            option.textContent = data.name; // City name
            citySelect.appendChild(option);
        })
    )
    .catch(err => console.error(err));
}

function updateTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const amOrPm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // convert to 12-hour format
    const formattedTime = hours + ':' + minutes + ':' + seconds + ' ' + amOrPm;
    document.getElementById('timeNow').textContent = formattedTime;
}
setInterval(updateTime, 1000); // update the time display every second

let countdownInterval;

function showRemainingTime(timings) {
    const currentTime = new Date();
    const times = {
        fajer: (timings.Fajr),
        shoruk: (timings.Sunrise),
        eldoher: (timings.Dhuhr),
        aser: (timings.Asr),
        mgrap: (timings.Maghrib),
        asha: (timings.Isha)
    };

    const prayerNames = ['fajer', 'shoruk', 'eldoher', 'aser', 'mgrap', 'asha'];

    let nextPrayer = null;
    let nextPrayerTime = null;

    prayerNames.forEach(prayer => {
        const prayerTime = new Date();

        const [hour, minute] = times[prayer].split(":").map(Number);

        prayerTime.setHours(hour);
        prayerTime.setMinutes(minute);
        prayerTime.setSeconds(0);

        if (prayerTime > currentTime && (nextPrayerTime === null || prayerTime < nextPrayerTime)) {
            nextPrayer = prayer;
            nextPrayerTime = prayerTime;
        }
    });

    if (nextPrayer) {
        startCountdown(nextPrayerTime, nextPrayer);
    }else{
        document.getElementById("next-prayer").innerHTML = 'انتهت كل الصلوات لهذا اليوم';
    }
}

function startCountdown(remainingTime, prayerName){
    const prayerTime = new Date(remainingTime).getTime();

    if (countdownInterval) clearInterval(countdownInterval);

    countdownInterval = setInterval(function() {
        const now = new Date().getTime();
        const timeDiff = prayerTime - now;
        if (timeDiff <= 0) {
            clearInterval(countdownInterval);
            countdownDisplay.textContent = `Next Prayer: ${prayerName} Now`;
        } else {
            const hoursRemaining = Math.floor(timeDiff / (1000 * 60 * 60));
            const minutesRemaining = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            const secondsRemaining = Math.floor((timeDiff % (1000 * 60)) / 1000);
            document.getElementById('next-prayer').innerHTML = `${prayerName} in ${hoursRemaining} hours ${minutesRemaining} minutes ${secondsRemaining}`;
        }
    }, 1000);
}
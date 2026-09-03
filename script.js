const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Math.round(Number(n)||0));
const val=id=>Number($(id).value)||0;

// ==========================================
// SMART HIDE FIXED BOTTOM ON MOBILE (When Typing)
// ==========================================
document.addEventListener('focusin', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
        if(window.innerWidth <= 768) {
            const footerArea = document.querySelector('.fixed-bottom-area');
            const mobileNav = document.querySelector('.mobile-bottom-nav');
            if(footerArea) footerArea.style.display = 'none';
            if(mobileNav) mobileNav.style.display = 'none';
        }
    }
});
document.addEventListener('focusout', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
        if(window.innerWidth <= 768) {
            const footerArea = document.querySelector('.fixed-bottom-area');
            const mobileNav = document.querySelector('.mobile-bottom-nav');
            if(footerArea) footerArea.style.display = 'block';
            if(mobileNav) mobileNav.style.display = 'flex';
        }
    }
});

// ==========================================
// ✅ TOGGLE COMMUTE & RECOVERY LOGIC
// ==========================================
function toggleCommute() {
    const isYes = document.querySelector('input[name="commute"]:checked').value === "yes";
    const cp = $("commutePercent");
    cp.readOnly = !isYes;
    cp.style.backgroundColor = isYes ? "" : "#e9ecef";
    if (!isYes) {
        cp.value = "0";
    } else if (cp.value === "0" || cp.value === "") {
        cp.value = "40"; 
    }
}

function toggleRecovery() {
    const isYes = document.querySelector('input[name="recovery"]:checked').value === "yes";
    const rec = $("recovery");
    const oth = $("otherDeduction");
    
    rec.readOnly = !isYes;
    oth.readOnly = !isYes;
    
    rec.style.backgroundColor = isYes ? "" : "#e9ecef";
    oth.style.backgroundColor = isYes ? "" : "#e9ecef";
    
    if (!isYes) {
        rec.value = "0";
        oth.value = "0";
    }
}

document.querySelectorAll('input[name="commute"]').forEach(r => r.addEventListener('change', toggleCommute));
document.querySelectorAll('input[name="recovery"]').forEach(r => r.addEventListener('change', toggleRecovery));


// ==========================================
// FIREBASE CONFIGURATION
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyDBZ739gmtcIIJU9Zau--zlYIfibH4hUsk",
  authDomain: "pension-calculater.firebaseapp.com",
  databaseURL: "https://pension-calculater-default-rtdb.firebaseio.com",
  projectId: "pension-calculater",
  storageBucket: "pension-calculater.firebasestorage.app",
  messagingSenderId: "44699549394",
  appId: "1:44699549394:web:07a15aa6980c869475370b"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();
const provider = new firebase.auth.GoogleAuthProvider();

let currentUser = null;
let fetchedRecords = []; 
let currentEditId = null; 

auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        $("loginScreen").style.display = "none";
        $("mainApp").style.display = "block";
        $("userNameDisplay").textContent = "Welcome, " + user.displayName;
        fetchDataFromFirebase();
    } else {
        currentUser = null;
        fetchedRecords = [];
        $("loginScreen").style.display = "flex";
        $("mainApp").style.display = "none";
        $("userNameDisplay").textContent = "";
        $("loginBtnMain").innerHTML = "🔐 Google ने Login करा";
    }
});

$("loginBtnMain").addEventListener("click", () => {
    $("loginBtnMain").innerHTML = "⏳ लॉगिन होत आहे... पॉप-अप Allow करा";
    auth.signInWithPopup(provider).catch(error => {
        alert("लॉगिन त्रुटी: " + error.message + "\n\n(कृपया तुमच्या ब्राऊजरमध्ये 'Pop-ups' Allow केले असल्याची खात्री करा.)");
        $("loginBtnMain").innerHTML = "🔐 Google ने Login करा";
    });
});

$("logoutBtn").addEventListener("click", () => auth.signOut().then(()=> window.location.reload() ));

let currentRetirementAge = 58;

const payMatrix = {
    "S-1": [15000, 15500, 16000, 16500, 17000, 17500, 18000, 18500, 19100, 19700, 20300, 20900, 21500, 22100, 22800, 23500, 24200, 24900, 25600, 26400, 27200, 28000, 28800, 29700, 30600, 31500, 32400, 33400, 34400, 35400, 36500, 37600, 38700, 39900, 41100, 42300, 43600, 44900, 46200, 47600],
    "S-2": [15300, 15800, 16300, 16800, 17300, 17800, 18300, 18800, 19400, 20000, 20600, 21200, 21800, 22500, 23200, 23900, 24600, 25300, 26100, 26900, 27700, 28500, 29400, 30300, 31200, 32100, 33100, 34100, 35100, 36200, 37300, 38400, 39600, 40800, 42000, 43300, 44600, 45900, 47300, 48700],
    "S-3": [16600, 17100, 17600, 18100, 18600, 19200, 19800, 20400, 21000, 21600, 22200, 22900, 23600, 24300, 25000, 25800, 26600, 27400, 28200, 29000, 29900, 30800, 31700, 32700, 33700, 34700, 35700, 36800, 37900, 39000, 40200, 41400, 42600, 43900, 45200, 46600, 48000, 49400, 50900, 52400],
    "S-4": [17100, 17600, 18100, 18600, 19200, 19800, 20400, 21000, 21600, 22200, 22900, 23600, 24300, 25000, 25800, 26600, 27400, 28200, 29000, 29900, 30800, 31700, 32700, 33700, 34700, 35700, 36800, 37900, 39000, 40200, 41400, 42600, 43900, 45200, 46600, 48000, 49400, 50900, 52400, 54000],
    "S-5": [18000, 18500, 19100, 19700, 20300, 20900, 21500, 22100, 22800, 23500, 24200, 24900, 25600, 26400, 27200, 28000, 28800, 29700, 30600, 31500, 32400, 33400, 34400, 35400, 36500, 37600, 38700, 39900, 41100, 42300, 43600, 44900, 46200, 47600, 49000, 50500, 52000, 53600, 55200, 56900],
    "S-6": [19900, 20500, 21100, 21700, 22400, 23100, 23800, 24500, 25200, 26000, 26800, 27600, 28400, 29300, 30200, 31100, 32000, 33000, 34000, 35000, 36100, 37200, 38300, 39400, 40600, 41800, 43100, 44400, 45700, 47100, 48500, 50000, 51500, 53000, 54600, 56200, 57900, 59600, 61400, 63200],
    "S-7": [21700, 22400, 23100, 23800, 24500, 25200, 26000, 26800, 27600, 28400, 29300, 30200, 31100, 32000, 33000, 34000, 35000, 36100, 37200, 38300, 39400, 40600, 41800, 43100, 44400, 45700, 47100, 48500, 50000, 51500, 53000, 54600, 56200, 57900, 59600, 61400, 63200, 65100, 67100, 69100],
    "S-8": [25500, 26300, 27100, 27900, 28700, 29600, 30500, 31400, 32300, 33300, 34300, 35300, 36400, 37500, 38600, 39800, 41000, 42200, 43500, 44800, 46100, 47500, 48900, 50400, 51900, 53500, 55100, 56800, 58500, 60300, 62100, 64000, 65900, 67900, 69900, 72000, 74200, 76400, 78700, 81100],
    "S-9": [26400, 27200, 28000, 28800, 29700, 30600, 31500, 32400, 33400, 34400, 35400, 36500, 37600, 38700, 39900, 41100, 42300, 43600, 44900, 46200, 47600, 49000, 50500, 52000, 53600, 55200, 56900, 58600, 60400, 62200, 64100, 66000, 68000, 70000, 72100, 74300, 76500, 78800, 81200, 83600],
    "S-10": [29200, 30100, 31000, 31900, 32900, 33900, 34900, 35900, 37000, 38100, 39200, 40400, 41600, 42800, 44100, 45400, 46800, 48200, 49600, 51100, 52600, 54200, 55800, 57500, 59200, 61000, 62800, 64700, 66600, 68600, 70700, 72800, 75000, 77300, 79600, 82000, 84500, 87000, 89600, 92300],
    "S-11": [30100, 31000, 31900, 32900, 33900, 34900, 35900, 37000, 38100, 39200, 40400, 41600, 42800, 44100, 45400, 46800, 48200, 49600, 51100, 52600, 54200, 55800, 57500, 59200, 61000, 62800, 64700, 66600, 68600, 70700, 72800, 75000, 77300, 79600, 82000, 84500, 87000, 89600, 92300, 95100],
    "S-12": [32000, 33000, 34000, 35000, 36100, 37200, 38300, 39400, 40600, 41800, 43100, 44400, 45700, 47100, 48500, 50000, 51500, 53000, 54600, 56200, 57900, 59600, 61400, 63200, 65100, 67100, 69100, 71200, 73300, 75500, 77800, 80100, 82500, 85000, 87600, 90200, 92900, 95700, 98600, 101600],
    "S-13": [35400, 36500, 37600, 38700, 39900, 41100, 42300, 43600, 44900, 46200, 47600, 49000, 50500, 52000, 53600, 55200, 56900, 58600, 60400, 62200, 64100, 66000, 68000, 70000, 72100, 74300, 76500, 78800, 81200, 83600, 86100, 88700, 91400, 94100, 96900, 99800, 102800, 105900, 109100, 112400],
    "S-14": [38600, 39800, 41000, 42200, 43500, 44800, 46100, 47500, 48900, 50400, 51900, 53500, 55100, 56800, 58500, 60300, 62100, 64000, 65900, 67900, 69900, 72000, 74200, 76400, 78700, 81100, 83500, 86000, 88600, 91300, 94000, 96800, 99700, 102700, 105800, 109000, 112300, 115700, 119200, 122800],
    "S-15": [41800, 43100, 44400, 45700, 47100, 48500, 50000, 51500, 53000, 54600, 56200, 57900, 59600, 61400, 63200, 65100, 67100, 69100, 71200, 73300, 75500, 77800, 80100, 82500, 85000, 87600, 90200, 92900, 95700, 98600, 101600, 104600, 107700, 110900, 114200, 117600, 121100, 124700, 128400, 132300],
    "S-16": [44900, 46200, 47600, 49000, 50500, 52000, 53600, 55200, 56900, 58600, 60400, 62200, 64100, 66000, 68000, 70000, 72100, 74300, 76500, 78800, 81200, 83600, 86100, 88700, 91400, 94100, 96900, 99800, 102800, 105900, 109100, 112400, 115800, 119300, 122900, 126600, 130400, 134300, 138300, 142400],
    "S-17": [47600, 49000, 50500, 52000, 53600, 55200, 56900, 58600, 60400, 62200, 64100, 66000, 68000, 70000, 72100, 74300, 76500, 78800, 81200, 83600, 86100, 88700, 91400, 94100, 96900, 99800, 102800, 105900, 109100, 112400, 115800, 119300, 122900, 126600, 130400, 134300, 138300, 142400, 146700, 151100],
    "S-18": [49100, 50600, 52100, 53700, 55300, 57000, 58700, 60500, 62300, 64200, 66100, 68100, 70100, 72200, 74400, 76600, 78900, 81300, 83700, 86200, 88800, 91500, 94200, 97000, 99900, 102900, 106000, 109200, 112500, 115900, 119400, 123000, 126700, 130500, 134400, 138400, 142600, 146900, 151300, 155800],
    "S-19": [55100, 56800, 58500, 60300, 62100, 64000, 65900, 67900, 69900, 72000, 74200, 76400, 78700, 81100, 83500, 86000, 88600, 91300, 94000, 96800, 99700, 102700, 105800, 109000, 112300, 115700, 119200, 122800, 126500, 130300, 134200, 138200, 142300, 146600, 151000, 155500, 160200, 165000, 170000, 175100],
    "S-20": [56100, 57800, 59500, 61300, 63100, 65000, 67000, 69000, 71100, 73200, 75400, 77700, 80000, 82400, 84900, 87400, 90000, 92700, 95500, 98400, 101400, 104400, 107500, 110700, 114000, 117400, 120900, 124500, 128200, 132000, 136000, 140100, 144300, 148600, 153100, 157700, 162400, 167300, 172300, 177500],
    "S-21": [57100, 58800, 60600, 62400, 64300, 66200, 68200, 70200, 72300, 74500, 76700, 79000, 81400, 83800, 86300, 88900, 91600, 94300, 97100, 100000, 103000, 106100, 109300, 112600, 116000, 119500, 123100, 126800, 130600, 134500, 138500, 142700, 147000, 151400, 155900, 160600, 165400, 170400, 175500, 180800],
    "S-22": [60000, 61800, 63700, 65600, 67600, 69600, 71700, 73900, 76100, 78400, 80800, 83200, 85700, 88300, 90900, 93600, 96400, 99300, 102300, 105400, 108600, 111900, 115300, 118800, 122400, 126100, 129900, 133800, 137800, 141900, 146200, 150600, 155100, 159800, 164600, 169500, 174600, 179800, 185200],
    "S-23": [67700, 69700, 71800, 74000, 76200, 78500, 80900, 83300, 85800, 88400, 91100, 93800, 96600, 99500, 102500, 105600, 108800, 112100, 115500, 119000, 122600, 126300, 130100, 134000, 138000, 142100, 146400, 150800, 155300, 160000, 164800, 169700, 174800, 180000, 185400, 191000, 196700, 202600, 208700],
    "S-24": [71100, 73200, 75400, 77700, 80000, 82400, 84900, 87400, 90000, 92700, 95500, 98400, 101400, 104400, 107500, 110700, 114000, 117400, 120900, 124500, 128200, 132000, 136000, 140100, 144300, 148600, 153100, 157700, 162400, 167300, 172300, 177500, 182800, 188300, 193900, 199700, 205700, 211900],
    "S-25": [78800, 81200, 83600, 86100, 88700, 91400, 94100, 96900, 99800, 102800, 105900, 109100, 112400, 115800, 119300, 122900, 126600, 130400, 134300, 138300, 142400, 146700, 151100, 155600, 160300, 165100, 170100, 175200, 180500, 185900, 191500, 197200, 203100, 209200],
    "S-26": [82200, 84700, 87200, 89800, 92500, 95300, 98200, 101100, 104100, 107200, 110400, 113700, 117100, 120600, 124200, 127900, 131700, 135700, 139800, 144000, 148300, 152700, 157300, 162000, 166900, 171900, 177100, 182400, 187900, 193500, 199300, 205300, 211500],
    "S-27": [118500, 122100, 125800, 129600, 133500, 137500, 141600, 145800, 150200, 154700, 159300, 164100, 169000, 174100, 179300, 184700, 190200, 195900, 201800, 207900, 214100],
    "S-28": [124800, 128500, 132400, 136400, 140500, 144700, 149000, 153500, 158100, 162800, 167700, 172700, 177900, 183200, 188700, 194400, 200200, 206200, 212400],
    "S-29": [131100, 135000, 139100, 143300, 147600, 152000, 156600, 161300, 166100, 171100, 176200, 181500, 186900, 192500, 198300, 204200, 210300, 216600],
    "S-30": [144200, 148500, 153000, 157600, 162300, 167200, 172200, 177400, 182700, 188200, 193800, 199600, 205600, 211800, 218200],
    "S-31": [182200, 187700, 193300, 199100, 205100, 211300, 217600, 224100]
};

const commutationFactors = {
    20: 9.188, 21: 9.187, 22: 9.186, 23: 9.185, 24: 9.184, 25: 9.183, 26: 9.182, 27: 9.180, 28: 9.178, 29: 9.176,
    30: 9.173, 31: 9.169, 32: 9.164, 33: 9.159, 34: 9.152, 35: 9.145, 36: 9.136, 37: 9.126, 38: 9.116, 39: 9.103,
    40: 9.090, 41: 9.075, 42: 9.059, 43: 9.040, 44: 9.019, 45: 8.996, 46: 8.971, 47: 8.943, 48: 8.913, 49: 8.881,
    50: 8.846, 51: 8.808, 52: 8.768, 53: 8.724, 54: 8.678, 55: 8.627, 56: 8.572, 57: 8.512, 58: 8.446, 59: 8.371,
    60: 8.287, 61: 8.194, 62: 8.093, 63: 7.982, 64: 7.862, 65: 7.731, 66: 7.591, 67: 7.431, 68: 7.262, 69: 7.083,
    70: 6.897, 71: 6.703, 72: 6.502, 73: 6.296, 74: 6.085, 75: 5.872, 76: 5.657, 77: 5.443, 78: 5.229, 79: 5.018,
    80: 4.812, 81: 4.611
};

const GIS_RATES_2026 = {
    "1982-05": 76102, 
    "1990-01": 51424,
    "1994-01": 38315,
    "2002-01": 26731,
    "2010-01": 16530,
    "2016-01": 7903,
    "2016-06": 7903,
    "2018-01": 6333,
    "2018-07": 5877, 
    "2026-01": 42
};

function updateBasicPay() {
    const payLevelDropdown = $("payLevel");
    const basicPayDropdown = $("basicPay");
    const selectedLevel = payLevelDropdown.value;
    
    basicPayDropdown.innerHTML = '<option value="">बेसिक पे निवडा...</option>';
    if (selectedLevel && payMatrix[selectedLevel]) {
        payMatrix[selectedLevel].forEach(function(value) {
            const option = document.createElement("option");
            option.value = value; option.textContent = value;
            basicPayDropdown.appendChild(option);
        });
    }
    calculateRealtimeLeave();
}

window.calculateRealtimeLeave = function() {
    const basic = val("basicPay");
    const da = val("daPercent");
    const daAmount = basic * (da / 100);
    const elDays = Math.min(300, Math.max(0, val("earnedLeaveDays")));
    const leave = Math.round(((basic + daAmount) / 30) * elDays);
    $("leaveEncashment").value = leave;
}

$("basicPay").addEventListener("change", calculateRealtimeLeave);

function calculateRetirementDate() {
    const dobVal = $("dob").value;
    const groupVal = $("group").value;
    if (!dobVal || !groupVal) return;
    
    let retAge = (groupVal === "D" || groupVal === "गट ड") ? 60 : 58;
    currentRetirementAge = retAge;
    
    const dob = new Date(dobVal);
    let retMonth = dob.getMonth();
    if (dob.getDate() === 1) retMonth -= 1;
    
    const retDate = new Date(dob.getFullYear() + retAge, retMonth + 1, 0); 
    const yyyy = retDate.getFullYear();
    const mm = String(retDate.getMonth() + 1).padStart(2, '0');
    const dd = String(retDate.getDate()).padStart(2, '0');
    $("retirementDate").value = `${yyyy}-${mm}-${dd}`;
    
    let ageNextBirthday = retAge + 1;
    if(commutationFactors[ageNextBirthday]) {
        $("commuteFactor").value = commutationFactors[ageNextBirthday];
    }
    
    if($("joiningDate").value) {
         const p = sixMonthlyPeriods();
         $("serviceHalfYears").value = p;
         let yrs = Math.floor(p / 2);
         let mths = (p % 2) ? 6 : 0;
         $("serviceOutput").textContent = `एकूण सेवा: ${yrs} वर्षे ${mths} महिने`;
    }
}

document.querySelectorAll(".tab, .mobile-tab").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".tab, .mobile-tab").forEach(x=>x.classList.remove("active"));
    document.querySelectorAll(".tabpage").forEach(x=>x.classList.remove("active"));
    
    const targetTab = btn.dataset.tab;
    
    document.querySelectorAll(`.tab[data-tab="${targetTab}"], .mobile-tab[data-tab="${targetTab}"]`).forEach(x=>x.classList.add("active"));
    $(targetTab).classList.add("active");
    
    if(targetTab==="saved") renderSaved();
    window.scrollTo({top: 0, behavior: 'smooth'});
  });
});

function toggleRozandari() {
    const est = $("establishment").value;
    const isRoz = (est === "rozandari");
    $("rozandariDateBlock").style.display = isRoz ? "block" : "none";
    $("joiningDateLabel").textContent = isRoz ? "नियमित रुजू दिनांक" : "सेवेत रुजू दिनांक";
    $("joiningDate").readOnly = isRoz;
    $("joiningDate").style.backgroundColor = isRoz ? "#e9ecef" : "";
    if(!isRoz) $("rozandariDate").value = "";
}

function calculateRegularDate() {
    const rDateVal = $("rozandariDate").value;
    if (!rDateVal) return;
    const rozDate = new Date(rDateVal);
    rozDate.setFullYear(rozDate.getFullYear() + 5); 
    $("joiningDate").value = rozDate.toISOString().split('T')[0];
    if($("retirementDate").value) $("serviceHalfYears").value = sixMonthlyPeriods();
}

function sixMonthlyPeriods() {
    const r = $("retirementDate").value;
    let j = $("joiningDate").value;
    const est = $("establishment").value;
    if (!r) return 0;
    const b = new Date(r);
    let totalMonths = 0;

    if (est === "rozandari") {
        const rozStart = $("rozandariDate").value;
        const regStart = $("joiningDate").value;
        if(!rozStart || !regStart) return 0;
        
        const rozDate = new Date(rozStart);
        const regDate = new Date(regStart);
        if (b < regDate) return 0;
        
        let regMonths = (b.getFullYear() - regDate.getFullYear()) * 12 + (b.getMonth() - regDate.getMonth());
        if (b.getDate() < regDate.getDate()) regMonths--;
        if (regMonths < 0) regMonths = 0;
        
        let rozMonths = (regDate.getFullYear() - rozDate.getFullYear()) * 12 + (regDate.getMonth() - rozDate.getMonth());
        if (regDate.getDate() < rozDate.getDate()) rozMonths--;
        if (rozMonths < 0) rozMonths = 0;
        
        totalMonths = regMonths + Math.floor(rozMonths / 2); 

    } else {
        if (!j) return 0;
        let a = new Date(j);
        if (b < a) return 0;
        totalMonths = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
        if (b.getDate() < a.getDate()) totalMonths--;
    }
    return Math.floor(totalMonths / 6);
}

$("calcService").addEventListener("click",()=> {
  const p = sixMonthlyPeriods();
  $("serviceHalfYears").value = p;
  let yrs = Math.floor(p / 2);
  let mths = (p % 2) ? 6 : 0;
  $("serviceOutput").textContent = `एकूण सेवा: ${yrs} वर्षे ${mths} महिने`;
});

window.toggleGisMode = function() {
    const isManual = $("manualGisToggle").checked;
    if(isManual) {
        $("gisAutoSection").style.display = "none";
        $("gis").readOnly = false;
        $("gis").style.backgroundColor = "";
    } else {
        $("gisAutoSection").style.display = "block";
        $("gis").readOnly = true;
        $("gis").style.backgroundColor = "#e9ecef";
    }
}

window.addGISRow = function() {
    const table = $("gisTable");
    const row = table.insertRow();
    row.innerHTML = `
        <td><input type="month" class="gis-date" required></td>
        <td><select class="gis-group"><option value="">निवडा</option><option value="D">गट ड</option><option value="C">गट क</option><option value="B">गट ब</option><option value="A">गट अ</option></select></td>
        <td><button type="button" onclick="this.parentNode.parentNode.remove()" style="color:red; font-weight:bold; cursor:pointer; border:none; background:none; font-size:16px;">❌</button></td>
    `;
}

function getGisUnits(dateStr, group) {
    if(!dateStr || !group) return 0;
    const year = parseInt(dateStr.split('-')[0]);
    
    if (year < 2002) { 
        if (group === "D") return 1; if (group === "C") return 2; if (group === "B") return 4; if (group === "A") return 8;
    } else if (year < 2016) { 
        if (group === "D") return 1; if (group === "C") return 2; if (group === "B") return 8; if (group === "A") return 16;
    } else { 
        if (group === "D") return 4; if (group === "C") return 6; if (group === "B") return 8; if (group === "A") return 16;
    }
    return 0;
}

window.calculateAutoGIS = function() {
    let totalGisAmount = 0;
    const rows = document.querySelectorAll("#gisTable tr");
    
    let events = [];
    for(let i=1; i < rows.length; i++) {
        const dateInput = rows[i].querySelector('.gis-date').value;
        const groupInput = rows[i].querySelector('.gis-group').value;
        if(dateInput && groupInput) {
            events.push({ date: dateInput, group: groupInput, type: 'user' });
        }
    }
    
    if(events.length === 0) {
        $("gis").value = 0;
        return;
    }

    events.sort((a, b) => a.date.localeCompare(b.date));
    const startYear = parseInt(events[0].date.split('-')[0]);
    
    if (startYear < 2002) events.push({ date: "2002-01", group: null, type: 'auto' });
    if (startYear < 2010) events.push({ date: "2010-01", group: null, type: 'auto' });
    if (startYear < 2016) events.push({ date: "2016-01", group: null, type: 'auto' });
    
    events.sort((a, b) => a.date.localeCompare(b.date));
    
    let currentGroup = events[0].group;
    let previousUnits = 0;
    
    for(let i=0; i < events.length; i++) {
        let ev = events[i];
        if(ev.type === 'user') {
            currentGroup = ev.group; 
        } else {
            ev.group = currentGroup; 
        }
        
        let currentUnits = getGisUnits(ev.date, currentGroup);
        let diffUnits = currentUnits - previousUnits;
        
        if(diffUnits > 0) {
            let rate = GIS_RATES_2026[ev.date]; 
            if(!rate) {
                let manualRate = prompt(`⚠️ त्रुटी: ${ev.date} या महिन्याचा GIS 'प्रति युनिट दर' सिस्टममध्ये नाही.\nकृपया तुमचा दर (Maturity Value of 1 Unit) येथे टाईप करा:\n(उदा. 38315)`);
                if(manualRate && !isNaN(manualRate)) {
                    rate = Number(manualRate);
                    GIS_RATES_2026[ev.date] = rate; // Store for session
                } else {
                    return; 
                }
            }
            totalGisAmount += (diffUnits * rate);
            previousUnits = currentUnits;
        }
    }
    
    $("gis").value = Math.round(totalGisAmount);
    
    $("gisAutoSection").style.border = "2px solid #28a745";
    setTimeout(() => { $("gisAutoSection").style.border = "none"; }, 1500);
}

window.handleCalc = function() {
    const form = document.getElementById("pensionForm");
    if(!form.checkValidity()) {
        form.reportValidity();
        alert("कृपया सर्व आवश्यक माहिती (उदा. नाव, बेसिक पे, जन्म दिनांक इत्यादी) भरा!");
        return;
    }
    calculate(true);
};

// ==========================================
// 🚀 UPDATED SAVE FUNCTION
// ==========================================
window.handleSave = function() {
    const form = document.getElementById("pensionForm");
    if(!form.checkValidity()) {
        form.reportValidity();
        alert("कृपया सर्व आवश्यक माहिती (उदा. नाव, बेसिक पे, जन्म दिनांक इत्यादी) भरा!");
        return;
    }
    
    if(!currentUser) { 
        alert("माहिती जतन करण्यासाठी सुरक्षित लॉगिन (Google Login) करणे आवश्यक आहे!"); 
        return; 
    }

    const saveBtn = document.getElementById("saveBtn");
    const originalBtnText = saveBtn.innerHTML;
    saveBtn.innerHTML = "⏳ जतन होत आहे...";
    saveBtn.disabled = true;
    
    try {
        const rawData = calculate(false); 
        const cleanData = JSON.parse(JSON.stringify(rawData)); // Safe Object for Firebase
        const dbRef = db.ref('users/' + currentUser.uid + '/pensionRecords');

        let saveTask;
        if(currentEditId !== null) {
            saveTask = dbRef.child(currentEditId).set(cleanData);
        } else {
            saveTask = dbRef.push(cleanData);
        }
        
        saveTask.then(() => {
            currentEditId = null;
            alert("माहिती यशस्वीरित्या जतन झाली!");
            
            saveBtn.innerHTML = originalBtnText;
            saveBtn.disabled = false;

            document.querySelector('.tab[data-tab="saved"]').click();
            if(window.innerWidth <= 768) {
                const mobTab = document.querySelector('.mobile-tab[data-tab="saved"]');
                if(mobTab) mobTab.click();
            }
        }).catch(error => {
            saveBtn.innerHTML = originalBtnText;
            saveBtn.disabled = false;
            alert("डेटाबेस त्रुटी (Save Failed): " + error.message + "\n\nकृपया तुमचे Firebase Rules तपासा.");
            console.error("Firebase Save Error:", error);
        });

    } catch(error) { 
        saveBtn.innerHTML = originalBtnText;
        saveBtn.disabled = false;
        alert("तांत्रिक त्रुटी: " + error.message); 
    }
};

window.handleReset = function() {
    document.getElementById("pensionForm").reset(); 
    document.getElementById("resultModal").style.display = "none";
    currentEditId = null;
    
    // ⚠️ jQuery Error Fix
    if(window.jQuery && jQuery('#department').length) {
        jQuery('#department').val('').trigger('change');
    }
    
    toggleRozandari();
    toggleCommute();
    toggleRecovery();
    window.scrollTo(0,0);
};

// ==========================================
// 🎯 MAIN CALCULATION FUNCTION 
// ==========================================
function calculate(showModal = true){
  const basic = val("basicPay");
  const halfYears = Math.max(0, Math.floor(val("serviceHalfYears")));
  const da = val("daPercent");
  
  let pension = basic * 0.50;
  if(halfYears > 0 && halfYears < 40) pension = basic * 0.50 * (halfYears / 66);
  pension = Math.round(pension);
  
  const gratuity = Math.round(Math.min(basic * 0.25 * halfYears, basic * 16.5, 1400000));
  
  const isCommute = document.querySelector('input[name="commute"]:checked').value === "yes";
  const cp = Math.min(40, Math.max(0, val("commutePercent")));
  
  let factor = val("commuteFactor") || 8.194;
  
  const commuted = isCommute ? Math.round(pension * cp / 100) : 0;
  const reduced = Math.max(0, pension - commuted);
  const commutationValue = isCommute ? Math.round(commuted * 12 * factor) : 0;
  
  calculateRealtimeLeave();
  
  const amtLeave = val("leaveEncashment");
  const amtGpf = val("gpf");
  const amtGis = val("gis");
  
  const hasRecovery = document.querySelector('input[name="recovery"]:checked').value === "yes";
  const amtRecovery = hasRecovery ? val("recovery") : 0;
  const amtOther = hasRecovery ? val("otherDeduction") : 0;
  
  const baseForDA = isCommute ? reduced : pension;
  const pensionDA = Math.round(baseForDA * (da / 100));
  
  const lump = Math.max(0, commutationValue + gratuity + amtLeave + amtGpf + amtGis - amtRecovery - amtOther);

  const resultGrid = $("resultGridContainer");
  let gridHTML = "";

  if(isCommute) {
      gridHTML += `
        <div style="display:flex; justify-content:space-between; border-bottom:1px dashed #eee; padding-bottom:5px;"><span>मासिक मूळ निवृत्तीवेतन:</span><b>${money(pension)}</b></div>
        <div style="display:flex; justify-content:space-between; border-bottom:1px dashed #eee; padding-bottom:5px;"><span>अंशराशीकरण रक्कम:</span><b>${money(commuted)}</b></div>
        <div style="display:flex; justify-content:space-between; border-bottom:1px dashed #eee; padding-bottom:5px;"><span>अंशराशीकरण एकरकमी रक्कम:</span><b>${money(commutationValue)}</b></div>
        <div style="display:flex; justify-content:space-between; border-bottom:1px dashed #eee; padding-bottom:5px;"><span>अंशराशीकरणानंतर पेन्शन (Reduced):</span><b>${money(reduced)}</b></div>
        <div style="display:flex; justify-content:space-between; border-bottom:1px dashed #eee; padding-bottom:5px;"><span>महागाई भत्ता (DA) (${da}% Reduced पेन्शनवर):</span><b>${money(pensionDA)}</b></div>
        <div style="display:flex; justify-content:space-between; border-bottom:2px solid #ddd; padding-bottom:5px; margin-top:3px; color:#0b5d3b;"><span><b>एकूण मासिक पेन्शन (Reduced + DA):</b></span><b>${money(reduced + pensionDA)}</b></div>
      `;
  } else {
      gridHTML += `
        <div style="display:flex; justify-content:space-between; border-bottom:1px dashed #eee; padding-bottom:5px;"><span>मासिक मूळ निवृत्तीवेतन:</span><b>${money(pension)}</b></div>
        <div style="display:flex; justify-content:space-between; border-bottom:1px dashed #eee; padding-bottom:5px;"><span>महागाई भत्ता (DA) (${da}% मूळ पेन्शनवर):</span><b>${money(pensionDA)}</b></div>
        <div style="display:flex; justify-content:space-between; border-bottom:2px solid #ddd; padding-bottom:5px; margin-top:3px; color:#0b5d3b;"><span><b>एकूण मासिक पेन्शन (Basic + DA):</b></span><b>${money(pension + pensionDA)}</b></div>
      `;
  }

  gridHTML += `
      <div style="display:flex; justify-content:space-between; border-bottom:1px dashed #eee; padding-bottom:5px; margin-top:8px;"><span>सेवानिवृत्ती उपदान (Gratuity):</span><b>${money(gratuity)}</b></div>
      <div style="display:flex; justify-content:space-between; border-bottom:1px dashed #eee; padding-bottom:5px;"><span>रजा रोखीकरण:</span><b>${money(amtLeave)}</b></div>
      <div style="display:flex; justify-content:space-between; border-bottom:1px dashed #eee; padding-bottom:5px;"><span>GPF:</span><b>${money(amtGpf)}</b></div>
      <div style="display:flex; justify-content:space-between; border-bottom:1px dashed #eee; padding-bottom:5px;"><span>GIS (अंदाजे):</span><b>${money(amtGis)}</b></div>
      <div class="total" style="font-size:18px; color: #0b5d3b; background:#e8f5e9; padding:12px; border-radius:6px; display:flex; justify-content:space-between; margin-top:8px;"><span>अंदाजे एकूण एकरकमी लाभ:</span><b>${money(lump)}</b></div>
  `;

  resultGrid.innerHTML = gridHTML;

  let deptText = $("department").selectedIndex > 0 ? $("department").options[$("department").selectedIndex].text : "-";
  
  let yrs = Math.floor(halfYears / 2);
  let mths = (halfYears % 2) ? 6 : 0;
  let serviceStr = `${yrs} वर्षे ${mths} महिने`;
  
  let dobText = $("dob").value ? new Date($("dob").value).toLocaleDateString("en-IN") : "-";
  let estText = $("establishment").options[$("establishment").selectedIndex].text;
  let rozText = $("rozandariDate").value ? new Date($("rozandariDate").value).toLocaleDateString("en-IN") : "-";
  let joinText = $("joiningDate").value ? new Date($("joiningDate").value).toLocaleDateString("en-IN") : "-";
  let retText = $("retirementDate").value ? new Date($("retirementDate").value).toLocaleDateString("en-IN") : "-";

  let rozStr = ($("establishment").value === "rozandari") ? ` | रोजंदारी रुजू: <b>${rozText}</b>` : "";
  
  $("summary").innerHTML=`
  <p style="margin-bottom:4px; font-size:16px;"><b>${$("employeeName").value}</b> | ${$("designation").value||"-"} | ${$("officeName").value||"-"}</p>
  <p style="margin-bottom:6px;">विभाग: <b>${deptText}</b></p>
  <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:8px; background:#fff; padding:10px; border-radius:4px; border:1px solid #ced4da;">
      <div>जन्म दिनांक: <b style="color:#0b5d3b;">${dobText}</b></div>
      <div>आस्थापना: <b style="color:#0b5d3b;">${estText}</b></div>
      <div>सेवेत रुजू: <b style="color:#0b5d3b;">${joinText}</b> ${rozStr}</div>
      <div>निवृत्ती दिनांक: <b style="color:#d9534f;">${retText}</b></div>
  </div>
  <p style="font-size:14px; margin-top:5px;">Basic Pay: <b>${money(basic)}</b> &nbsp; | &nbsp; एकूण सेवा: <b style="color:#d9534f;">${serviceStr}</b></p>
  `;
  
  if(showModal) {
      $("resultModal").style.display = "block";
  }
  
  return {
    name:$("employeeName").value, department:$("department").value, office:$("officeName").value,
    designation:$("designation").value, group:$("group").value, dob:$("dob").value,
    retirementType:$("retirementType").value, establishment:$("establishment").value,
    joiningDate:$("joiningDate").value, rozandariDate:$("rozandariDate").value, retirementDate:$("retirementDate").value,
    serviceHalfYears:halfYears, payLevel:$("payLevel").value, basicPay:basic, daPercent:da,
    commute: isCommute, commutePercent:cp, commuteFactor:factor, earnedLeaveDays: val("earnedLeaveDays"),
    recovery: amtRecovery, recoveryAmount: amtRecovery, otherDeduction: amtOther, gpf: amtGpf, gis: amtGis, leaveEncashment: amtLeave, 
    savedAt:new Date().toISOString()
  };
}

$("closeModal").addEventListener("click", () => $("resultModal").style.display = "none");
window.onclick = function(e) { if(e.target == $("resultModal")) $("resultModal").style.display = "none"; }

function fetchDataFromFirebase() {
    if(!currentUser) return;
    const dbRef = db.ref('users/' + currentUser.uid + '/pensionRecords');
    dbRef.off(); 
    dbRef.on('value', (snapshot) => {
        fetchedRecords = [];
        snapshot.forEach((child) => fetchedRecords.push({id: child.key, data: child.val()}));
        fetchedRecords.reverse(); 
        renderSaved();
    });
}

function renderSaved(){
  if(!currentUser){ $("savedList").innerHTML="<p>माहिती पाहण्यासाठी लॉगिन करा.</p>"; return; }
  if(!fetchedRecords.length){ $("savedList").innerHTML="<p>कोणतीही माहिती जतन केलेली नाही.</p>"; return; }
  
  $("savedList").innerHTML = fetchedRecords.map((rObj, i)=>{
      let r = rObj.data;
      let deptName = r.department ? document.querySelector(`#department option[value="${r.department}"]`)?.text : "";
      return `
      <div class="section" style="padding:15px; margin-bottom:15px; display:flex; flex-direction:column; gap:10px;">
          <div>
              <h3 style="margin:0; color:#0b5d3b;">👤 ${r.name || "नाव नाही"}</h3>
              <p style="margin:5px 0 0 0; font-size:13px; color:#555;">${r.designation || ""} | ${deptName || ""}</p>
              <p style="margin:5px 0 0 0; font-size:13px;">Basic Pay: ₹${Number(r.basicPay||0).toLocaleString("en-IN")} | सेव्ह दिनांक: ${new Date(r.savedAt).toLocaleDateString("en-IN")}</p>
          </div>
          <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:5px;">
              <button onclick="loadRecord(${i})" style="background-color:#ffc107; color:black; font-weight:bold; padding: 6px 12px; border:none; border-radius:4px; font-size:13px;">✏️ Edit</button>
              <button onclick="printRecord(${i})" style="background-color:#17a2b8; color:white; font-weight:bold; padding: 6px 12px; border:none; border-radius:4px; font-size:13px;">🖨️ Print</button>
              <button onclick="deleteRecord(${i})" style="background-color:#d9534f; color:white; font-weight:bold; padding: 6px 12px; border:none; border-radius:4px; font-size:13px;">🗑️ Delete</button>
          </div>
      </div>`;
  }).join("");
}

// ==========================================
// 🚀 RECORD HANDLING (Edit, Print, Delete) 
// ⚠️ Fixed jQuery Conflict inside this function
// ==========================================
window.loadRecord = function(i){
  try {
      const r = fetchedRecords[i].data;
      if(!r) return;
      
      Object.keys(r).forEach(k => { 
          if($(k)) $(k).value = r[k]; 
      });
      
      // ⚠️ jQuery Error Fix: Used 'jQuery' word instead of '$' here
      if(r.department && window.jQuery) {
          jQuery('#department').val(r.department).trigger('change');
      }
      
      if(r.establishment) { 
          $("establishment").value = r.establishment; 
          toggleRozandari(); 
          if(r.establishment === "rozandari" && r.rozandariDate) {
              $("rozandariDate").value = r.rozandariDate;
          }
      }
      if(r.payLevel){ 
          updateBasicPay(); 
          if(r.basicPay) $("basicPay").value = r.basicPay; 
      }
      calculateRealtimeLeave();

      const commuteVal = r.commute ? "yes" : "no";
      const commuteRadio = document.querySelector(`input[name="commute"][value="${commuteVal}"]`);
      if(commuteRadio) commuteRadio.checked = true;
      
      const hasRec = (Number(r.recoveryAmount) > 0 || Number(r.otherDeduction) > 0) ? "yes" : "no";
      const recRadio = document.querySelector(`input[name="recovery"][value="${hasRec}"]`);
      if(recRadio) recRadio.checked = true;
      
      toggleCommute();
      toggleRecovery();
      
      currentEditId = fetchedRecords[i].id; 
      
      document.querySelector('.tab[data-tab="calculator"]').click(); 
      if(window.innerWidth <= 768) {
          const mobTab = document.querySelector('.mobile-tab[data-tab="calculator"]');
          if(mobTab) mobTab.click();
      }
      
      $("resultModal").style.display = "none";
      setTimeout(() => { window.scrollTo({top: 0, behavior: 'smooth'}); }, 200);
      
  } catch (error) {
      console.error("Load Error:", error);
      alert("माहिती लोड करताना तांत्रिक त्रुटी आली: " + error.message);
  }
};

window.printRecord = function(i) {
    loadRecord(i);
    setTimeout(() => { calculate(true); setTimeout(() => { window.print(); }, 500); }, 500);
}

window.deleteRecord = function(i){
  try {
      if(confirm("ही माहिती कायमची डिलीट करायची आहे का?")) {
          db.ref('users/' + currentUser.uid + '/pensionRecords/' + fetchedRecords[i].id).remove()
          .then(() => alert("माहिती कायमची डिलीट झाली."))
          .catch(e => alert("डिलीट करताना त्रुटी: " + e.message));
      }
  } catch(error) {
      alert("तांत्रिक त्रुटी: " + error.message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
    toggleCommute();
    toggleRecovery();
});

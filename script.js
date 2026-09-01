const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Math.round(Number(n)||0));
const val=id=>Number($(id).value)||0;

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
  appId: "1:44699549394:web:07a15aa6980c869475370b",
  measurementId: "G-LT71537XP1"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();
const provider = new firebase.auth.GoogleAuthProvider();

let currentUser = null;
let fetchedRecords = []; 
let currentEditId = null; 

// Authentication State Listener
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        $("loginBtn").style.display = "none";
        $("logoutBtn").style.display = "inline-block";
        $("userNameDisplay").textContent = "Welcome, " + user.displayName;
        $("loginWarning").style.display = "none";
        fetchDataFromFirebase();
    } else {
        currentUser = null;
        fetchedRecords = [];
        $("loginBtn").style.display = "inline-block";
        $("logoutBtn").style.display = "none";
        $("userNameDisplay").textContent = "";
        $("loginWarning").style.display = "block";
        renderSaved();
    }
});

// Login / Logout Buttons
$("loginBtn").addEventListener("click", () => {
    auth.signInWithPopup(provider).catch(error => alert("लॉगिन करताना त्रुटी: " + error.message));
});
$("logoutBtn").addEventListener("click", () => {
    auth.signOut().then(()=> { 
        alert("तुम्ही यशस्वीरीत्या लॉगआउट झाला आहात."); 
        window.location.reload(); 
    });
});

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

function updateBasicPay() {
    const payLevelDropdown = $("payLevel");
    const basicPayDropdown = $("basicPay");
    const selectedLevel = payLevelDropdown.value;
    
    basicPayDropdown.innerHTML = '<option value="">बेसिक पे निवडा...</option>';
    
    if (selectedLevel && payMatrix[selectedLevel]) {
        const basicPayValues = payMatrix[selectedLevel];
        basicPayValues.forEach(function(value) {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            basicPayDropdown.appendChild(option);
        });
    }
}

function calculateRetirementDate() {
    const dobVal = $("dob").value;
    const groupVal = $("group").value;
    
    if (!dobVal || !groupVal) return;
    
    let retAge = 58;
    if (groupVal === "D" || groupVal === "गट ड") {
        retAge = 60;
    }
    currentRetirementAge = retAge;
    
    const dob = new Date(dobVal);
    let retYear = dob.getFullYear() + retAge;
    let retMonth = dob.getMonth();
    
    if (dob.getDate() === 1) {
        retMonth = retMonth - 1;
    }
    const retDate = new Date(retYear, retMonth + 1, 0); 
    
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
         $("serviceOutput").textContent = `अर्हताकारी सेवा: ${Math.floor(p/2)} वर्ष ${p%2?6:0} महिने (${p} सहामाही)`;
    }
}

document.querySelectorAll(".tab").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
    document.querySelectorAll(".tabpage").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active"); $(btn.dataset.tab).classList.add("active");
    if(btn.dataset.tab==="saved") renderSaved();
  });
});

function toggleRozandari() {
    const est = $("establishment").value;
    const rDateBlock = $("rozandariDateBlock");
    const rHint = $("rozandariHint");
    const jLabel = $("joiningDateLabel");
    
    if (est === "rozandari") {
        rDateBlock.style.display = "block";
        rHint.style.display = "block";
        jLabel.textContent = "नियमित रुजू दिनांक (Automatic)";
        $("joiningDate").readOnly = true; 
        $("joiningDate").style.backgroundColor = "#e9ecef";
    } else {
        rDateBlock.style.display = "none";
        rHint.style.display = "none";
        jLabel.textContent = "सेवेत रुजू दिनांक";
        $("joiningDate").readOnly = false;
        $("joiningDate").style.backgroundColor = "";
        $("rozandariDate").value = "";
    }
}

function calculateRegularDate() {
    const rDateVal = $("rozandariDate").value;
    if (!rDateVal) return;
    
    const rozDate = new Date(rDateVal);
    rozDate.setFullYear(rozDate.getFullYear() + 5); 
    
    const yyyy = rozDate.getFullYear();
    const mm = String(rozDate.getMonth() + 1).padStart(2, '0');
    const dd = String(rozDate.getDate()).padStart(2, '0');
    
    $("joiningDate").value = `${yyyy}-${mm}-${dd}`;
    
    if($("retirementDate").value) {
         const p = sixMonthlyPeriods();
         $("serviceHalfYears").value = p;
         $("serviceOutput").textContent = `अर्हताकारी सेवा: ${Math.floor(p/2)} वर्ष ${p%2?6:0} महिने (${p} सहामाही)`;
    }
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

$("calcService").addEventListener("click",()=>{
  const p = sixMonthlyPeriods();
  $("serviceHalfYears").value = p;
  $("serviceOutput").textContent = `अर्हताकारी सेवा: ${Math.floor(p/2)} वर्ष ${p%2?6:0} महिने (${p} सहामाही)`;
});

function calculate(){
  const basic=val("basicPay");
  const halfYears=Math.max(0,Math.floor(val("serviceHalfYears")));
  const da=val("daPercent");
  
  let pension=basic*0.50;
  if(halfYears>0 && halfYears<40) pension=basic*0.50*(halfYears/66);
  
  const gratuity=Math.min(basic*0.25*halfYears, basic*16.5, 1400000);
  const commute=document.querySelector('input[name="commute"]:checked').value==="yes";
  const cp=Math.min(40,Math.max(0,val("commutePercent")));
  
  let ageNextBirthday = currentRetirementAge + 1;
  let factor = val("commuteFactor");
  if(commutationFactors[ageNextBirthday]) {
      factor = commutationFactors[ageNextBirthday];
      $("commuteFactor").value = factor;
  }
  
  const commuted=commute ? pension*cp/100 : 0;
  const reduced=Math.max(0,pension-commuted);
  const commutationValue=commute ? commuted * 12 * factor : 0;
  
  const leave=val("leaveEncashment"), gpf=val("gpf"), gis=val("gis");
  const recovery=document.querySelector('input[name="recovery"]:checked').value==="yes"?val("recovery"):0;
  const other=val("otherDeduction");
  const pensionDA=reduced*da/100;
  const lump=Math.max(0,commutationValue+gratuity+leave+gpf+gis-recovery-other);

  $("pension").textContent=money(pension);
  $("pensionDA").textContent=money(pensionDA);
  $("commuted").textContent=money(commuted);
  $("reducedPension").textContent=money(reduced);
  $("commutationValue").textContent=money(commutationValue);
  $("gratuity").textContent=money(gratuity);
  $("leaveResult").textContent=money(leave);
  $("gpfResult").textContent=money(gpf);
  $("gisResult").textContent=money(gis);
  $("lumpSum").textContent=money(lump);
  $("reportDate").textContent=new Date().toLocaleDateString("en-IN");
  
  const typeText = $("retirementType").options[$("retirementType").selectedIndex].text;
  let deptText = "-";
  if($("department").selectedIndex > 0) {
      deptText = $("department").options[$("department").selectedIndex].text;
  }
  
  $("summary").innerHTML=`<p><b>${$("employeeName").value}</b> | ${$("designation").value||"-"} | ${$("officeName").value||"-"}</p>
  <p>विभाग: <b>${deptText}</b></p>
  <p>निवृत्ती प्रकार: ${typeText}</p>
  <p>Basic Pay: <b>${money(basic)}</b> &nbsp; | &nbsp; अर्हताकारी सेवा: <b>${halfYears} सहामाही</b></p>`;
  
  $("result").classList.remove("hidden");
  $("printBtn").style.display = "inline-block"; 
  
  return {
    name:$("employeeName").value,
    department:$("department").value,
    office:$("officeName").value,
    designation:$("designation").value,
    group:$("group").value,
    dob:$("dob").value,
    retirementType:$("retirementType").value,
    establishment:$("establishment").value,
    joiningDate:$("joiningDate").value, 
    rozandariDate:$("rozandariDate").value, 
    retirementDate:$("retirementDate").value,
    serviceHalfYears:halfYears,
    payLevel:$("payLevel").value,
    basicPay:basic,
    daPercent:da,
    commute:commute,
    commutePercent:cp,
    commuteFactor:factor,
    recovery,
    recoveryAmount:recovery,
    otherDeduction:other,
    gpf, 
    gis, 
    leaveEncashment:leave, 
    savedAt:new Date().toISOString()
  };
}

// Data saving logic to Firebase
$("pensionForm").addEventListener("submit", async e=>{
  e.preventDefault();
  
  if(!currentUser) {
      alert("माहिती सेव्ह करण्यासाठी कृपया आधी वरती 'Google ने Login करा' बटणावर क्लिक करा!");
      return;
  }
  
  const data = calculate();
  const dbRef = db.ref('users/' + currentUser.uid + '/pensionRecords');

  try {
      if(currentEditId !== null) {
          await dbRef.child(currentEditId).set(data);
          currentEditId = null;
          $("submitBtn").innerHTML = "माहिती सेव्ह करा व गणना करा";
          $("submitBtn").style.backgroundColor = "";
          $("submitBtn").style.color = "";
          alert("माहिती यशस्वीरीत्या अपडेट (Edit) झाली.");
      } else {
          await dbRef.push(data);
          alert("माहिती क्लाउडवर सेव्ह झाली व गणना पूर्ण झाली.");
      }
      fetchDataFromFirebase();
  } catch(error) {
      alert("माहिती सेव्ह करताना त्रुटी: " + error.message);
  }
});

$("printBtn").addEventListener("click",()=>{
    if($("result").classList.contains("hidden")) calculate(); 
    window.print();
});

$("resetBtn").addEventListener("click",()=>{
    $("result").classList.add("hidden");
    $("serviceOutput").textContent="";
    $("submitBtn").innerHTML = "माहिती सेव्ह करा व गणना करा";
    $("submitBtn").style.backgroundColor = "";
    $("submitBtn").style.color = "";
    $("printBtn").style.display = "none";
    currentEditId = null;
    if(window.jQuery && $('#department').length) {
        $('#department').val('').trigger('change');
    }
    toggleRozandari();
});

// Fetch Data from Firebase
function fetchDataFromFirebase() {
    if(!currentUser) return;
    const dbRef = db.ref('users/' + currentUser.uid + '/pensionRecords');
    
    dbRef.on('value', (snapshot) => {
        fetchedRecords = [];
        snapshot.forEach((childSnapshot) => {
            fetchedRecords.push({
                id: childSnapshot.key,
                data: childSnapshot.val()
            });
        });
        fetchedRecords.reverse(); 
        renderSaved();
    });
}

function renderSaved(){
  if(!currentUser){
      $("savedList").innerHTML="<p>माहिती पाहण्यासाठी लॉगिन करा.</p>";
      return;
  }
  if(!fetchedRecords.length){
      $("savedList").innerHTML="<p>अद्याप कोणतीही माहिती सेव्ह केलेली नाही.</p>";
      return;
  }
  $("savedList").innerHTML = fetchedRecords.map((recordObj, i)=>{
      let r = recordObj.data;
      let deptName = r.department ? document.querySelector(`#department option[value="${r.department}"]`)?.text : "";
      return `<div class="savedcard"><b>${r.name||"नाव नाही"}</b><br>${r.designation||""} | ${deptName||""}<br>Basic Pay ₹${Number(r.basicPay||0).toLocaleString("en-IN")} | ${r.serviceHalfYears||0} सहामाही<br><small>${new Date(r.savedAt).toLocaleString("en-IN")}</small><br><br>
      <button onclick="loadRecord(${i})" style="margin-right:10px;">उघडा / एडिट करा</button>
      <button onclick="printRecord(${i})" style="background-color:#17a2b8; color:white; margin-right:10px;">🖨️ प्रिंट</button>
      <button style="background-color:#d9534f; color:white;" onclick="deleteRecord(${i})">हटवा</button></div>`;
  }).join("");
}

window.loadRecord = function(i){
  const r = fetchedRecords[i].data;
  if(!r) return;
  
  Object.keys(r).forEach(k=>{
      if($(k)) $(k).value=r[k]
  });
  
  if(r.department && window.jQuery && $('#department').length) {
      $('#department').val(r.department).trigger('change');
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

  document.querySelector(`input[name="commute"][value="${r.commute?"yes":"no"}"]`).checked=true;
  document.querySelector(`input[name="recovery"][value="${r.recovery>0?"yes":"no"}"]`).checked=true;
  
  currentEditId = fetchedRecords[i].id; 
  document.querySelector('[data-tab="calculator"]').click(); 
  calculate();
  
  // Change submit button to Edit mode
  $("submitBtn").innerHTML = "💾 बदल सेव्ह करा (Update)";
  $("submitBtn").style.backgroundColor = "#ffc107";
  $("submitBtn").style.color = "black";
  
  window.scrollTo({top: 0, behavior: 'smooth'});
}

window.printRecord = function(i) {
    loadRecord(i);
    setTimeout(() => {
        window.print();
    }, 500);
}

window.deleteRecord = function(i){
  if(confirm("ही माहिती कायमची डिलीट करायची आहे का?")) {
      const recordId = fetchedRecords[i].id;
      db.ref('users/' + currentUser.uid + '/pensionRecords/' + recordId).remove()
      .then(() => {
          alert("माहिती डिलीट झाली.");
      })
      .catch(error => {
          alert("त्रुटी: " + error.message);
      });
  }
}

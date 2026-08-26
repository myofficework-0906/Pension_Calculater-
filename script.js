const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Math.round(Number(n)||0));
const val=id=>Number($(id).value)||0;

document.querySelectorAll(".tab").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
    document.querySelectorAll(".tabpage").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active"); $(btn.dataset.tab).classList.add("active");
    if(btn.dataset.tab==="saved") renderSaved();
  });
});

function sixMonthlyPeriods(){
  const j=$("joiningDate").value, r=$("retirementDate").value;
  if(!j||!r)return 0;
  const a=new Date(j), b=new Date(r);
  if(b<a)return 0;
  let months=(b.getFullYear()-a.getFullYear())*12+(b.getMonth()-a.getMonth());
  if(b.getDate()<a.getDate()) months--;
  return Math.floor(months/6);
}
$("calcService").addEventListener("click",()=>{
  const p=sixMonthlyPeriods();
  $("serviceHalfYears").value=p;
  $("serviceOutput").textContent=`अर्हताकारी सेवा: ${Math.floor(p/2)} वर्ष ${p%2?6:0} महिने (${p} सहामाही)`;
});

function calculate(){
  const basic=val("basicPay");
  const halfYears=Math.max(0,Math.floor(val("serviceHalfYears")));
  const da=val("daPercent");
  // Primary estimate: 50% of pensionable/basic pay after the qualifying-service threshold.
  // For cases needing proportional service calculation, use the official rule/order applicable to the case.
  let pension=basic*0.50;
  if(halfYears>0 && halfYears<40) pension=basic*0.50*(halfYears/66);
  // Minimum/maximum and special-case provisions are not hard-coded; verify current orders.
  const gratuity=Math.min(basic*0.25*halfYears, basic*16.5, 1400000);
  const commute=document.querySelector('input[name="commute"]:checked').value==="yes";
  const cp=Math.min(40,Math.max(0,val("commutePercent")));
  const factor=val("commuteFactor");
  const commuted=commute ? pension*cp/100 : 0;
  const reduced=Math.max(0,pension-commuted);
  const commutationValue=commuted*factor;
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
  $("summary").innerHTML=`<p><b>${$("employeeName").value}</b> | ${$("designation").value||"-"} | ${$("officeName").value||"-"}</p><p>Basic Pay: <b>${money(basic)}</b> &nbsp; | &nbsp; अर्हताकारी सेवा: <b>${halfYears} सहामाही</b></p>`;
  $("result").classList.remove("hidden");
  return {name:$("employeeName").value,office:$("officeName").value,designation:$("designation").value,
    group:$("group").value,dob:$("dob").value,retirementType:$("retirementType").value,establishment:$("establishment").value,
    joiningDate:$("joiningDate").value,retirementDate:$("retirementDate").value,serviceHalfYears:halfYears,payLevel:$("payLevel").value,
    basicPay:basic,daPercent:da,ageAtRetirement:val("ageAtRetirement"),commute:commute,commutePercent:cp,commuteFactor:factor,
    recovery,recoveryAmount:recovery,otherDeduction:other,gpf, gis, leaveEncashment:leave, savedAt:new Date().toISOString()};
}
$("pensionForm").addEventListener("submit",e=>{
  e.preventDefault();
  const data=calculate();
  const arr=JSON.parse(localStorage.getItem("pensionRecords")||"[]");
  arr.unshift(data); localStorage.setItem("pensionRecords",JSON.stringify(arr.slice(0,20)));
  alert("माहिती सेव्ह झाली व गणना पूर्ण झाली.");
});
$("printBtn").addEventListener("click",()=>{if($("result").classList.contains("hidden")) calculate(); window.print()});
$("resetBtn").addEventListener("click",()=>{$("result").classList.add("hidden");$("serviceOutput").textContent=""});

function renderSaved(){
  const arr=JSON.parse(localStorage.getItem("pensionRecords")||"[]");
  if(!arr.length){$("savedList").innerHTML="<p>अद्याप कोणतीही माहिती सेव्ह केलेली नाही.</p>";return}
  $("savedList").innerHTML=arr.map((r,i)=>`<div class="savedcard"><b>${r.name||"नाव नाही"}</b><br>${r.designation||""} | Basic Pay ₹${Number(r.basicPay||0).toLocaleString("en-IN")} | ${r.serviceHalfYears||0} सहामाही<br><small>${new Date(r.savedAt).toLocaleString("en-IN")}</small><br><button onclick="loadRecord(${i})">उघडा</button><button onclick="deleteRecord(${i})">हटवा</button></div>`).join("");
}
function loadRecord(i){
  const r=JSON.parse(localStorage.getItem("pensionRecords")||"[]")[i]; if(!r)return;
  Object.keys(r).forEach(k=>{if($(k)) $(k).value=r[k]});
  if($(r.commute?"":"x")){}
  document.querySelector(`input[name="commute"][value="${r.commute?"yes":"no"}"]`).checked=true;
  document.querySelector(`input[name="recovery"][value="${r.recovery>0?"yes":"no"}"]`).checked=true;
  document.querySelector('[data-tab="calculator"]').click(); calculate();
}
function deleteRecord(i){
  const arr=JSON.parse(localStorage.getItem("pensionRecords")||"[]"); arr.splice(i,1); localStorage.setItem("pensionRecords",JSON.stringify(arr)); renderSaved();
}

(function(root){
"use strict";
function number(v){if(v===null||v===undefined||String(v).trim()==="")return null;const n=Number(v);return Number.isFinite(n)?n:null}
function simpleInterest(principal,rate,years){
 const p=number(principal),r=number(rate),t=number(years);
 if(p===null||r===null||t===null||p<=0||r<0||t<=0)return {ok:false,reason:"input"};
 const interest=p*r*t/100,total=p+interest;
 return Number.isFinite(interest)&&Number.isFinite(total)?{ok:true,principal:p,interest,total}:{ok:false,reason:"overflow"};
}
function compoundInterest(principal,rate,years,frequency){
 const p=number(principal),r=number(rate),t=number(years),n=number(frequency);
 if(p===null||r===null||t===null||n===null||p<=0||r<0||t<=0||!Number.isInteger(n)||n<1||n>365)return {ok:false,reason:"input"};
 const periods=n*t,base=1+r/(100*n),total=p*Math.pow(base,periods),interest=total-p;
 return Number.isFinite(periods)&&Number.isFinite(total)&&Number.isFinite(interest)?{ok:true,principal:p,interest,total,periods}:{ok:false,reason:"overflow"};
}
function loanPayment(principal,annualRate,months){
 const p=number(principal),r=number(annualRate),n=number(months);
 if(p===null||r===null||n===null||p<=0||r<0||!Number.isInteger(n)||n<1||n>1200)return {ok:false,reason:"input"};
 const monthlyRate=r/1200;
 const payment=monthlyRate===0?p/n:p*monthlyRate/(1-Math.pow(1+monthlyRate,-n));
 const total=payment*n,interest=total-p;
 return Number.isFinite(payment)&&Number.isFinite(total)&&Number.isFinite(interest)?{ok:true,principal:p,payment,total,interest,months:n}:{ok:false,reason:"overflow"};
}
const api={simpleInterest,compoundInterest,loanPayment};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.CALCORA_FINANCE_MATH=api;
})(typeof window!=="undefined"?window:null);
